// This file shows all the fields of ONE branch: name, address with the search button,
// the coordinates, the opening hours and the map.
//
// The address, the coordinates and the map always agree:
// - the map (a click or the end of a drag) fills the coordinates and the address,
// - the search button (or the Enter key) fills the coordinates and moves the map.

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { reverseGeocode, searchAddress } from "@/lib/geocoding";
import { t } from "@/lib/i18n";
import type { Branch, Lang, StepErrors } from "@/lib/types";

// Leaflet only works in the browser, so the real map is loaded with next/dynamic and ssr: false.
const BranchMap = dynamic(() => import("@/components/branches/BranchMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full animate-pulse rounded-card border border-line bg-soft" />
  ),
});

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
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  /** The error message of one field of this branch. */
  function errorFor(field: string): string | undefined {
    return errors[`branches.${index}.${field}`];
  }

  /**
   * FIELDS -> MAP: searches the typed address on OpenStreetMap and moves the map to the point.
   * It is called by the button and by the Enter key only, never on every keystroke.
   */
  async function handleSearch(): Promise<void> {
    const query: string = branch.address.trim();

    if (query === "") {
      setMessage(t(lang, "branch.notFound"));
      return;
    }

    setIsSearching(true);
    setMessage("");

    const result = await searchAddress(query, lang);
    setIsSearching(false);

    if (result === null) {
      setMessage(t(lang, "branch.notFound"));
      return;
    }

    onChange({
      address: result.displayName,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  }

  /** MAP -> FIELDS: saves the point and reads its address. */
  async function handlePick(latitude: number, longitude: number): Promise<void> {
    onChange({ latitude, longitude });
    setIsLocating(true);
    setMessage("");

    const place = await reverseGeocode(latitude, longitude, lang);
    setIsLocating(false);

    if (place === null) {
      // The coordinates stay, the address is cleared and the visitor is asked to type it.
      onChange({ address: "" });
      setMessage(t(lang, "map.failed"));
      return;
    }

    onChange({ address: place.displayName });
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
                onChange={(value) => onChange({ address: value })}
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
          ) : message === "" ? null : (
            <p className="mt-1.5 text-xs text-muted">{message}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label={t(lang, "branch.latitude")}
            name={`branch-latitude-${branch.id}`}
            dir="ltr"
            readOnly
            placeholder="—"
            value={branch.latitude === null ? "" : branch.latitude.toFixed(6)}
            error={errorFor("latitude")}
            hint={t(lang, "branch.coordsHint")}
            onChange={() => undefined}
          />

          <TextInput
            label={t(lang, "branch.longitude")}
            name={`branch-longitude-${branch.id}`}
            dir="ltr"
            readOnly
            placeholder="—"
            value={branch.longitude === null ? "" : branch.longitude.toFixed(6)}
            hint={t(lang, "branch.coordsHint")}
            onChange={() => undefined}
          />
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
        </div>

        <BranchMap
          latitude={branch.latitude}
          longitude={branch.longitude}
          onPick={(latitude, longitude) => void handlePick(latitude, longitude)}
          hint={t(lang, "map.hint")}
        />
      </div>
    </div>
  );
}
