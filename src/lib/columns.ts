import type { IColumnConfig } from '@svar-ui/svelte-grid';
import DateCell from '$lib/components/DateCell.svelte';
import TimeCell from '$lib/components/TimeCell.svelte';
import TempCell from '$lib/components/TempCell.svelte';
import HumidityCell from '$lib/components/HumidityCell.svelte';
import CloudCell from '$lib/components/CloudCell.svelte';
import RainCell from '$lib/components/RainCell.svelte';
import RainDescriptionCell from '$lib/components/RainDescriptionCell.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dayLong = (_: any, row: any) =>
  (row.dateTime as Date).toLocaleDateString('fr-FR', { weekday: 'long' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dayShort = (_: any, row: any) =>
  (row.dateTime as Date).toLocaleDateString('fr-FR', { weekday: 'short' });

export function createForecastColumns(): IColumnConfig[] {
  return [
    { id: 'day', header: 'Day', width: 110, sort: true, template: dayLong },
    { id: 'date', header: 'Date', width: 130, sort: true, cell: DateCell },
    { id: 'time', header: 'Time', width: 80, sort: true, cell: TimeCell },
    { id: 'temp', header: 'Temp', width: 80, sort: true, cell: TempCell },
    { id: 'humidity', header: 'Humidity', width: 90, sort: true, cell: HumidityCell },
    { id: 'cloud', header: 'Cloud', width: 80, sort: true, cell: CloudCell },
    { id: 'rain', header: 'Rain', width: 80, sort: true, cell: RainCell }
  ];
}

export const forecastResponsive = {
  600: {
    columns: [
      { id: 'day', header: 'Day', width: 55, sort: true, template: dayShort, flexgrow: 1 },
      { id: 'date', header: 'Date', width: 70, sort: true, cell: DateCell, flexgrow: 1 },
      { id: 'time', header: 'Time', width: 70, sort: true, cell: TimeCell, flexgrow: 1 },
      { id: 'temp', header: 'Temp', width: 75, sort: true, cell: TempCell, flexgrow: 1 },
      { id: 'humidity', header: 'Hum.', width: 70, sort: true, cell: HumidityCell, flexgrow: 1 },
      { id: 'cloud', header: 'Cloud', width: 65, sort: true, cell: CloudCell, flexgrow: 1 },
      { id: 'rain', header: 'Rain', width: 55, sort: true, cell: RainCell }
    ]
  },
  420: {
    columns: [
      { id: 'day', hidden: true, template: dayShort },
      { id: 'date', header: 'Date', width: 60, sort: true, cell: DateCell, flexgrow: 1 },
      { id: 'time', header: 'Time', width: 65, sort: true, cell: TimeCell, flexgrow: 1 },
      { id: 'temp', header: 'Temp', width: 70, sort: true, cell: TempCell, flexgrow: 1 },
      { id: 'humidity', header: 'Hum.', width: 65, sort: true, cell: HumidityCell, flexgrow: 1 },
      { id: 'cloud', header: 'Cloud', width: 60, sort: true, cell: CloudCell, flexgrow: 1 },
      { id: 'rain', header: 'Rain', width: 50, sort: true, cell: RainCell }
    ]
  }
};

export function createRainColumns(): IColumnConfig[] {
  return [
    {
      id: 'time',
      header: 'Time',
      width: 100,
      sort: true,
      template: (v: string) =>
        new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'description',
      header: 'Rain',
      width: 200,
      cell: RainDescriptionCell
    }
  ];
}

export const rainResponsive = {
  600: {
    columns: [
      {
        id: 'time',
        header: 'Time',
        width: 70,
        sort: true,
        template: (v: string) =>
          new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'description',
        header: 'Rain',
        width: 60,
        cell: RainDescriptionCell,
        flexgrow: 1
      }
    ]
  }
};
