import { type Either } from "../types/either";
import { type APIError } from "../types/api";
import { type ClientConfig } from "../api/config";

export interface System {
  log: (msg: string) => void;
  error: (msg: string) => void;
  now: () => Date;
  fetchConfig: () => Promise<Either<APIError, ClientConfig>>;
}
