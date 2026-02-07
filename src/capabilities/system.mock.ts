import { type System } from "./system";
import { right } from "../types/either";

export const mockSystem: System = {
  log: () => {},
  error: () => {},
  now: () => new Date("2025-01-01T00:00:00Z"),
  fetchConfig: async () =>
    right({ recaptchaSiteKey: "mock-site-key" }),
};
