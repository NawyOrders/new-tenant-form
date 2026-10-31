// Unit tests for the translations (lib/i18n.ts): key parity and helpers.

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  formatNumber,
  getDirection,
  getLocale,
  t,
  translations,
} from "../../lib/i18n";
import type { TranslationKey } from "../../lib/i18n";

const entries: Array<[string, { ar: string; en: string }]> = Object.entries(translations);

describe("translation table", () => {
  test("has a non-empty Arabic and English text for every key", () => {
    assert.ok(entries.length > 100);

    for (const [key, entry] of entries) {
      assert.equal(typeof entry.ar, "string", `${key}.ar`);
      assert.equal(typeof entry.en, "string", `${key}.en`);
      assert.notEqual(entry.ar.trim(), "", `${key}.ar`);
      assert.notEqual(entry.en.trim(), "", `${key}.en`);
    }
  });

  test("uses dot-separated keys without whitespace", () => {
    for (const [key] of entries) {
      assert.match(key, /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*$/, key);
    }
  });

  test("keeps no duplicate keys (object keys are unique by construction)", () => {
    const keys = entries.map(([key]) => key);

    assert.equal(new Set(keys).size, keys.length);
  });

  test("keeps the keys the wizard depends on", () => {
    const required: TranslationKey[] = [
      "app.title",
      "step.main",
      "step.identity",
      "step.branches",
      "step.package",
      "error.required",
      "error.name.invalid",
      "error.color",
      "error.chooseOffer",
      "btn.next",
      "btn.back",
    ];

    for (const key of required) {
      assert.ok(key in translations, key);
    }
  });
});

describe("t", () => {
  test("reads one language", () => {
    assert.equal(t("en", "btn.next"), "Next");
    assert.equal(t("ar", "btn.next"), "\u0627\u0644\u062a\u0627\u0644\u064a");
  });

  test("replaces every named variable", () => {
    assert.equal(t("en", "step.counter", { current: 2, total: 4 }), "Step 2 of 4");
    assert.equal(t("en", "package.monthsCount", { count: 6 }), "6 months");
  });

  test("leaves a variable that was not provided in place", () => {
    assert.equal(t("en", "step.counter", { current: 2 }), "Step 2 of {total}");
  });
});

describe("language helpers", () => {
  test("getDirection flips Arabic only", () => {
    assert.equal(getDirection("ar"), "rtl");
    assert.equal(getDirection("en"), "ltr");
  });

  test("getLocale returns the matching locale", () => {
    assert.equal(getLocale("ar"), "ar-EG");
    assert.equal(getLocale("en"), "en-US");
  });

  test("formatNumber uses the separators of the language", () => {
    assert.equal(formatNumber("en", 1234), "1,234");
    assert.match(formatNumber("ar", 1234), /[\u0660-\u0669]/);
  });
});
