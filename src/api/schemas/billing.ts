import { z } from "zod";
import { uuidSchema } from "./common";
import type { Billable, BillableId, Recurrence, PaymentRequest } from "../../types/domain";

const recurrenceSchema = z.union([
  z.object({ annually: z.null() }).transform((): Recurrence => ({ type: "annually" })),
  z.object({ monthly: z.number() }).transform((v): Recurrence => ({ type: "monthly", months: v.monthly })),
  z.object({ weekly: z.number() }).transform((v): Recurrence => ({ type: "weekly", weeks: v.weekly })),
  z.object({ onetime: z.null() }).transform((): Recurrence => ({ type: "onetime" })),
]);

const amountSchema = z.union([
  z.object({ currency: z.literal("ZEC"), zatoshi: z.number() }),
  z.object({ currency: z.literal("BTC"), satoshi: z.number() }),
]);

const billableResponseSchema = z.object({
  billableId: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  message: z.string().nullable(),
  recurrence: recurrenceSchema,
  amount: amountSchema,
  gracePeriod: z.number(),
  requestExpiryPeriod: z.number(),
});

export const billableListSchema = z.array(billableResponseSchema);

export function decodeBillables(json: unknown): Array<[BillableId, Billable]> {
  const parsed = billableListSchema.parse(json);
  return parsed.map((item) => {
    const amt =
      "zatoshi" in item.amount
        ? BigInt(item.amount.zatoshi)
        : BigInt(item.amount.satoshi);

    return [
      item.billableId,
      {
        name: item.name,
        description: item.description ?? "",
        message: item.message ?? "",
        recurrence: item.recurrence,
        amount: amt,
        gracePeriod: item.gracePeriod,
        requestExpiryPeriod: item.requestExpiryPeriod
          ? item.requestExpiryPeriod / 3600
          : 24,
      },
    ];
  });
}

const nativeRequestSchema = z.union([
  z.object({ zip321_request: z.string() }),
  z.object({
    bip70_request: z.object({
      payment_key: z.string(),
      payment_request_protobuf_64: z.string(),
    }),
  }),
]);

const paymentRequestResponseSchema = z.object({
  payment_request_id: uuidSchema,
  total: z.union([
    z.object({ zatoshi: z.number() }),
    z.object({ satoshi: z.number() }),
  ]),
  expires_at: z.string(),
  native_request: nativeRequestSchema,
});

export function decodePaymentRequest(json: unknown): PaymentRequest {
  const parsed = paymentRequestResponseSchema.parse(json);
  const total =
    "zatoshi" in parsed.total
      ? BigInt(parsed.total.zatoshi)
      : BigInt(parsed.total.satoshi);

  let nativeRequest: { zip321Request: string };
  if ("zip321_request" in parsed.native_request) {
    nativeRequest = { zip321Request: parsed.native_request.zip321_request };
  } else {
    // BIP70 - store the payment key as a fallback
    nativeRequest = { zip321Request: "" };
  }

  return {
    paymentRequestId: parsed.payment_request_id,
    nativeRequest,
    expiresAt: new Date(parsed.expires_at),
    total,
  };
}

// POST /projects/:pid/billables response
export const billableCreateResponseSchema = z.object({
  billableId: uuidSchema,
});
