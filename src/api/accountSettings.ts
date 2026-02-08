import { type Either, left, right } from "../types/either";
import { type APIError } from "../types/api";
import { type AccountSettings } from "../types/domain";
import { getWithCredentials, putWithXsrf } from "./http";

export async function apiGetAccountSettings(): Promise<
  Either<APIError, AccountSettings>
> {
  try {
    const response = await getWithCredentials("/api/settings");
    if (response.status === 401 || response.status === 403) {
      return left({ type: "forbidden" });
    }
    if (response.status === 200) {
      const json = (await response.json()) as {
        username?: string;
        zcashAddress?: string | null;
      };
      if (typeof json.username !== "string") {
        return left({
          type: "parseFailure",
          message: "Missing username in response",
        });
      }
      return right({
        username: json.username,
        zcashAddress: json.zcashAddress ?? null,
      });
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

export async function apiSetPaymentAddress(
  zcashAddress: string,
): Promise<Either<APIError, void>> {
  try {
    const response = await putWithXsrf(
      "/api/settings/payment-address",
      JSON.stringify({ zcashAddress }),
    );
    if (response.status === 401 || response.status === 403) {
      return left({ type: "forbidden" });
    }
    if (response.status === 200 || response.status === 204) {
      return right(undefined);
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
