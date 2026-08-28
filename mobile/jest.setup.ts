import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

// Pin the test runner's timezone so calendar-day math (age, stash forecast,
// "days until return to work") is deterministic regardless of CI host TZ.
process.env.TZ = "UTC";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("sentry-expo", () => ({
  init: jest.fn(),
  Native: {},
}));

jest.mock("react-native-purchases", () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
  purchaseProduct: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
}));
