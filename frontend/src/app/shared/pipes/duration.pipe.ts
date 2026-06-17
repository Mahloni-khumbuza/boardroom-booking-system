import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration', standalone: true, pure: true })
export class DurationPipe implements PipeTransform {
  /** Formats minutes (number) or two ISO date strings into a human-readable duration. */
  transform(start: string | number, end?: string): string {
    let minutes: number;
    if (typeof start === 'number') {
      minutes = start;
    } else if (end) {
      minutes = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
    } else {
      return '';
    }
    if (!Number.isFinite(minutes) || minutes < 0) return '';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}
