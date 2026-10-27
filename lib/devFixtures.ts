// This is dev-only and can be deleted before release.
import { theme } from "./theme";
import type { RegisterData } from "./types";

export function getDevFixtures(): Partial<RegisterData> {
  return {
    restaurantName: "مطعم تجريبي",
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
        latitude: 30.0444,
        longitude: 31.2357,
        openingTime: "10:00",
        closingTime: "23:00",
      },
    ],
    subscriptionOfferId: null,
    logoFile: null,
    menuFile: null,
  };
}
