// This file shows all the fields of ONE branch: name, address with the search button,
// the coordinates, the opening hours and the map.
//
// The address, the coordinates and the map always agree:
// - the map (a click or the end of a drag) fills the coordinates and the address,
// - the search (the button, Enter, or a pause while typing) fills the coordinates and moves the map.

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { reverseGeocode, searchAddress } from "@/lib/geocoding";
import { t } from "@/lib/i18n";
import type { Branch, GeoAddressParts, Lang, StepErrors } from "@/lib/types";

// Leaflet only works in the browser, so the real map is loaded with next/dynamic and ssr: false.
const BranchMap = dynamic(() => import("@/components/branches/BranchMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full animate-pulse rounded-card border border-line bg-soft" />
  ),
});

/** The pause after the last keystroke before an automatic search starts. */
const SEARCH_DEBOUNCE_MS = 800;

/** Nominatim allows one request per second, so two searches never run closer than this. */
const NOMINATIM_MIN_GAP_MS = 1000;

/** Automatic search waits until the query has at least this many characters. */
const SEARCH_MIN_CHARS = 3;

type BranchCardProps = {
  branch: Branch;
  /** The position of the branch in the list (0 or 1). */
  index: number;
  errors: StepErrors;
  lang: Lang;
  /** The branch can only be deleted when there is more than one branch. */
  canRemove: boolean;
  /** Called with the new values of this branch only. */
  onChange: (patch: Partial<Branch>) => void;
  onRemove: () => void;
};

export default function BranchCard({
  branch,
  index,
  errors,
  lang,
  canRemove,
  onChange,
  onRemove,
}: BranchCardProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const searchMoveRef = useRef<[number, number] | null>(null);
  /** The request that owns the map right now. A newer search aborts the old one. */
  const searchAbortRef = useRef<AbortController | null>(null);
  /** When the last request to Nominatim was sent, in milliseconds. */
  const lastRequestAtRef = useRef<number>(0);

  /** The error message of one field of this branch. */
  function errorFor(field: string): string | undefined {
    return errors[`branches.${index}.${field}`];
  }

  /**
   * The address parts that Nominatim actually returned. A missing part is left out of the
   * patch, so it never clears a value the visitor typed.
   */
  function addressPartsPatch(parts: GeoAddressParts | undefined): Partial<Branch> {
    if (parts === undefined) {
      return {};
    }

    const patch: Partial<Branch> = {};

    if (parts.city !== null) patch.city = parts.city;
    if (parts.region !== null) patch.region = parts.region;
    if (parts.postalCode !== null) patch.postalCode = parts.postalCode;
    if (parts.countryCode !== null) patch.countryCode = parts.countryCode;

    return patch;
  }

  /**
   * Runs one search and applies its result. The automatic search calls it after the debounce,
   * the button and Enter call it at once. Only one request is in flight at a time.
   */
  async function runSearch(query: string, controller: AbortController): Promise<void> {
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;
    setIsSearching(true);
    setMessage("");

    // Keep at least one second between two requests to Nominatim.
    const gapMs: number = lastRequestAtRef.current + NOMINATIM_MIN_GAP_MS - Date.now();
    const stoppedWhileWaiting: boolean =
      gapMs > 0 && (await waitForGap(gapMs, controller.signal));

    if (!stoppedWhileWaiting && !controller.signal.aborted) {
      lastRequestAtRef.current = Date.now();
      const result = await searchAddress(query, lang, controller.signal);

      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
        setIsSearching(false);

        if (!controller.signal.aborted) {
          if (result === null) {
            // The old address and coordinates stay: the visitor may still be typing.
            setMessage(t(lang, "branch.notFound"));
            return;
          }

          searchMoveRef.current = [result.latitude, result.longitude];
          onChange({
            address: result.displayName,
            latitude: result.latitude,
            longitude: result.longitude,
            ...addressPartsPatch(result.addressParts),
          });
        }
        return;
      }
    }

    // A stopped search only resets the state it still owns.
    if (searchAbortRef.current === controller) {
      searchAbortRef.current = null;
      setIsSearching(false);
    }
  }

  /**
   * FIELDS -> MAP: the button and the Enter key search at once. A pending automatic search
   * is cancelled so the same text is not sent twice.
   */
  async function handleSearch(): Promise<void> {
    const query: string = branch.address.trim();

    if (query === "") {
      setMessage(t(lang, "branch.notFound"));
      return;
    }

    setSearchQuery("");
    await runSearch(query, new AbortController());
  }

  // Typing only updates the query. After a short pause one search runs for it.
  useEffect(() => {
    const query: string = searchQuery.trim();

    if (query.length < SEARCH_MIN_CHARS) {
      return;
    }

    const controller = new AbortController();
    const timer: number = window.setTimeout(() => {
      void runSearch(query, controller);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // Adding runSearch here would restart the timer after every search result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, lang]);

  /** MAP -> FIELDS: saves the point and reads its address. */
  async function handlePick(latitude: number, longitude: number): Promise<void> {
    onChange({ latitude, longitude });
    setIsLocating(true);
    setMessage("");

    // A pending automatic search must not replace the point the visitor just picked.
    setSearchQuery("");
    lastRequestAtRef.current = Date.now();

    const place = await reverseGeocode(latitude, longitude, lang);
    setIsLocating(false);

    if (place === null) {
      // The coordinates stay, the address is cleared and the visitor is asked to type it.
      // Do NOT touch latitude or longitude.
      onChange({ address: "" });
      setMessage(t(lang, "map.failed"));
      return;
    }

    onChange({ address: place.displayName, ...addressPartsPatch(place.addressParts) });
  }

  function handleAddressKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSearch();
    }
  }

  return (
    <div className="rounded-card border border-line bg-soft/30 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-primary/10 text-xs font-semibold text-primary-dark">
            {index + 1}
          </span>
          {index === 0 ? t(lang, "branch.title1") : t(lang, "branch.title2")}
        </h3>

        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="h-10 rounded-pill border border-line bg-card px-3 text-xs font-semibold text-danger-strong transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t(lang, "btn.remove")}
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <TextInput
          label={t(lang, "branch.name")}
          name={`branch-name-${branch.id}`}
          placeholder={t(lang, "branch.name.placeholder")}
          value={branch.name}
          error={errorFor("name")}
          required
          onChange={(value) => onChange({ name: value })}
        />

        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextInput
                label={t(lang, "branch.address")}
                name={`branch-address-${branch.id}`}
                placeholder={t(lang, "branch.address.placeholder")}
                value={branch.address}
                error={errorFor("address")}
                required
                onKeyDown={handleAddressKeyDown}
                onChange={(value) => {
                  onChange({ address: value });
                  setSearchQuery(value);
                }}
              />
            </div>

            <Button
              variant="secondary"
              isLoading={isSearching}
              onClick={() => void handleSearch()}
              className="h-12 shrink-0"
            >
              {t(lang, "branch.search")}
            </Button>
          </div>

          {isLocating ? (
            <p className="mt-1.5 text-xs text-muted">{t(lang, "map.loading")}</p>
          ) : isSearching ? (
            <p className="mt-1.5 text-xs text-muted">{t(lang, "branch.searching")}</p>
          ) : message === "" ? null : (
            <p className="mt-1.5 text-xs text-muted">{message}</p>
          )}
        </div>

        <TextInput
          label={t(lang, "branch.city")}
          name={`branch-city-${branch.id}`}
          placeholder={t(lang, "branch.city.placeholder")}
          value={branch.city}
          error={errorFor("city")}
          required
          onChange={(value) => onChange({ city: value })}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">
              {t(lang, "branch.latitude")}
            </p>
            <span dir="ltr" className="block text-xs text-muted">
              {branch.latitude === null ? "—" : branch.latitude.toFixed(6)}
            </span>
            <p className="mt-1 text-xs text-muted">{t(lang, "branch.coordsHint")}</p>
            {errorFor("latitude") ? (
              <p className="mt-1 text-xs text-danger-strong">{errorFor("latitude")}</p>
            ) : null}
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-ink">
              {t(lang, "branch.longitude")}
            </p>
            <span dir="ltr" className="block text-xs text-muted">
              {branch.longitude === null ? "—" : branch.longitude.toFixed(6)}
            </span>
            <p className="mt-1 text-xs text-muted">{t(lang, "branch.coordsHint")}</p>
            {errorFor("longitude") ? (
              <p className="mt-1 text-xs text-danger-strong">{errorFor("longitude")}</p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{t(lang, "branch.hours")}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label={t(lang, "branch.hoursFrom")}
              name={`branch-opening-${branch.id}`}
              type="time"
              value={branch.openingTime}
              onChange={(value) => onChange({ openingTime: value })}
            />

            <TextInput
              label={t(lang, "branch.hoursTo")}
              name={`branch-closing-${branch.id}`}
              type="time"
              value={branch.closingTime}
              onChange={(value) => onChange({ closingTime: value })}
            />
          </div>

          {errorFor("hours") ? (
            <p className="mt-1 text-xs text-danger-strong">{errorFor("hours")}</p>
          ) : null}
        </div>

        <BranchMap
          latitude={branch.latitude}
          longitude={branch.longitude}
          searchRef={searchMoveRef}
          onPick={(latitude, longitude) => void handlePick(latitude, longitude)}
          hint={t(lang, "map.hint")}
        />
      </div>
    </div>
  );
}

/** Waits for the given time. Returns true when the request was stopped during the wait. */
function waitForGap(waitMs: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(true);
      return;
    }

    let timer: number = 0;

    function onAbort(): void {
      window.clearTimeout(timer);
      resolve(true);
    }

    timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve(false);
    }, waitMs);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

