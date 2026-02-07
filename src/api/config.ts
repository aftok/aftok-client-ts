import { getWithCredentials } from "./http";
import { type Either, left, right } from "../types/either";
import { type APIError } from "../types/api";

export interface ClientConfig {
  recaptchaSiteKey: string;
}

export async function fetchConfig(): Promise<Either<APIError, ClientConfig>> {
  try {
    const response = await getWithCredentials("/api/config");
    if (response.status === 200) {
      const json = (await response.json()) as ClientConfig;
      return right(json);
    }
    return left({
      type: "error",
      status: response.status,
      message: response.statusText,
    });
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
