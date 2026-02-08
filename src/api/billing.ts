import { getWithCredentials, postWithXsrf } from "./http";
import { type Either, left, right } from "../types/either";
import { type APIError } from "../types/api";
import {
  type ProjectId,
  type BillableId,
  type Billable,
  type PaymentRequest,
  type Recurrence,
} from "../types/domain";
import { decodeBillables, decodePaymentRequest, billableCreateResponseSchema } from "./schemas/billing";

// --- JSON encoding ---

function recurrenceToJSON(r: Recurrence): unknown {
  switch (r.type) {
    case "annually":
      return { annually: {} };
    case "monthly":
      return { monthly: r.months };
    case "weekly":
      return { weekly: r.weeks };
    case "onetime":
      return { onetime: {} };
  }
}

function billableToJSON(b: Billable): unknown {
  return {
    schemaVersion: "1.0",
    Billable: {
      name: b.name,
      description: b.description,
      message: b.message,
      recurrence: recurrenceToJSON(b.recurrence),
      currency: "ZEC",
      amount: Number(b.amount),
      gracePeriod: b.gracePeriod,
      requestExpiryPeriod: b.requestExpiryPeriod * 3600, // hours → seconds
    },
  };
}

// --- API functions ---

export async function apiListBillables(
  pid: ProjectId,
): Promise<Either<APIError, Array<[BillableId, Billable]>>> {
  try {
    const response = await getWithCredentials(
      `/api/projects/${pid}/billables`,
    );
    if (response.status === 403) return left({ type: "forbidden" });
    if (response.status === 200) {
      try {
        const json: unknown = await response.json();
        return right(decodeBillables(json));
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
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiCreateBillable(
  pid: ProjectId,
  billable: Billable,
): Promise<Either<APIError, BillableId>> {
  try {
    const response = await postWithXsrf(
      `/api/projects/${pid}/billables`,
      JSON.stringify(billableToJSON(billable)),
    );
    if (response.status === 403) return left({ type: "forbidden" });
    if (response.status === 200) {
      try {
        const json: unknown = await response.json();
        return right(billableCreateResponseSchema.parse(json).billableId);
      } catch (e) {
        return left({
          type: "parseFailure",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
    const body = await response.text().catch(() => response.statusText);
    return left({
      type: "error",
      status: response.status,
      message: body,
    });
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export interface PaymentRequestMeta {
  requestName: string;
  requestDesc?: string;
}

export type PaymentRequestError =
  | APIError
  | { type: "noPayableMembers" };

export async function apiCreatePaymentRequest(
  pid: ProjectId,
  bid: BillableId,
  _meta: PaymentRequestMeta,
): Promise<Either<PaymentRequestError, PaymentRequest>> {
  try {
    const response = await postWithXsrf(
      `/api/projects/${pid}/billables/${bid}/paymentRequests`,
      JSON.stringify({ schemaVersion: "2.0" }),
    );
    if (response.status === 403) return left({ type: "forbidden" });
    if (response.status === 409) {
      try {
        const json = (await response.json()) as { error?: string };
        if (json.error === "noPayableMembers") {
          return left({ type: "noPayableMembers" });
        }
      } catch {
        // fall through to generic error
      }
      return left({ type: "error", status: 409, message: "Conflict" });
    }
    if (response.status === 200) {
      try {
        const json: unknown = await response.json();
        return right(decodePaymentRequest(json));
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
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
