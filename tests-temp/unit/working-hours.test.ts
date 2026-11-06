// Unit tests for the 7-day working hours built from the branch schedule.

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildOnboardingPayload } from "../../lib/api/onboarding";
import type { WorkingHoursEntry } from "../../lib/api/onboarding";
import { WORKING_DAY_CODES } from "../../lib/constants";
import { validateStep3 } from "../../lib/validation";
import type { Branch, RegisterData } from "../../lib/types";

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

function makeData(branches: Branch[]): RegisterData {
  return {
    restaurantNameAr: "\u0645\u0637\u0639\u0645 \u062a\u062c\u0631\u064a\u0628\u064a",
    restaurantNameEn: "Test Restaurant",
    logoFile: new File(["logo"], "logo.png", { type: "image/png" }),
    menuFile: new File(["menu"], "menu.pdf", { type: "application/pdf" }),
    logoAssetId: "logo-asset",
    menuAssetId: "menu-asset",
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
    branches,
    subscriptionOfferId: "offer-1",
  };
}

describe("working hours payload", () => {
  test("builds 7 entries for 10:00 to 23:00", () => {
    const payload = buildOnboardingPayload(makeData([makeBranch()]));
    const workingHours: WorkingHoursEntry[] = payload.branches[0].workingHours;

    console.log("WORKING_HOURS_PAYLOAD=" + JSON.stringify(workingHours));

    assert.equal(WORKING_DAY_CODES.length, 7);
    assert.deepEqual(WORKING_DAY_CODES, [0, 1, 2, 3, 4, 5, 6]);
    assert.equal(workingHours.length, 7);

    workingHours.forEach((entry, index) => {
      assert.equal(entry.dayOfWeek, index);
      assert.equal(entry.isClosed, false);
      assert.equal(entry.openTime, "10:00");
      assert.equal(entry.closeTime, "23:00");
      assert.equal(entry.closesNextDay, false);
    });
  });

  test("marks an overnight schedule on all 7 days", () => {
    const payload = buildOnboardingPayload(
      makeData([makeBranch({ openingTime: "18:00", closingTime: "02:00" })]),
    );
    const workingHours: WorkingHoursEntry[] = payload.branches[0].workingHours;

    assert.equal(workingHours.length, 7);
    workingHours.forEach((entry) => {
      assert.equal(entry.openTime, "18:00");
      assert.equal(entry.closeTime, "02:00");
      assert.equal(entry.closesNextDay, true);
    });
  });

  test("blocks the submit when a time is empty", () => {
    const data: RegisterData = makeData([makeBranch({ openingTime: "", closingTime: "23:00" })]);

    assert.throws(() => buildOnboardingPayload(data), /no opening hours/);

    const errors = validateStep3(makeData([makeBranch({ openingTime: "", closingTime: "" })]), "en");
    assert.equal(errors["branches.0.hours"], "Closing time must differ from opening time");
  });
});
