import { type System } from "./system";
import { fetchConfig } from "../api/config";

export const liveSystem: System = {
  log: (msg) => console.log(msg),
  error: (msg) => console.error(msg),
  now: () => new Date(),
  fetchConfig,
};
