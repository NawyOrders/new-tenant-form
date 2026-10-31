// Unit tests for the wizard validation rules (lib/validation.ts).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getFieldError,
  isValidArabicName,
  isValidEgyptianPhone,
  isValidEmail,
  isValidEnglishName,
  isValidHexColor,
  isValidName,
  validateStep,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
} from "../../lib/validation";
import { MAX_BRANCHES } from "../../lib/constants";
import type { Branch, RegisterData } from "../../lib/types";

const ARABIC_NAME = "\u0645\u0637\u0639\u0645 \u062a\u062c\u0631\u064a\u0628\u064a";

function makeBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: 1,
    name: "Branch One",
    address: "12 Street",
    city: "Cairo",
    region: "Cairo",
    postalCode: "11511",
    countryCode: "EG",
    latitude: 31.2,
    longitude: 29.9,
    openingTime: "10:00",
    closingTime: "23:00",
    ...overrides,
  };
}

function makeData(overrides: Partial<RegisterData> = {}): RegisterData {
  return {
    restaurantNameAr: ARABIC_NAME,
    restaurantNameEn: "Test Restaurant",
    logoFile: new File(["logo"], "logo.png", { type: "image/png" }),
    menuFile: new File(["menu"], "menu.pdf", { type: "application/pdf" }),
    logoAssetId: null,
    menuAssetId: null,
    owner: {
      fullName: "Ahmed Mahmoud",
      phone: "01012345678",
      email: "owner@example.com",
    },
    brand: {
      primaryColor: "#E43820",
      backgroundColor: "#FFFFFF",
      accentColor: "#FF6B4A",
    },
    branches: [makeBranch()],
    subscriptionOfferId: "offer-1",
    ...overrides,
  };
}

describe("simple value validators", () => {
  test("isValidHexColor accepts #RRGGBB only", () => {
    assert.equal(isValidHexColor("#E43820"), true);
    assert.equal(isValidHexColor("#ffffff"), true);
    assert.equal(isValidHexColor(" #AABBCC "), true);
    assert.equal(isValidHexColor("#FFF"), false);
    assert.equal(isValidHexColor("E43820"), false);
    assert.equal(isValidHexColor("#GG0000"), false);
  });

  test("isValidEgyptianPhone accepts the local and international forms", () => {
    for (const phone of ["01012345678", "01112345678", "01212345678", "01512345678", "+201012345678", "00201012345678", "0101 234 5678"]) {
      assert.equal(isValidEgyptianPhone(phone), true, phone);
    }

    for (const phone of ["", "0101234567", "01312345678", "010123456789", "abc"]) {
      assert.equal(isValidEgyptianPhone(phone), false, phone);
    }
  });

  test("isValidEmail accepts normal addresses and rejects broken ones", () => {
    assert.equal(isValidEmail("owner@example.com"), true);
    assert.equal(isValidEmail("first.last+tag@sub.example.co"), true);
    assert.equal(isValidEmail(""), false);
    assert.equal(isValidEmail("owner@example"), false);
    assert.equal(isValidEmail("owner example.com"), false);
    assert.equal(isValidEmail("owner@.com"), false);
  });

  test("name validators follow the script rules", () => {
    assert.equal(isValidName("Test Restaurant"), true);
    assert.equal(isValidName(ARABIC_NAME), true);
    assert.equal(isValidName("A"), false);
    assert.equal(isValidArabicName(ARABIC_NAME), true);
    assert.equal(isValidArabicName("Test"), false);
    assert.equal(isValidEnglishName("Test Restaurant"), true);
    assert.equal(isValidEnglishName(ARABIC_NAME), false);
    assert.equal(isValidEnglishName("A"), false);
    assert.equal(isValidEnglishName("  Test  "), true);
  });
});

describe("validateStep1", () => {
  test("returns no errors for a complete form", () => {
    assert.deepEqual(validateStep1(makeData(), "en"), {});
  });

  test("reports every missing required field", () => {
    const errors = validateStep1(
      makeData({
        restaurantNameAr: "",
        restaurantNameEn: " ",
        logoFile: null,
        menuFile: null,
        owner: { fullName: "", phone: "", email: "" },
      }),
      "en",
    );

    assert.equal(errors["restaurantNameAr"], "This field is required");
    assert.equal(errors["restaurantNameEn"], "This field is required");
    assert.equal(errors["logoFile"], "Logo upload is required");
    assert.equal(errors["menuFile"], "Menu upload is required");
    assert.equal(errors["owner.fullName"], "This field is required");
    assert.equal(errors["owner.phone"], "This field is required");
    assert.equal(errors["owner.email"], "This field is required");
  });

  test("checks names by script and by length", () => {
    const errors = validateStep1(
      makeData({
        restaurantNameAr: "Test",
        restaurantNameEn: ARABIC_NAME,
        owner: { fullName: "A", phone: "01012345678", email: "owner@example.com" },
      }),
      "en",
    );

    assert.equal(errors["restaurantNameAr"], "Use Arabic letters only");
    assert.equal(errors["restaurantNameEn"], "Use English letters only");
    assert.equal(errors["owner.fullName"], "Name must be 2 to 60 characters");
  });

  test("rejects an over-long name and a bad phone or email", () => {
    const errors = validateStep1(
      makeData({
        restaurantNameAr: "x".repeat(61),
        owner: { fullName: "Ahmed Mahmoud", phone: "01312345678", email: "bad-email" },
      }),
      "en",
    );

    assert.equal(errors["restaurantNameAr"], "Name must be 2 to 60 characters");
    assert.equal(errors["owner.phone"], "Invalid mobile number");
    assert.equal(errors["owner.email"], "Enter a valid email address");
  });
});

describe("validateStep2", () => {
  test("returns no errors for valid names and colors", () => {
    assert.deepEqual(validateStep2(makeData(), "en"), {});
  });

  test("allows an empty optional background and accent color", () => {
    const errors = validateStep2(
      makeData({ brand: { primaryColor: "#E43820", backgroundColor: "", accentColor: "" } }),
      "en",
    );

    assert.deepEqual(errors, {});
  });

  test("requires the primary color and validates every filled color", () => {
    const errors = validateStep2(
      makeData({ brand: { primaryColor: "", backgroundColor: "red", accentColor: "#12345" } }),
      "en",
    );

    assert.equal(errors["brand.primaryColor"], "This field is required");
    assert.equal(errors["brand.backgroundColor"], "Invalid color value, use the #RRGGBB format");
    assert.equal(errors["brand.accentColor"], "Invalid color value, use the #RRGGBB format");
  });

  test("uses the same name rules as step 1", () => {
    const errors = validateStep2(
      makeData({ restaurantNameAr: "Latin", restaurantNameEn: ARABIC_NAME }),
      "en",
    );

    assert.equal(errors["restaurantNameAr"], "Use Arabic letters only");
    assert.equal(errors["restaurantNameEn"], "Use English letters only");
  });
});

describe("validateStep3", () => {
  test("returns no errors for one complete branch", () => {
    assert.deepEqual(validateStep3(makeData(), "en"), {});
  });

  test("requires at least one branch", () => {
    const errors = validateStep3(makeData({ branches: [] }), "en");

    assert.equal(errors["branches"], "Add at least one branch");
  });

  test("reports the maximum number of branches", () => {
    const branches = Array.from({ length: MAX_BRANCHES + 1 }, (_, index) =>
      makeBranch({ id: index + 1 }),
    );
    const errors = validateStep3(makeData({ branches }), "en");

    assert.equal(errors["branches"], "You can add at most 2 branches");
  });

  test("checks every field of a branch", () => {
    const errors = validateStep3(
      makeData({
        branches: [
          makeBranch({
            name: "A",
            address: " ",
            city: "",
            latitude: null,
            longitude: null,
            openingTime: "10:00",
            closingTime: "10:00",
          }),
        ],
      }),
      "en",
    );

    assert.equal(errors["branches.0.name"], "Name must be 2 to 60 characters");
    assert.equal(errors["branches.0.hours"], "Closing time must differ from opening time");
    assert.equal(errors["branches.0.address"], "This field is required");
    assert.equal(errors["branches.0.city"], "City is required");
    assert.equal(errors["branches.0.latitude"], "This field is required");
  });
});

describe("validateStep4 and validateStep", () => {
  test("requires a chosen subscription offer", () => {
    const errors = validateStep4(makeData({ subscriptionOfferId: null }), "en");

    assert.equal(errors["subscriptionOfferId"], "Choose a package and duration");
  });

  test("returns no errors for a chosen offer", () => {
    assert.deepEqual(validateStep4(makeData(), "en"), {});
  });

  test("dispatches by step number through STEP_ORDER", () => {
    assert.deepEqual(validateStep(1, makeData(), "en"), {});
    assert.deepEqual(validateStep(2, makeData(), "en"), {});
    assert.deepEqual(validateStep(3, makeData(), "en"), {});
    assert.deepEqual(validateStep(4, makeData(), "en"), {});
    assert.deepEqual(validateStep(5, makeData(), "en"), {});
  });
});

describe("getFieldError", () => {
  test("returns the field error, or an empty string", () => {
    const data = makeData();

    assert.equal(getFieldError("restaurantNameAr", data, "en"), "");
    assert.equal(getFieldError("restaurantNameEn", data, "en"), "");
    assert.equal(getFieldError("owner.fullName", data, "en"), "");
    assert.equal(getFieldError("owner.email", data, "en"), "");
    assert.equal(getFieldError("branches.0.name", data, "en"), "");
    assert.equal(getFieldError("unknown.field", data, "en"), "");
    assert.equal(getFieldError("branches.9.name", data, "en"), "");
    assert.equal(getFieldError("restaurantNameAr", makeData({ restaurantNameAr: "" }), "en"), "This field is required");
    assert.equal(getFieldError("restaurantNameEn", makeData({ restaurantNameEn: "A" }), "en"), "Name must be 2 to 60 characters");
    assert.equal(getFieldError("owner.email", makeData({ owner: { fullName: "Ahmed Mahmoud", phone: "01012345678", email: "bad" } }), "en"), "Enter a valid email address");
  });
});
