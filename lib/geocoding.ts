// This file is the ONLY place that talks to Nominatim (the free OpenStreetMap geocoding service).
// No API key is needed.
//
// IMPORTANT: Nominatim allows at most 1 request per second.
// Never call it on every keystroke or on every mouse move: only when the user asks for it
// (the "search address" button, the Enter key, or the end of a marker drag).

import type { GeoAddress, GeoAddressParts, GeoResult, Lang } from "./types";

/** The base address of the Nominatim service. */
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/** The address object of Nominatim. Only these fields are read. */
type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  city_district?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
};

/** What Nominatim sends back for a search. We only read these fields. */
type NominatimPlace = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
};

/** What Nominatim sends back for a reverse search. */
type NominatimReverse = {
  display_name?: string;
  address?: NominatimAddress;
};

/** Keeps 6 decimal places, as the Branch type asks for. */
function round6(value: number): number {
  return Number(value.toFixed(6));
}

/** A non-empty text, or null when the service did not send it. */
function readText(value: string | undefined): string | null {
  return value === undefined || value === "" ? null : value;
}

/** Reads the address parts. A part the service did not send stays null. */
function readAddressParts(address: NominatimAddress | undefined): GeoAddressParts | undefined {
  if (address === undefined) {
    return undefined;
  }

  const city: string | null =
    readText(address.city) ??
    readText(address.town) ??
    readText(address.village) ??
    readText(address.city_district);
  const countryCode: string | null = readText(address.country_code);

  return {
    city,
    region: readText(address.state),
    postalCode: readText(address.postcode),
    countryCode: countryCode === null ? null : countryCode.toUpperCase(),
  };
}

/**
 * Turns an address text into coordinates.
 * Returns null when nothing was found or when the service is not reachable.
 */
export async function searchAddress(
  query: string,
  lang: Lang,
  signal?: AbortSignal,
): Promise<GeoResult | null> {
  const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(query)}&countrycodes=eg&accept-language=${lang}&limit=1`;

  try {
    const response: Response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
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
      addressParts: readAddressParts(place.address),
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
  const url = `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}&accept-language=${lang}`;

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

    return { displayName: place.display_name, addressParts: readAddressParts(place.address) };
  } catch {
    return null;
  }
}
