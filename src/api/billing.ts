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
    name: b.name,
    description: b.description,
    message: b.message,
    recurrence: recurrenceToJSON(b.recurrence),
    currency: "ZEC",
    amount: Number(b.amount),
    gracePeriod: b.gracePeriod,
    requestExpiryPeriod: b.requestExpiryPeriod * 3600, // hours → seconds
  };
}

// --- JSON decoding ---

interface RecurrenceJSON {
  annually?: Record<string, never>;
  monthly?: number;
  weekly?: number;
  onetime?: Record<string, never>;
}

function decodeRecurrence(json: RecurrenceJSON): Recurrence {
  if (json.annually !== undefined) return { type: "annually" };
  if (json.monthly !== undefined) return { type: "monthly", months: json.monthly };
  if (json.weekly !== undefined) return { type: "weekly", weeks: json.weekly };
  if (json.onetime !== undefined) return { type: "onetime" };
  return { type: "onetime" };
}

interface BillableJSON {
  billableId: string;
  name: string;
  description?: string;
  message?: string;
  recurrence: RecurrenceJSON;
  amount: { zatoshi: number } | number;
  gracePeriod: number;
  requestExpiryPeriod?: number; // seconds
}

function decodeBillable(json: BillableJSON): [BillableId, Billable] {
  const amt =
    typeof json.amount === "number"
      ? BigInt(json.amount)
      : BigInt(json.amount.zatoshi);

  return [
    json.billableId,
    {
      name: json.name,
      description: json.description ?? "",
      message: json.message ?? "",
      recurrence: decodeRecurrence(json.recurrence),
      amount: amt,
      gracePeriod: json.gracePeriod,
      requestExpiryPeriod: json.requestExpiryPeriod
        ? json.requestExpiryPeriod / 3600
        : 24,
    },
  ];
}

interface PaymentRequestJSON {
  payment_request_id: string;
  native_request: {
    zip321_request: string;
  };
  expires_at: string;
  total: { zatoshi: number } | number;
}

function decodePaymentRequest(json: PaymentRequestJSON): PaymentRequest {
  const total =
    typeof json.total === "number"
      ? BigInt(json.total)
      : BigInt(json.total.zatoshi);

  return {
    paymentRequestId: json.payment_request_id,
    nativeRequest: {
      zip321Request: json.native_request.zip321_request,
    },
    expiresAt: new Date(json.expires_at),
    total,
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
      const json = (await response.json()) as BillableJSON[];
      return right(json.map(decodeBillable));
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
      const json = (await response.json()) as { billableId: string };
      return right(json.billableId);
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

export interface PaymentRequestMeta {
  requestName: string;
  requestDesc?: string;
}

export async function apiCreatePaymentRequest(
  pid: ProjectId,
  bid: BillableId,
  _meta: PaymentRequestMeta,
): Promise<Either<APIError, PaymentRequest>> {
  try {
    const response = await postWithXsrf(
      `/api/projects/${pid}/billables/${bid}/paymentRequests`,
      JSON.stringify({ schemaVersion: "2.0" }),
    );
    if (response.status === 403) return left({ type: "forbidden" });
    if (response.status === 200) {
      const json = (await response.json()) as PaymentRequestJSON;
      return right(decodePaymentRequest(json));
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
