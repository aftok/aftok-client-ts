import { z } from "zod";
import { uuidSchema } from "./common";
import type { KeyedEvent, Interval } from "../../types/domain";

const creditToSchema = z.union([
  z.object({ creditToUser: uuidSchema }),
  z.object({ creditToAccount: uuidSchema }),
  z.object({ creditToProject: uuidSchema }),
]);

const logEventSchema = z.union([
  z.object({ start: z.object({ eventTime: z.string() }) }),
  z.object({ stop: z.object({ eventTime: z.string() }) }),
]);

const keyedLogEntrySchema = z.object({
  eventId: uuidSchema,
  creditTo: creditToSchema,
  event: logEventSchema,
  eventMeta: z.unknown().nullable(),
});

export const keyedLogEntryListSchema = z.array(keyedLogEntrySchema);

function decodeKeyedLogEntry(
  parsed: z.infer<typeof keyedLogEntrySchema>,
): KeyedEvent {
  if ("start" in parsed.event) {
    return {
      eventId: parsed.eventId,
      eventTime: new Date(parsed.event.start.eventTime),
      eventType: "start",
    };
  } else {
    return {
      eventId: parsed.eventId,
      eventTime: new Date(parsed.event.stop.eventTime),
      eventType: "stop",
    };
  }
}

// POST /user/projects/:pid/logStart or logEnd
const extendedLogEntrySchema = z.object({
  projectId: uuidSchema,
  loggedBy: uuidSchema,
  eventId: uuidSchema,
  creditTo: creditToSchema,
  event: logEventSchema,
  eventMeta: z.unknown().nullable(),
});

export function decodeExtendedLogEntry(json: unknown): KeyedEvent {
  const parsed = extendedLogEntrySchema.parse(json);
  return decodeKeyedLogEntry(parsed);
}

// GET /user/projects/:pid/events
export function decodeEvents(json: unknown): KeyedEvent[] {
  const parsed = keyedLogEntryListSchema.parse(json);
  return parsed.map(decodeKeyedLogEntry);
}

// GET /user/projects/:pid/workIndex
const intervalSchema = z.object({
  start: keyedLogEntrySchema,
  end: keyedLogEntrySchema,
});

const workIndexEntrySchema = z.object({
  creditTo: creditToSchema,
  intervals: z.array(intervalSchema),
});

const workIndexResponseSchema = z.object({
  workIndex: z.array(workIndexEntrySchema),
});

export function decodeWorkIndex(json: unknown): Interval[] {
  const parsed = workIndexResponseSchema.parse(json);
  const intervals: Interval[] = [];
  for (const entry of parsed.workIndex) {
    for (const ival of entry.intervals) {
      const start = decodeKeyedLogEntry(ival.start);
      const end = decodeKeyedLogEntry(ival.end);
      intervals.push({ start: start.eventTime, end: end.eventTime });
    }
  }
  return intervals;
}
