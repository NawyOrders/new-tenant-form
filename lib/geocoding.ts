// This file is the ONLY place that talks to Nominatim (the free OpenStreetMap geocoding service).
// No API key is needed.
//
// IMPORTANT: Nominatim allows at most 1 request per second.
// Never call it on every keystroke or on every mouse move: only when the user asks for it
// (the "search address" button, the Enter key, or the end of a marker drag).

import type { GeoAddress, GeoResult, Lang } from "./types";

/** The base address of the Nominatim service. */
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/** What Nominatim sends back for a search. We only read these fields. */
type NominatimPlace = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

/** What Nominatim sends back for a reverse search. */
type NominatimReverse = {
  display_name?: string;
};

/** Keeps 6 decimal places, as the Branch type asks for. */
function round6(value: number): number {
  return Number(value.toFixed(6));
}

/**
 * Turns an address text into coordinates.
 * Returns null when nothing was found or when the service is not reachable.
 */
export async function searchAddress(query: string, lang: Lang): Promise<GeoResult | null> {
  const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=eg&accept-language=${lang}&limit=1`;

  try {
    const response: Response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const places: unknown = await response.json();

    if (!Array.isArray(places) || places.length === 0) {
      return null;
    }

    const place = places[0] as NominatimPlace;
    const latitude: number = Number(place.lat);
    const longitude: number = Number(place.lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude) || typeof place.display_name !== "string") {
      return null;
    }

    return {
      latitude: round6(latitude),
      longitude: round6(longitude),
      displayName: place.display_name,
    };
  } catch {
    return null;
  }
}

/**
 * Turns coordinates into an address text.
 * Returns null when nothing was found or when the service is not reachable.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  lang: Lang,
): Promise<GeoAddress | null> {
  const url = `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=${lang}`;

  try {
    const response: Response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const place = (await response.json()) as NominatimReverse;

    if (typeof place.display_name !== "string" || place.display_name === "") {
      return null;
    }

    return { displayName: place.display_name };
  } catch {
    return null;
  }
}
