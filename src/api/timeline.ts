import { getWithCredentials, postWithXsrf } from "./http";
import { type Either, left, right } from "../types/either";
import { type APIError } from "../types/api";
import { type ProjectId, type KeyedEvent, type Interval } from "../types/domain";

export type TimelineError =
  | { type: "apiError"; error: APIError }
  | { type: "unexpected"; message: string };

function timelineLeft(msg: string): Either<TimelineError, never> {
  return left({ type: "unexpected", message: msg });
}

interface EventJSON {
  eventId: string;
  event: {
    start?: { eventTime: string };
    stop?: { eventTime: string };
  };
}

function decodeKeyedEvent(json: unknown): KeyedEvent {
  const j = json as EventJSON;
  if (j.event.start) {
    return {
      eventId: j.eventId,
      eventTime: new Date(j.event.start.eventTime),
      eventType: "start",
    };
  } else if (j.event.stop) {
    return {
      eventId: j.eventId,
      eventTime: new Date(j.event.stop.eventTime),
      eventType: "stop",
    };
  }
  throw new Error("Event has neither start nor stop");
}

interface IntervalJSON {
  start: EventJSON;
  end: EventJSON;
}

function decodeInterval(json: unknown): Interval {
  const j = json as IntervalJSON;
  const s = decodeKeyedEvent(j.start);
  const e = decodeKeyedEvent(j.end);
  return { start: s.eventTime, end: e.eventTime };
}

export async function apiLogStart(
  pid: ProjectId,
): Promise<Either<TimelineError, KeyedEvent>> {
  try {
    const response = await postWithXsrf(
      `/api/user/projects/${pid}/logStart`,
      JSON.stringify({ schemaVersion: "2.0" }),
    );
    if (response.status === 200) {
      const json: unknown = await response.json();
      const ev = decodeKeyedEvent(json);
      if (ev.eventType !== "start") {
        return timelineLeft("Expected start event, got stop.");
      }
      return right(ev);
    }
    return left({
      type: "apiError",
      error: {
        type: "error",
        status: response.status,
        message: response.statusText,
      },
    });
  } catch (e) {
    return left({
      type: "unexpected",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiLogEnd(
  pid: ProjectId,
): Promise<Either<TimelineError, KeyedEvent>> {
  try {
    const response = await postWithXsrf(
      `/api/user/projects/${pid}/logEnd`,
      JSON.stringify({ schemaVersion: "2.0" }),
    );
    if (response.status === 200) {
      const json: unknown = await response.json();
      const ev = decodeKeyedEvent(json);
      if (ev.eventType !== "stop") {
        return timelineLeft("Expected stop event, got start.");
      }
      return right(ev);
    }
    return left({
      type: "apiError",
      error: {
        type: "error",
        status: response.status,
        message: response.statusText,
      },
    });
  } catch (e) {
    return left({
      type: "unexpected",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiListIntervals(
  pid: ProjectId,
  before?: Date,
  after?: Date,
): Promise<Either<TimelineError, Interval[]>> {
  try {
    const params: string[] = [];
    if (before) params.push(`before=${before.toISOString()}`);
    if (after) params.push(`after=${after.toISOString()}`);
    params.push("limit=100");
    const query = params.join("&");

    const response = await getWithCredentials(
      `/api/user/projects/${pid}/workIndex?${query}`,
    );
    if (response.status === 200) {
      const json = (await response.json()) as {
        workIndex: Array<{ intervals: IntervalJSON[] }>;
      };
      const intervals: Interval[] = [];
      for (const entry of json.workIndex) {
        for (const ij of entry.intervals) {
          intervals.push(decodeInterval(ij));
        }
      }
      return right(intervals);
    }
    return left({
      type: "apiError",
      error: {
        type: "error",
        status: response.status,
        message: response.statusText,
      },
    });
  } catch (e) {
    return left({
      type: "unexpected",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiGetLatestEvent(
  pid: ProjectId,
): Promise<Either<TimelineError, KeyedEvent | null>> {
  try {
    const response = await getWithCredentials(
      `/api/user/projects/${pid}/events`,
    );
    if (response.status === 200) {
      const json = (await response.json()) as EventJSON[];
      if (json.length === 0) return right(null);
      return right(decodeKeyedEvent(json[0]));
    }
    return left({
      type: "apiError",
      error: {
        type: "error",
        status: response.status,
        message: response.statusText,
      },
    });
  } catch (e) {
    return left({
      type: "unexpected",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
