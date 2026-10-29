// This file reads the dominant colors of a logo in the browser. The picture is drawn on a
// small canvas (64x64 at most), the transparent, near white, near black and grey pixels are
// dropped, and a small k-means keeps the six biggest color groups.
// No backend and no library are involved; a failure returns an empty list.

/** One color, from 0 to 255 per channel. */
export type Rgb = { r: number; g: number; b: number };

/** The longest side of the canvas the logo is drawn on. */
const SAMPLE_SIZE = 64;

/** How many color groups are kept. */
const CLUSTERS = 6;

/** The maximum number of k-means passes. */
const ITERATIONS = 12;

/** A pixel below this alpha is transparent, so it is not a color of the logo. */
const ALPHA_MIN = 125;

/** Every channel at or above this value is a near white pixel. */
const NEAR_WHITE = 240;

/** Every channel at or below this value is a near black pixel. */
const NEAR_BLACK = 24;

/** A channel spread below this value is a grey pixel. */
const GREY_SPREAD = 18;

/**
 * Reads up to six dominant colors of the logo, the biggest group first.
 * An empty list means the picture could not be read or has no usable color.
 */
export async function extractDominantColors(file: File): Promise<Rgb[]> {
  if (typeof document === "undefined") {
    return [];
  }

  const url: string = URL.createObjectURL(file);

  try {
    const image: HTMLImageElement = await loadImage(url);
    const pixels: Rgb[] = readPixels(image);
    return pixels.length === 0 ? [] : kMeans(pixels);
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The logo could not be read"));
    image.src = url;
  });
}

/** Draws the logo on a small canvas and keeps the pixels that are a real color. */
function readPixels(image: HTMLImageElement): Rgb[] {
  const width: number = image.naturalWidth;
  const height: number = image.naturalHeight;

  if (width === 0 || height === 0) {
    return [];
  }

  const scale: number = Math.min(SAMPLE_SIZE / width, SAMPLE_SIZE / height, 1);
  const sampleWidth: number = Math.max(1, Math.round(width * scale));
  const sampleHeight: number = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("The browser did not give a canvas context");
  }

  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const data: Uint8ClampedArray = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const pixels: Rgb[] = [];

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < ALPHA_MIN) {
      continue;
    }

    const pixel: Rgb = { r: data[index], g: data[index + 1], b: data[index + 2] };
    if (isUseful(pixel)) {
      pixels.push(pixel);
    }
  }

  return pixels;
}

/** Drops the transparent, the near white, the near black and the grey pixels. */
function isUseful(color: Rgb): boolean {
  const max: number = Math.max(color.r, color.g, color.b);
  const min: number = Math.min(color.r, color.g, color.b);

  if (min >= NEAR_WHITE || max <= NEAR_BLACK) {
    return false;
  }

  return max - min >= GREY_SPREAD;
}

function distanceSq(a: Rgb, b: Rgb): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

/** The starting centers: the first pixel, then the pixel farthest from the chosen ones. */
function seedCenters(pixels: Rgb[], count: number): Rgb[] {
  const centers: Rgb[] = [pixels[0]];

  while (centers.length < count) {
    let best: Rgb = pixels[0];
    let bestDistance = -1;

    for (const pixel of pixels) {
      let distance = Number.POSITIVE_INFINITY;

      for (const center of centers) {
        distance = Math.min(distance, distanceSq(pixel, center));
      }

      if (distance > bestDistance) {
        bestDistance = distance;
        best = pixel;
      }
    }

    centers.push(best);
  }

  return centers.map((center) => ({ ...center }));
}

/** Groups the pixels in a few colors, biggest group first. */
function kMeans(pixels: Rgb[]): Rgb[] {
  const count: number = Math.min(CLUSTERS, pixels.length);
  let centers: Rgb[] = seedCenters(pixels, count);
  const labels: number[] = pixels.map(() => -1);

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const totals = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    let changed = false;

    pixels.forEach((pixel, index) => {
      let nearest = 0;
      let nearestDistance = distanceSq(pixel, centers[0]);

      for (let centerIndex = 1; centerIndex < centers.length; centerIndex += 1) {
        const distance = distanceSq(pixel, centers[centerIndex]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = centerIndex;
        }
      }

      if (labels[index] !== nearest) {
        labels[index] = nearest;
        changed = true;
      }

      const total = totals[nearest];
      total.r += pixel.r;
      total.g += pixel.g;
      total.b += pixel.b;
      total.count += 1;
    });

    centers = centers.map((center, index) => {
      const total = totals[index];
      return total.count === 0
        ? center
        : { r: total.r / total.count, g: total.g / total.count, b: total.b / total.count };
    });

    if (!changed) {
      break;
    }
  }

  const sizes: number[] = centers.map(() => 0);
  labels.forEach((label) => {
    sizes[label] += 1;
  });

  return centers
    .map((center, index) => ({ center, size: sizes[index] }))
    .filter((group) => group.size > 0)
    .sort((a, b) => b.size - a.size)
    .map((group) => ({
      r: Math.round(group.center.r),
      g: Math.round(group.center.g),
      b: Math.round(group.center.b),
    }));
}
