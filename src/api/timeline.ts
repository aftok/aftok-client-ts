import { getWithCredentials, postWithXsrf } from "./http";
import { type Either, left, right } from "../types/either";
import { type APIError } from "../types/api";
import { type ProjectId, type KeyedEvent, type Interval } from "../types/domain";
import { decodeExtendedLogEntry, decodeEvents, decodeWorkIndex } from "./schemas/timeline";

export type TimelineError =
  | { type: "apiError"; error: APIError }
  | { type: "unexpected"; message: string };

function timelineLeft(msg: string): Either<TimelineError, never> {
  return left({ type: "unexpected", message: msg });
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
      try {
        const json: unknown = await response.json();
        const ev = decodeExtendedLogEntry(json);
        if (ev.eventType !== "start") {
          return timelineLeft("Expected start event, got stop.");
        }
        return right(ev);
      } catch (e) {
        return timelineLeft(e instanceof Error ? e.message : String(e));
      }
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
      try {
        const json: unknown = await response.json();
        const ev = decodeExtendedLogEntry(json);
        if (ev.eventType !== "stop") {
          return timelineLeft("Expected stop event, got start.");
        }
        return right(ev);
      } catch (e) {
        return timelineLeft(e instanceof Error ? e.message : String(e));
      }
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
      try {
        const json: unknown = await response.json();
        return right(decodeWorkIndex(json));
      } catch (e) {
        return timelineLeft(e instanceof Error ? e.message : String(e));
      }
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
      try {
        const json: unknown = await response.json();
        const events = decodeEvents(json);
        if (events.length === 0) return right(null);
        return right(events[0]!);
      } catch (e) {
        return timelineLeft(e instanceof Error ? e.message : String(e));
      }
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
