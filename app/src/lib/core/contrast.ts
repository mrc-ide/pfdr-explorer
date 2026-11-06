import { rgb } from 'd3-color';

const CHANNEL_MAX = 255;

const SRGB_CURVE = {
    straightUpTo: 0.04045,
    straightSlope: 12.92,
    offset: 0.055,
    exponent: 2.4,
} as const;

const BRIGHTNESS_WEIGHT = {
    red: 0.2126,
    green: 0.7152,
    blue: 0.0722,
} as const;

const SCREEN_FLARE = 0.05;

const linear = (channel: number) => {
    const value = channel / CHANNEL_MAX;
    if (value <= SRGB_CURVE.straightUpTo) {
        return value / SRGB_CURVE.straightSlope;
    }
    return ((value + SRGB_CURVE.offset) / 1.055) ** SRGB_CURVE.exponent;
};

export const relativeLuminance = (colour: string): number => {
    const { r, g, b } = rgb(colour);
    if (! [r, g, b].every(Number.isFinite)) {
        throw new Error(`"${colour}" is not a colour.`);
    }
    return (
        BRIGHTNESS_WEIGHT.red * linear(r) +
        BRIGHTNESS_WEIGHT.green * linear(g) +
        BRIGHTNESS_WEIGHT.blue * linear(b)
    );
};

export const contrastRatio = (first: string, second: string): number => {
    const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
    return (lighter + SCREEN_FLARE) / (darker + SCREEN_FLARE);
};

export const readableInk = (background: string, dark: string, light: string): string => {
    return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
};
