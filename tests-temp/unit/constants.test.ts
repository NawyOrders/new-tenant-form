// Unit tests for the fixed values of the wizard (lib/constants.ts).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ACCEPTED_LOGO_INPUT,
  ACCEPTED_LOGO_TYPES,
  ACCEPTED_MENU_INPUT,
  ACCEPTED_MENU_TYPES,
  DEFAULT_BRAND_COLORS,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FEATURES,
  LOCATION_MAP_ZOOM,
  MAX_BRANCHES,
  MAX_LOGO_SIZE_MB,
  MAX_MENU_SIZE_MB,
  RECOMMENDED_PALETTES,
  STEPS,
  STEP_ORDER,
  TILE_ATTRIBUTION,
  TILE_URL,
  TOTAL_STEPS,
  createEmptyBranch,
} from "../../lib/constants";
import { translations } from "../../lib/i18n";
import { theme } from "../../lib/theme";

describe("steps", () => {
  test("STEP_ORDER holds the step keys in order", () => {
    assert.deepEqual(STEP_ORDER, ["main", "identity", "branches", "package"]);
  });

  test("TOTAL_STEPS follows STEP_ORDER", () => {
    assert.equal(TOTAL_STEPS, STEP_ORDER.length);
  });

  test("STEPS numbers the keys from one and uses translation keys", () => {
    assert.equal(STEPS.length, STEP_ORDER.length);

    STEPS.forEach((step, index) => {
      assert.equal(step.id, index + 1);
      assert.equal(step.titleKey, `step.${STEP_ORDER[index]}`);
      assert.ok(step.titleKey in translations, step.titleKey);
    });
  });
});

describe("limits and accepted files", () => {
  test("branch and size limits", () => {
    assert.equal(MAX_BRANCHES, 2);
    assert.equal(MAX_LOGO_SIZE_MB, 5);
    assert.equal(MAX_MENU_SIZE_MB, 10);
  });

  test("logo types match the input attribute", () => {
    assert.deepEqual(ACCEPTED_LOGO_TYPES, ["image/png", "image/jpeg", "image/svg+xml"]);
    assert.equal(ACCEPTED_LOGO_INPUT, ACCEPTED_LOGO_TYPES.join(","));
  });

  test("menu types match the input attribute", () => {
    assert.deepEqual(ACCEPTED_MENU_TYPES, ["application/pdf", "image/png", "image/jpeg"]);
    assert.equal(ACCEPTED_MENU_INPUT, ACCEPTED_MENU_TYPES.join(","));
  });
});

describe("map defaults", () => {
  test("country code and map center", () => {
    assert.equal(DEFAULT_COUNTRY_CODE, "EG");
    assert.deepEqual(DEFAULT_MAP_CENTER, { latitude: 31.2001, longitude: 29.9187 });
    assert.equal(DEFAULT_MAP_ZOOM, 13);
    assert.equal(LOCATION_MAP_ZOOM, 15);
  });

  test("tile URL and attribution", () => {
    assert.equal(TILE_URL, "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    assert.equal(TILE_ATTRIBUTION, "\u00a9 OpenStreetMap contributors");
  });
});

describe("brand data", () => {
  test("the default brand colors come from the theme", () => {
    assert.equal(DEFAULT_BRAND_COLORS.primaryColor, theme.primary);
    assert.equal(DEFAULT_BRAND_COLORS.backgroundColor, theme.card);
    assert.equal(DEFAULT_BRAND_COLORS.accentColor, theme.primaryLight);
  });

  test("the recommended palettes have unique ids and both names", () => {
    const ids = RECOMMENDED_PALETTES.map((palette) => palette.id);

    assert.equal(new Set(ids).size, ids.length);
    assert.equal(RECOMMENDED_PALETTES.length, 4);

    for (const palette of RECOMMENDED_PALETTES) {
      assert.notEqual(palette.name.ar.trim(), "");
      assert.notEqual(palette.name.en.trim(), "");
      assert.match(palette.primaryColor, /^#[0-9A-F]{6}$/i);
      assert.match(palette.backgroundColor, /^#[0-9A-F]{6}$/i);
      assert.match(palette.accentColor, /^#[0-9A-F]{6}$/i);
    }
  });

  test("the shared features have unique ids and both labels", () => {
    const ids = FEATURES.map((feature) => feature.id);

    assert.equal(new Set(ids).size, ids.length);

    for (const feature of FEATURES) {
      assert.notEqual(feature.label.ar.trim(), "");
      assert.notEqual(feature.label.en.trim(), "");
    }
  });
});

describe("createEmptyBranch", () => {
  test("returns a complete empty branch with the defaults", () => {
    const branch = createEmptyBranch();

    assert.equal(typeof branch.id, "number");
    assert.ok(branch.id > 0);
    assert.equal(branch.name, "");
    assert.equal(branch.address, "");
    assert.equal(branch.city, "");
    assert.equal(branch.region, "");
    assert.equal(branch.postalCode, "");
    assert.equal(branch.countryCode, DEFAULT_COUNTRY_CODE);
    assert.equal(branch.latitude, null);
    assert.equal(branch.longitude, null);
    assert.equal(branch.openingTime, "10:00");
    assert.equal(branch.closingTime, "23:00");
  });
});
