// This is dev-only and can be deleted before release.
import { DEFAULT_COUNTRY_CODE } from "./constants";
import { theme } from "./theme";
import type { RegisterData } from "./types";

export function getDevFixtures(): Partial<RegisterData> {
  return {
    restaurantNameAr: "مطعم تجريبي",
    restaurantNameEn: "Demo Restaurant",
    logoFile: null,
    menuFile: null,
    logoAssetId: null,
    menuAssetId: null,
    owner: { fullName: "أحمد محمود", phone: "01012345678", email: "test@restaurant.com" },
    brand: {
      primaryColor: theme.primary,
      backgroundColor: theme.card,
      accentColor: theme.primaryLight,
    },
    branches: [
      {
        id: Date.now(),
        name: "فرع المعادي",
        address: "المعادي، القاهرة",
        city: "",
        region: "",
        postalCode: "",
        countryCode: DEFAULT_COUNTRY_CODE,
        latitude: 30.0444,
        longitude: 31.2357,
        openingTime: "10:00",
        closingTime: "23:00",
      },
    ],
    subscriptionOfferId: null,
  };
}
