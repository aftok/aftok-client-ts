import { type Either } from "../types/either";
import { type ProjectId, type KeyedEvent, type Interval, type AmendEventResponse } from "../types/domain";
import {
  apiLogStart,
  apiLogEnd,
  apiListIntervals,
  apiGetLatestEvent,
  apiAmendEventTime,
  type TimelineError,
} from "../api/timeline";

export type { TimelineError } from "../api/timeline";

export interface TimelineCapability {
  logStart: (pid: ProjectId) => Promise<Either<TimelineError, KeyedEvent>>;
  logEnd: (pid: ProjectId) => Promise<Either<TimelineError, KeyedEvent>>;
  listIntervals: (
    pid: ProjectId,
    before?: Date,
    after?: Date,
  ) => Promise<Either<TimelineError, Interval[]>>;
  getLatestEvent: (
    pid: ProjectId,
  ) => Promise<Either<TimelineError, KeyedEvent | null>>;
  amendEventTime: (
    eventId: string,
    newTime: Date,
  ) => Promise<Either<TimelineError, AmendEventResponse>>;
}

export const apiTimelineCapability: TimelineCapability = {
  logStart: apiLogStart,
  logEnd: apiLogEnd,
  listIntervals: apiListIntervals,
  getLatestEvent: apiGetLatestEvent,
  amendEventTime: apiAmendEventTime,
};

export const mockTimelineCapability: TimelineCapability = {
  logStart: async () => ({
    type: "right",
    value: {
      eventId: "mock-event-id",
      eventTime: new Date(),
      eventType: "start" as const,
    },
  }),
  logEnd: async () => ({
    type: "right",
    value: {
      eventId: "mock-event-id",
      eventTime: new Date(),
      eventType: "stop" as const,
    },
  }),
  listIntervals: async () => ({ type: "right", value: [] }),
  getLatestEvent: async () => ({ type: "right", value: null }),
  amendEventTime: async () => ({
    type: "right",
    value: { replacementEventId: "mock-replacement-id", amendmentId: "mock-amendment-id" },
  }),
};
