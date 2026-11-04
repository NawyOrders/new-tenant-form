// Unit tests for the browser palette builder (lib/palette/buildPalettes.ts).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildPalettes } from "../../lib/palette/buildPalettes";
import type { BuiltPalette } from "../../lib/palette/buildPalettes";
import type { Rgb } from "../../lib/palette/extractPalette";
import { theme } from "../../lib/theme";

const HEX_PATTERN = /^#[0-9A-F]{6}$/;

function luminance(color: Rgb): number {
  const channel = (value: number): number => {
    const v: number = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function toRgb(hex: string): Rgb {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

const RED: Rgb = { r: 200, g: 50, b: 50 };
const BLUE: Rgb = { r: 20, g: 60, b: 200 };
const GREEN: Rgb = { r: 40, g: 120, b: 60 };

describe("buildPalettes", () => {
  test("returns no palette for an empty color list", () => {
    assert.deepEqual(buildPalettes([]), []);
  });

  test("returns exactly three palettes in the brand, dark, contrast order", () => {
    const palettes = buildPalettes([RED, BLUE, GREEN]);

    assert.equal(palettes.length, 3);
    assert.deepEqual(
      palettes.map((palette) => palette.name),
      ["brand", "dark", "contrast"],
    );
  });

  test("writes every color as an uppercase #RRGGBB value", () => {
    const palettes = buildPalettes([RED, BLUE, GREEN]);

    for (const palette of palettes) {
      assert.match(palette.primaryColor, HEX_PATTERN);
      assert.match(palette.backgroundColor, HEX_PATTERN);
      assert.match(palette.accentColor, HEX_PATTERN);
    }
  });

  test("uses the most saturated large group as the brand and dark primary", () => {
    const palettes = buildPalettes([RED, BLUE, GREEN]);

    assert.equal(palettes[0].primaryColor, "#143CC8");
    assert.equal(palettes[1].primaryColor, "#143CC8");
  });

  test("uses the first other group with a different hue as the brand accent", () => {
    const palettes = buildPalettes([RED, BLUE, GREEN]);

    assert.equal(palettes[0].accentColor, "#28783C");
  });

  test("keeps the brand background lighter than the dark background", () => {
    const palettes: BuiltPalette[] = buildPalettes([RED, BLUE, GREEN]);
    const brandBackground = luminance(toRgb(palettes[0].backgroundColor));
    const darkBackground = luminance(toRgb(palettes[1].backgroundColor));

    assert.ok(brandBackground > darkBackground);
    assert.ok(brandBackground > 0.5);
    assert.ok(darkBackground < 0.1);
  });

  test("uses white as the contrast background and a dark primary", () => {
    const palettes = buildPalettes([RED, BLUE, GREEN]);
    const contrastPalette = palettes[2];

    assert.equal(contrastPalette.backgroundColor, "#FFFFFF");
    assert.ok(luminance(toRgb(contrastPalette.primaryColor)) < luminance({ r: 255, g: 255, b: 255 }));
  });

  test("uses a light neutral accent on the dark palette", () => {
    const palettes = buildPalettes([RED, BLUE, GREEN]);

    assert.equal(palettes[1].accentColor, theme.border);
  });

  test("builds all three palettes from a single color", () => {
    const palettes = buildPalettes([RED]);

    assert.equal(palettes.length, 3);
    assert.equal(palettes[0].primaryColor, "#C83232");
    assert.equal(palettes[1].primaryColor, "#C83232");
    assert.match(palettes[0].accentColor, HEX_PATTERN);
    assert.notEqual(palettes[0].accentColor, palettes[0].primaryColor);
  });

  test("does not mutate the input colors", () => {
    const input: Rgb[] = [RED, BLUE, GREEN];
    const copy: Rgb[] = input.map((color) => ({ ...color }));

    buildPalettes(input);

    assert.deepEqual(input, copy);
  });
});
