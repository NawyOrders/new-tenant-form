// This file turns the dominant colors of the logo into exactly three palettes: the brand
// colors, a dark mode and a high contrast set. The background is adjusted until the text and
// the primary color are readable; the primary color itself is never changed.

import { theme } from "../theme";
import type { Rgb } from "./extractPalette";

/** The three palettes of step 2. */
export type PaletteName = "brand" | "dark" | "contrast";

export type BuiltPalette = {
  name: PaletteName;
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
};

/** A color in the HSL model: the hue in degrees, the saturation and the lightness from 0 to 1. */
type Hsl = { h: number; s: number; l: number };

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

/** The smallest contrast the text needs against its background (WCAG AA). */
const MIN_TEXT_CONTRAST = 4.5;

/** The smallest contrast the primary color needs against the background. */
const MIN_PRIMARY_CONTRAST = 3;

/** Two hues closer than this many degrees count as the same color. */
const HUE_MATCH = 25;

export function buildPalettes(colors: Rgb[]): BuiltPalette[] {
  if (colors.length === 0) {
    return [];
  }

  // The colors arrive biggest group first, so the first three are the large groups.
  const primary: Rgb = mostSaturated(colors.slice(0, 3));

  return [brandPalette(colors, primary), darkPalette(primary), contrastPalette(colors)];
}

/** The most saturated color of the large groups, the biggest one on a tie. */
function mostSaturated(groups: Rgb[]): Rgb {
  let best: Rgb = groups[0];

  for (const color of groups) {
    if (toHsl(color).s > toHsl(best).s) {
      best = color;
    }
  }

  return best;
}

function brandPalette(groups: Rgb[], primary: Rgb): BuiltPalette {
  const background: Rgb = adjustBackground(
    primary,
    lightBackground(primary),
    toRgb(theme.text),
    WHITE,
  );
  const second: Rgb | undefined = groups.find(
    (color, index) => index > 0 && hueDistance(toHsl(color), toHsl(primary)) >= HUE_MATCH,
  );
  const accent: Rgb = second ?? mix(primary, WHITE, 0.35);

  return {
    name: "brand",
    primaryColor: toHex(primary),
    backgroundColor: toHex(background),
    accentColor: toHex(accent),
  };
}

function darkPalette(primary: Rgb): BuiltPalette {
  const background: Rgb = adjustBackground(primary, darkBackground(primary), WHITE, BLACK);

  return {
    name: "dark",
    primaryColor: toHex(primary),
    backgroundColor: toHex(background),
    // A light neutral, so the accent stays visible on a dark background.
    accentColor: theme.border,
  };
}

function contrastPalette(groups: Rgb[]): BuiltPalette {
  const dark: Rgb[] = groups.filter((color) => toHsl(color).l < 0.45);
  const readable: Rgb | undefined = dark.find(
    (color) => contrast(color, WHITE) >= MIN_PRIMARY_CONTRAST,
  );
  const primary: Rgb = readable ?? dark[0] ?? darkest(groups);
  const accent: Rgb = farthestHue(groups, primary) ?? fromHsl({
    ...toHsl(primary),
    h: toHsl(primary).h + 180,
  });

  return {
    name: "contrast",
    primaryColor: toHex(primary),
    // White gives the strongest contrast; the primary color is never changed.
    backgroundColor: toHex(WHITE),
    accentColor: toHex(accent),
  };
}

/** Starts from a very light tint of the primary color. */
function lightBackground(primary: Rgb): Rgb {
  let background: Rgb = mix(primary, WHITE, 0.9);

  for (let step = 0; step < 10 && toHsl(background).l < 0.95; step += 1) {
    background = mix(background, WHITE, 0.5);
  }

  return background;
}

/** Starts from a very dark shade of the primary color. */
function darkBackground(primary: Rgb): Rgb {
  let background: Rgb = mix(primary, BLACK, 0.9);

  for (let step = 0; step < 10 && toHsl(background).l > 0.12; step += 1) {
    background = mix(background, BLACK, 0.5);
  }

  return background;
}

/** Moves only the background, toward white or black, until both contrasts pass. */
function adjustBackground(primary: Rgb, start: Rgb, text: Rgb, toward: Rgb): Rgb {
  let background: Rgb = start;

  for (let step = 0; step < 20; step += 1) {
    if (
      contrast(text, background) >= MIN_TEXT_CONTRAST &&
      contrast(primary, background) >= MIN_PRIMARY_CONTRAST
    ) {
      return background;
    }

    background = mix(background, toward, 0.15);
  }

  // A very light primary can never reach 3:1, even on white. The darkest or lightest
  // background is the best this palette can do, because the primary color stays as it is.
  return background;
}

/** The color of the biggest group whose hue is the farthest from the primary one. */
function farthestHue(groups: Rgb[], primary: Rgb): Rgb | null {
  const base: Hsl = toHsl(primary);
  let best: Rgb | null = null;
  let bestDistance = HUE_MATCH;

  for (const color of groups) {
    const distance: number = hueDistance(toHsl(color), base);

    if (distance > bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }

  return best;
}

function darkest(groups: Rgb[]): Rgb {
  let best: Rgb = groups[0];

  for (const color of groups) {
    if (luminance(color) < luminance(best)) {
      best = color;
    }
  }

  return best;
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  };
}

function toHex(color: Rgb): string {
  const channel = (value: number): string =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");

  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`.toUpperCase();
}

function toRgb(hex: string): Rgb {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function toHsl(color: Rgb): Hsl {
  const r: number = color.r / 255;
  const g: number = color.g / 255;
  const b: number = color.b / 255;
  const max: number = Math.max(r, g, b);
  const min: number = Math.min(r, g, b);
  const l: number = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const delta: number = max - min;
  const s: number = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h: number;

  if (max === r) {
    h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / delta + 2) / 6;
  } else {
    h = ((r - g) / delta + 4) / 6;
  }

  return { h: h * 360, s, l };
}

function fromHsl(hsl: Hsl): Rgb {
  const h: number = (((hsl.h % 360) + 360) % 360) / 360;

  if (hsl.s === 0) {
    const value: number = Math.round(hsl.l * 255);
    return { r: value, g: value, b: value };
  }

  const q: number = hsl.l < 0.5 ? hsl.l * (1 + hsl.s) : hsl.l + hsl.s - hsl.l * hsl.s;
  const p: number = 2 * hsl.l - q;
  const channel = (input: number): number => {
    let t: number = input;

    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return {
    r: Math.round(channel(h + 1 / 3) * 255),
    g: Math.round(channel(h) * 255),
    b: Math.round(channel(h - 1 / 3) * 255),
  };
}

function luminance(color: Rgb): number {
  const channel = (value: number): number => {
    const v: number = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrast(a: Rgb, b: Rgb): number {
  const first: number = luminance(a);
  const second: number = luminance(b);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function hueDistance(a: Hsl, b: Hsl): number {
  const distance: number = Math.abs(a.h - b.h) % 360;
  return distance > 180 ? 360 - distance : distance;
}
