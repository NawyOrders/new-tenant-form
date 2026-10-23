// This file is the map of ONE branch: OpenStreetMap tiles with the default styling,
// a draggable marker made with L.divIcon, and a click that picks the location.
// Leaflet needs the browser, so BranchCard loads this file with next/dynamic and { ssr: false }.

"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import type { ReactElement, RefObject } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  LOCATION_MAP_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
} from "@/lib/constants";

type BranchMapProps = {
  latitude: number | null;
  longitude: number | null;
  /** Called when the visitor clicks the map or drops the marker. */
  onPick: (latitude: number, longitude: number) => void;
  /** Called when the coordinates change because of an address search (outside the map). */
  searchRef?: RefObject<[number, number] | null>;
  /** The hint shown over the map while there is no marker yet. */
  hint?: string;
};

export default function BranchMap({
  latitude,
  longitude,
  onPick,
  searchRef,
  hint,
}: BranchMapProps): ReactElement {
  // The last point picked on the map. It tells the map mover to not move again for that point,
  // so a click on the map does not start a loop.
  const pickedRef = useRef<[number, number] | null>(null);
  const internalSearchRef = useRef<[number, number] | null>(null);

  // The marker is a primary dot with a white outline. The colors come from the stylesheet.
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "nawy-marker-icon",
        html: '<span class="nawy-marker-dot"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    [],
  );

  const position: [number, number] | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;

  function pick(nextLatitude: number, nextLongitude: number): void {
    pickedRef.current = [nextLatitude, nextLongitude];
    if (searchRef !== undefined) {
      searchRef.current = null;
    }
    onPick(nextLatitude, nextLongitude);
  }

  function handleDragEnd(event: L.LeafletEvent): void {
    const marker = event.target as L.Marker;
    const latLng = marker.getLatLng();
    pick(Number(latLng.lat.toFixed(6)), Number(latLng.lng.toFixed(6)));
  }

  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-card border border-line bg-card shadow-card">
      <MapContainer
        center={position ?? [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude]}
        zoom={position === null ? DEFAULT_MAP_ZOOM : LOCATION_MAP_ZOOM}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ZoomControl position="topleft" />

        <MapClickHandler onPick={pick} pickedRef={pickedRef} />

        {position === null ? null : (
          <>
            <MapMover
              latitude={position[0]}
              longitude={position[1]}
              pickedRef={pickedRef}
              searchRef={searchRef ?? internalSearchRef}
            />
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{ dragend: handleDragEnd }}
            />
          </>
        )}
      </MapContainer>

      {position === null && hint !== undefined ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type MapHelperProps = {
  onPick: (latitude: number, longitude: number) => void;
  pickedRef: RefObject<[number, number] | null>;
};

/** Sends the clicked point to the form. */
function MapClickHandler({ onPick, pickedRef }: MapHelperProps): null {
  useMapEvents({
    click(event) {
      const latitude: number = Number(event.latlng.lat.toFixed(6));
      const longitude: number = Number(event.latlng.lng.toFixed(6));
      pickedRef.current = [latitude, longitude];
      onPick(latitude, longitude);
    },
  });

  return null;
}

/** Moves the map to a point that came from outside the map (for example after a search). */
function MapMover({
  latitude,
  longitude,
  pickedRef,
  searchRef,
}: {
  latitude: number;
  longitude: number;
  pickedRef: RefObject<[number, number] | null>;
  searchRef: RefObject<[number, number] | null>;
}): null {
  const map = useMap();

  useEffect(() => {
    const picked = pickedRef.current;
    const searched = searchRef.current;

    if (picked !== null && picked[0] === latitude && picked[1] === longitude) {
      // The point was picked on the map, so the map is already there: do not move it again.
      pickedRef.current = null;
      return;
    }

    if (searched !== null && searched[0] === latitude && searched[1] === longitude) {
      map.flyTo([latitude, longitude], LOCATION_MAP_ZOOM);
      searchRef.current = null;
      return;
    }
  }, [latitude, longitude, map, pickedRef, searchRef]);

  return null;
}
