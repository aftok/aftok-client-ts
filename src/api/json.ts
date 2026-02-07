import { type Either, left, right } from "../types/either";
import { type APIError } from "../types/api";

/**
 * Parse a fetch Response into Either<APIError, T>.
 * - 403 → forbidden
 * - 200 → decode JSON body with the provided decoder
 * - other → error with status and message
 */
export async function parseResponse<T>(
  response: Response,
  decode: (json: unknown) => T,
): Promise<Either<APIError, T>> {
  if (response.status === 403 || response.status === 401) {
    return left({ type: "forbidden" });
  }
  if (response.status === 200) {
    try {
      const json: unknown = await response.json();
      return right(decode(json));
    } catch (e) {
      return left({
        type: "parseFailure",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return left({
    type: "error",
    status: response.status,
    message: response.statusText,
  });
}

/**
 * Like parseResponse but returns null for 404.
 */
export async function parseResponseMaybe<T>(
  response: Response,
  decode: (json: unknown) => T,
): Promise<Either<APIError, T | null>> {
  if (response.status === 404) {
    return right(null);
  }
  return parseResponse(response, decode);
}
