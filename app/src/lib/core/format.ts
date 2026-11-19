import { PERCENT_PER_WHOLE } from './adapters.ts';

const DEFAULT_LOCALE = 'en-GB';
const NOT_MODELLED = 'Not modelled';
const SMALLEST_SHOWN = 0.1;
const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

const percentFormat = (locale: string) =>
  new Intl.NumberFormat(locale, { style: 'percent', ...ONE_DECIMAL });

export const formatPercent = (value: number | null | undefined, locale = DEFAULT_LOCALE): string => {
  if (value == null || !Number.isFinite(value)) return NOT_MODELLED;
  if (value > 0 && value < SMALLEST_SHOWN) {
    return `<${percentFormat(locale).format(SMALLEST_SHOWN / PERCENT_PER_WHOLE)}`;
  }
  return percentFormat(locale).format(value / PERCENT_PER_WHOLE);
};

export const formatInterval = (lower: number | null, upper: number | null, locale = DEFAULT_LOCALE): string => {
  if (lower == null || upper == null) return NOT_MODELLED;
  const number = new Intl.NumberFormat(locale, ONE_DECIMAL);
  return `${number.format(lower)}–${number.format(upper)}%`;
};
