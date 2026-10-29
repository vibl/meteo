// API response types from Meteo France
export interface ForecastHour {
  time: string;
  // Beyond the hourly horizon MF nulls these out (temp/humidity drop off the
  // far days; rain_1h is null once it switches to 3h/6h buckets).
  T: number | null;
  relative_humidity: number | null;
  total_cloud_cover: number;
  rain_1h: number | null;
  weather_description: string;
}

export interface ForecastResponse {
  properties: {
    forecast: ForecastHour[];
  };
}

export interface RainNowcastEntry {
  time: string;
  rain_intensity: number;
  rain_intensity_description: string;
}

export interface RainNowcastResponse {
  properties: {
    forecast: RainNowcastEntry[];
  };
}

// Grid row types (transformed for display)
export interface ForecastRow {
  id: string; // ISO timestamp for row key
  dateTime: Date;
  timestamp: number;
  temp: number;
  humidity: number;
  cloud: number;
  rain: number | null;
}

export interface RainRow {
  id: string;
  time: string;
  rain_intensity: number;
  description: string;
}

// Sunrise/sunset times (parsed to Date objects)
export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}
