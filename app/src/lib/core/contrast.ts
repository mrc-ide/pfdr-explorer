import { rgb } from 'd3-color';

const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (colour: string): number => {
    const { r, g, b } = rgb(colour);
    if (! [r, g, b].every(Number.isFinite)) {
        throw new Error(`"${colour}" is not a colour.`);
    }
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

export const contrastRatio = (first: string, second: string): number => {
    const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
};

export const readableInk = (background: string, dark: string, light: string): string => {
    return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
};