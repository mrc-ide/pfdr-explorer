import { interpolateLab } from 'd3-interpolate';
import { scaleLinear } from 'd3-scale';

export interface ColourStop {
  value: number;
  colour: string;
}

export const createSequentialScale = (stops: readonly ColourStop[]) => {
  const scale = scaleLinear<string>()
    .domain(stops.map(stop => stop.value))
    .range(stops.map(stop => stop.colour))
    .interpolate(interpolateLab)
    .clamp(true);
  return (value: number | null | undefined): string | null =>
    value == null || !Number.isFinite(value) ? null : scale(value);
};
