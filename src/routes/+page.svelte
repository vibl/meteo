<script lang="ts">
  import { untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { fetchForecast, fetchRainNowcast, fetchSunriseSunset } from '$lib/api';
  import { notifyRainStopped, requestNotificationPermission } from '$lib/notify';
  import type {
    ForecastResponse,
    RainNowcastResponse,
    ForecastRow,
    RainRow,
    SunTimes
  } from '$lib/types';
  import ForecastGrid from '$lib/components/ForecastGrid.svelte';
  import RainNowcastGrid from '$lib/components/RainNowcastGrid.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  import { RefreshCw } from '@lucide/svelte';
  import { getGlobalActivityDetector } from '$lib/activity';

  const BIRDS_ALERT_KEY = 'meteo:birds-alert-enabled';
  const BIRDS_ALERT_POLL_MS = 10 * 60 * 1000;

  let forecastRows = $state<ForecastRow[]>([]);
  let rainRows = $state<RainRow[]>([]);
  let sunTimes = $state<SunTimes | null>(null);
  let isLoading = $state(false);
  let isRefreshing = $state(false);
  let error = $state<string | null>(null);
  let currentRowId = $state<string | null>(null);
  let lastUpdated = $state<Date | null>(null);
  let timeAgoText = $state<string>('');

  // Birds-on-rain-stop alert state. Persisted to localStorage; hydrated on mount.
  let birdsAlertEnabled = $state(false);
  // Gates the notification-permission request: hydrating the checkbox from
  // localStorage is not a user gesture, so it must not ask.
  let hydrated = false;
  // Whether the previous nowcast snapshot showed any rain. `null` until first
  // load completes — that gate avoids firing on the very first fetch.
  let previousHadRain: boolean | null = null;
  let birdsAudio = $state<HTMLAudioElement | null>(null);

  // MF rain_intensity scale: 1 = Temps sec (dry), 2+ = some rain.
  function hasAnyRain(rows: RainRow[]): boolean {
    return rows.some((r) => r.rain_intensity > 1);
  }

  function playBirds() {
    const audio = birdsAudio;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch((e) => console.warn('Birds audio playback failed:', e));
  }

  // Turning the alert on is the user gesture the permission prompt needs.
  function onBirdsAlertChange(checked: boolean) {
    if (!hydrated || !checked) return;
    void requestNotificationPermission();
  }

  // Format elapsed time as human-readable duration
  function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Show loading state only when there's no data yet
  const isInitialLoading = $derived(forecastRows.length === 0);

  const activity = getGlobalActivityDetector();

  // Parse time string like "6:45:12 AM" to Date object for today
  function parseTimeToDate(timeStr: string): Date {
    const today = new Date();
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    today.setHours(hour24, minutes, 0, 0);
    return today;
  }

  // Transform API forecast response to grid rows.
  // Drops rows older than the last 3 hours so the list always starts with
  // the 3 most recent past hours and never includes anything older.
  // Also drops rows with no temperature: beyond the forecast horizon MF returns
  // entries with null temp/humidity, so those (and the trailing dataless days
  // they form) would otherwise render as empty rows.
  function transformForecast(apiData: ForecastResponse): ForecastRow[] {
    const cutoff = Date.now() - 3 * 60 * 60 * 1000;
    return apiData.properties.forecast.flatMap((o) => {
      if (o.T === null || o.relative_humidity === null) return [];
      const dateTime = new Date(o.time);
      const timestamp = dateTime.getTime();
      if (timestamp < cutoff) return [];
      return [
        {
          id: o.time,
          dateTime,
          timestamp,
          temp: o.T,
          humidity: o.relative_humidity,
          cloud: o.total_cloud_cover,
          rain: o.rain_1h
        }
      ];
    });
  }

  // Transform API rain response to grid rows
  function transformRain(apiData: RainNowcastResponse): RainRow[] {
    return apiData.properties.forecast.map((o) => ({
      id: o.time,
      time: o.time,
      rain_intensity: o.rain_intensity,
      description: o.rain_intensity_description
    }));
  }

  // Find current time row and return its ID
  function selectCurrentRow(rows: ForecastRow[]): string | null {
    const now = Date.now();
    const idx = rows.findIndex((row) => now < row.timestamp);
    // Return the row just before the first future row (current hour)
    if (idx > 0) return rows[idx - 1].id;
    // If all rows are in the past, return the last one
    if (idx === -1 && rows.length > 0) return rows[rows.length - 1].id;
    // If all rows are in the future, return the first one
    if (rows.length > 0) return rows[0].id;
    return null;
  }

  // Load weather data
  async function loadData() {
    // Prevent concurrent loads
    if (isLoading || isRefreshing) return;

    const hasData = forecastRows.length > 0;
    if (hasData) {
      isRefreshing = true;
    } else {
      isLoading = true;
    }
    error = null;

    try {
      // Fetch forecast, rain, and sun times in parallel.
      // The MF auth token is fetched server-side inside the endpoints to avoid
      // client-side caching of an expiring token. Each call hits the server
      // fresh, so refresh and initial load take the same path.
      const [forecastData, rainData, sunData] = await Promise.all([
        fetchForecast(),
        fetchRainNowcast(),
        fetchSunriseSunset()
      ]);

      forecastRows = transformForecast(forecastData);
      const newRainRows = transformRain(rainData);
      const newHasRain = hasAnyRain(newRainRows);
      // Trigger only on a real transition: previous snapshot had rain, current
      // is fully dry. `previousHadRain === null` gates out the first fetch.
      if (birdsAlertEnabled && previousHadRain === true && !newHasRain) {
        playBirds();
        notifyRainStopped().catch((e) => console.warn('Rain-stopped notification failed:', e));
      }
      previousHadRain = newHasRain;
      rainRows = newRainRows;
      sunTimes = {
        sunrise: parseTimeToDate(sunData.sunrise),
        sunset: parseTimeToDate(sunData.sunset)
      };

      // Select current row
      currentRowId = selectCurrentRow(forecastRows);
      lastUpdated = new Date();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load weather data';
      console.error('Error loading weather data:', e);
    } finally {
      isLoading = false;
      isRefreshing = false;
    }
  }

  // Hydrate birds-alert preference from localStorage on mount.
  $effect(() => {
    if (!browser) return;
    const stored = localStorage.getItem(BIRDS_ALERT_KEY);
    if (stored !== null) birdsAlertEnabled = stored === 'true';
    hydrated = true;
  });

  // Persist birds-alert preference whenever it changes.
  $effect(() => {
    if (!browser) return;
    localStorage.setItem(BIRDS_ALERT_KEY, String(birdsAlertEnabled));
  });

  // Load data on mount (untrack to prevent reactive loop)
  $effect(() => {
    untrack(loadData);
  });

  // Refresh when user becomes active (tab visibility, mouse/keyboard activity)
  $effect(() => {
    const unsubscribe = activity.subscribe((isActive) => {
      if (isActive) {
        loadData();
      }
    });

    return unsubscribe;
  });

  // While the birds-on-rain-stop alert is enabled, poll every 10 minutes so
  // the rain → no-rain transition is detected even when the tab is idle.
  $effect(() => {
    if (!birdsAlertEnabled) return;
    const interval = setInterval(loadData, BIRDS_ALERT_POLL_MS);
    return () => clearInterval(interval);
  });

  // Auto-update current row selection every 30 seconds
  $effect(() => {
    if (forecastRows.length === 0) return;

    const interval = setInterval(() => {
      currentRowId = selectCurrentRow(forecastRows);
    }, 30000);

    return () => clearInterval(interval);
  });

  // Update "time ago" counter every second
  $effect(() => {
    if (!lastUpdated) return;

    // Update immediately
    timeAgoText = formatTimeAgo(lastUpdated);

    const interval = setInterval(() => {
      if (lastUpdated) {
        timeAgoText = formatTimeAgo(lastUpdated);
      }
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Meteo - Nogent-sur-Marne</title>
</svelte:head>

<div class="flex h-full flex-col gap-4 py-4 pr-1 pl-4 md:flex-row">
  <!-- Left column: Location info -->
  <div class="flex w-full flex-shrink-0 flex-col gap-3 md:w-64">
    <div class="flex flex-row items-center gap-3 md:flex-col md:items-stretch">
      <h1 class="flex-1 text-lg font-semibold md:flex-none">Nogent-sur-Marne</h1>
      <Button
        variant="outline"
        size="icon-sm"
        onclick={loadData}
        disabled={isLoading || isRefreshing}
        aria-label="Refresh"
        class="md:hidden"
      >
        <RefreshCw class={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onclick={loadData}
        disabled={isLoading || isRefreshing}
        class="hidden md:flex"
      >
        <RefreshCw class={`mr-2 h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      {#if lastUpdated}
        <p class="text-sm text-muted-foreground">
          <span class="md:hidden">{timeAgoText}</span>
          <span class="hidden md:inline"
            >Updated: {lastUpdated.toLocaleTimeString('fr-FR')} ({timeAgoText})</span
          >
        </p>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <Checkbox
        id="birds-alert"
        bind:checked={birdsAlertEnabled}
        onCheckedChange={onBirdsAlertChange}
      />
      <Label for="birds-alert" class="cursor-pointer text-sm font-normal">
        Play birds when rain stops
      </Label>
    </div>
    <audio bind:this={birdsAudio} src="/birds-singing.mp3" preload="auto"></audio>
    {#if error}
      <div
        class="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
      >
        {error}
      </div>
    {/if}
  </div>

  <!-- Main content -->
  <div class="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
    <!-- Forecast grid -->
    <div class="min-h-0 flex-[1.5] md:flex-none">
      <ForecastGrid rows={forecastRows} {currentRowId} isLoading={isInitialLoading} {sunTimes} />
    </div>

    <!-- Rain nowcast grid -->
    <div class="min-h-0 flex-1 md:flex-none">
      <RainNowcastGrid rows={rainRows} isLoading={isInitialLoading} />
    </div>
  </div>
</div>
