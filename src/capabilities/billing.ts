import { type Either } from "../types/either";
import { type APIError } from "../types/api";
import {
  type ProjectId,
  type BillableId,
  type Billable,
  type PaymentRequest,
} from "../types/domain";
import {
  apiListBillables,
  apiCreateBillable,
  apiCreatePaymentRequest,
  type PaymentRequestMeta,
} from "../api/billing";

export interface CreateBillableCapability {
  createBillable: (
    pid: ProjectId,
    billable: Billable,
  ) => Promise<Either<APIError, BillableId>>;
}

export interface PaymentRequestCapability {
  createPaymentRequest: (
    pid: ProjectId,
    bid: BillableId,
    meta: PaymentRequestMeta,
  ) => Promise<Either<APIError, PaymentRequest>>;
}

export interface BillingCapability {
  listBillables: (
    pid: ProjectId,
  ) => Promise<Either<APIError, Array<[BillableId, Billable]>>>;
  createCaps: CreateBillableCapability;
  paymentRequestCaps: PaymentRequestCapability;
}

export const apiBillingCapability: BillingCapability = {
  listBillables: apiListBillables,
  createCaps: {
    createBillable: apiCreateBillable,
  },
  paymentRequestCaps: {
    createPaymentRequest: apiCreatePaymentRequest,
  },
};

export const mockBillingCapability: BillingCapability = {
  listBillables: async () => ({ type: "right", value: [] }),
  createCaps: {
    createBillable: async () => ({
      type: "right",
      value: "mock-billable-id",
    }),
  },
  paymentRequestCaps: {
    createPaymentRequest: async () => ({
      type: "right",
      value: {
        paymentRequestId: "mock-pr-id",
        nativeRequest: {
          zip321Request: "zcash:?address=mock&amount=1.0",
        },
        expiresAt: new Date(),
        total: 100000000n,
      },
    }),
  },
};
