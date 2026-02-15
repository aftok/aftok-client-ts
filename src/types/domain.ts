export type UserId = string; // UUID
export type ProjectId = string; // UUID

export interface Project {
  projectId: ProjectId;
  projectName: string;
  inceptionDate: Date;
  initiator: UserId;
  depf: DepreciationFn;
}

export type DepreciationFn = LinearDepreciation;

export interface LinearDepreciation {
  type: "LinearDepreciation";
  undep: number; // days
  dep: number; // days
}

export interface Contributor {
  userId: UserId;
  handle: string;
  joinedOn: Date;
  loggedHours: number;
  depreciatedHours: number;
  revShare: { numerator: number; denominator: number };
}

export interface ProjectDetail {
  project: Project;
  contributors: Map<UserId, Contributor>;
}

// Timeline types

export type EventType = "start" | "stop";

export interface KeyedEvent {
  eventId: string;
  eventTime: Date;
  eventType: EventType;
}

export interface Interval {
  start: Date;
  end: Date;
  startEventId?: string;
  endEventId?: string;
  /** Original start time before day-boundary splitting. */
  originalStart?: Date;
  /** Original end time before day-boundary splitting. */
  originalEnd?: Date;
}

export interface AmendEventResponse {
  replacementEventId: string;
  amendmentId: string;
}

export interface TimeSpan {
  hours: number;
  minutes: number;
  seconds: number;
}

// Account settings types

export interface AccountSettings {
  username: string;
  zcashAddress: string | null;
}

// Billing types

export type BillableId = string; // UUID
export type PaymentRequestId = string; // UUID

export type Recurrence =
  | { type: "annually" }
  | { type: "monthly"; months: number }
  | { type: "weekly"; weeks: number }
  | { type: "onetime" };

export function recurrenceStr(r: Recurrence): string {
  switch (r.type) {
    case "annually":
      return "Annually";
    case "monthly":
      return `Every ${r.months} month${r.months !== 1 ? "s" : ""}`;
    case "weekly":
      return `Every ${r.weeks} week${r.weeks !== 1 ? "s" : ""}`;
    case "onetime":
      return "One-time purchase";
  }
}

export interface Billable {
  name: string;
  description: string;
  message: string;
  recurrence: Recurrence;
  amount: bigint; // Zatoshi
  gracePeriod: number; // days
  requestExpiryPeriod: number; // hours
}

export interface PaymentRequest {
  paymentRequestId: string;
  nativeRequest: {
    zip321Request: string;
  };
  expiresAt: Date;
  total: bigint; // Zatoshi
}
