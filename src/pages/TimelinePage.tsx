import { useState, useEffect, useCallback } from "react";
import { type System } from "../capabilities/system";
import { type TimelineCapability } from "../capabilities/timeline";
import { type ProjectListCapability } from "../capabilities/project";
import { type ProjectId, type KeyedEvent, type Interval, type TimeSpan } from "../types/domain";
import { ProjectSelector } from "../components/ProjectSelector";
import { useTimer } from "../hooks/useTimer";
import { AmendEndTimeModal, type AmendEndTimeResult } from "../modals/AmendEndTimeModal";

interface TimelinePageProps {
  system: System;
  caps: TimelineCapability;
  projectCaps: ProjectListCapability;
  selectedProject: ProjectId | null;
  onProjectChange: (pid: ProjectId) => void;
}

/** Intervals grouped by local date string. */
interface DayIntervals {
  dateKey: string; // YYYY-MM-DD in local time
  dayStart: Date;
  dayEnd: Date;
  intervals: Interval[];
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get local midnight for a date. */
function localMidnight(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Get end of local day (next midnight). */
function localDayEnd(d: Date): Date {
  const r = localMidnight(d);
  r.setDate(r.getDate() + 1);
  return r;
}

/**
 * Split an interval across day boundaries.
 * Mirrors PureScript splitInterval (Timeline.purs:442).
 */
function splitInterval(iv: Interval): Array<{ dateKey: string; interval: Interval }> {
  const results: Array<{ dateKey: string; interval: Interval }> = [];
  let current = iv.start;

  while (current < iv.end) {
    const dayBoundary = localDayEnd(current);
    const segEnd = dayBoundary < iv.end ? dayBoundary : iv.end;
    results.push({
      dateKey: localDateKey(current),
      interval: {
        start: current,
        end: segEnd,
        startEventId: iv.startEventId,
        endEventId: iv.endEventId,
      },
    });
    current = dayBoundary;
  }

  return results;
}

/** Group intervals by local date, splitting those that span midnight. */
function buildHistory(intervals: Interval[]): Map<string, DayIntervals> {
  const map = new Map<string, DayIntervals>();

  for (const iv of intervals) {
    const segments = splitInterval(iv);
    for (const seg of segments) {
      let day = map.get(seg.dateKey);
      if (!day) {
        const ref = seg.interval.start;
        day = {
          dateKey: seg.dateKey,
          dayStart: localMidnight(ref),
          dayEnd: localDayEnd(ref),
          intervals: [],
        };
        map.set(seg.dateKey, day);
      }
      day.intervals.push(seg.interval);
    }
  }

  return map;
}

function msToTimeSpan(ms: number): TimeSpan {
  const totalSec = Math.floor(ms / 1000);
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

function formatTimeSpan(ts: TimeSpan): string {
  const h = String(ts.hours).padStart(2, "0");
  const m = String(ts.minutes).padStart(2, "0");
  const s = String(ts.seconds).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-");
  return `${m}/${d}/${y}`;
}

/** Compute total logged milliseconds across intervals. */
function totalMs(intervals: Interval[]): number {
  let total = 0;
  for (const iv of intervals) {
    total += iv.end.getTime() - iv.start.getTime();
  }
  return total;
}

export function TimelinePage({
  system,
  caps,
  projectCaps,
  selectedProject,
  onProjectChange,
}: TimelinePageProps) {
  const [history, setHistory] = useState<Map<string, DayIntervals>>(new Map());
  const [activeStart, setActiveStart] = useState<KeyedEvent | null>(null);
  const [now, setNow] = useState<Date>(system.now());
  const [loading, setLoading] = useState(false);
  const [amendInterval, setAmendInterval] = useState<Interval | null>(null);

  const isActive = activeStart !== null;

  // Load history and latest event for the selected project
  const loadTimeline = useCallback(
    async (pid: ProjectId) => {
      setLoading(true);
      const [intervalsResult, latestResult] = await Promise.all([
        caps.listIntervals(pid),
        caps.getLatestEvent(pid),
      ]);

      if (intervalsResult.type === "right") {
        setHistory(buildHistory(intervalsResult.value));
      } else {
        const err = intervalsResult.value;
        const msg =
          err.type === "unexpected"
            ? err.message
            : err.error.type === "forbidden"
              ? "Forbidden"
              : err.error.message;
        system.error(`Failed to load intervals: ${msg}`);
      }

      if (latestResult.type === "right") {
        const ev = latestResult.value;
        if (ev && ev.eventType === "start") {
          setActiveStart(ev);
        } else {
          setActiveStart(null);
        }
      }

      setLoading(false);
    },
    [caps, system],
  );

  useEffect(() => {
    if (selectedProject) {
      void loadTimeline(selectedProject);
    } else {
      setHistory(new Map());
      setActiveStart(null);
    }
  }, [selectedProject, loadTimeline]);

  // Refresh timer: update `now` every second while an interval is active,
  // so the elapsed time display ticks visibly.
  useTimer(
    () => setNow(system.now()),
    1_000,
    isActive,
  );

  async function handleStart() {
    if (!selectedProject || isActive) return;
    const result = await caps.logStart(selectedProject);
    if (result.type === "right") {
      setActiveStart(result.value);
      setNow(system.now());
    } else {
      system.error("Failed to start work interval.");
    }
  }

  async function handleStop() {
    if (!selectedProject || !isActive) return;
    const result = await caps.logEnd(selectedProject);
    if (result.type === "right") {
      // Merge the completed interval into history
      if (activeStart) {
        const completed: Interval = {
          start: activeStart.eventTime,
          end: result.value.eventTime,
        };
        setHistory((prev) => {
          const merged = new Map(prev);
          const segments = splitInterval(completed);
          for (const seg of segments) {
            let day = merged.get(seg.dateKey);
            if (!day) {
              const ref = seg.interval.start;
              day = {
                dateKey: seg.dateKey,
                dayStart: localMidnight(ref),
                dayEnd: localDayEnd(ref),
                intervals: [],
              };
            } else {
              day = { ...day, intervals: [...day.intervals] };
            }
            day.intervals.push(seg.interval);
            merged.set(seg.dateKey, day);
          }
          return merged;
        });
      }
      setActiveStart(null);
    } else {
      system.error("Failed to stop work interval.");
    }
  }

  function handleIntervalContextMenu(iv: Interval) {
    if (iv.endEventId) {
      setAmendInterval(iv);
    }
  }

  function handleAmendResult(result: AmendEndTimeResult) {
    setAmendInterval(null);
    if (result.type === "amended" && selectedProject) {
      void loadTimeline(selectedProject);
    }
  }

  // Build the active interval for display
  const activeInterval: Interval | null = activeStart
    ? { start: activeStart.eventTime, end: now }
    : null;

  // Merge history + active interval for display
  const displayHistory = new Map(history);
  if (activeInterval) {
    const segments = splitInterval(activeInterval);
    for (const seg of segments) {
      let day = displayHistory.get(seg.dateKey);
      if (!day) {
        const ref = seg.interval.start;
        day = {
          dateKey: seg.dateKey,
          dayStart: localMidnight(ref),
          dayEnd: localDayEnd(ref),
          intervals: [],
        };
      } else {
        day = { ...day, intervals: [...day.intervals] };
      }
      day.intervals.push(seg.interval);
      displayHistory.set(seg.dateKey, day);
    }
  }

  // Sort days in reverse chronological order
  const sortedDays = Array.from(displayHistory.values()).sort(
    (a, b) => b.dayStart.getTime() - a.dayStart.getTime(),
  );

  // Compute active elapsed time
  const activeElapsed = activeInterval
    ? msToTimeSpan(activeInterval.end.getTime() - activeInterval.start.getTime())
    : null;

  if (!selectedProject) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="w-64">
            <ProjectSelector
              system={system}
              caps={projectCaps}
              selectedProject={selectedProject}
              onProjectChange={onProjectChange}
            />
          </div>
          <p className="text-gray-500">Select a project to view the timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-64">
          <ProjectSelector
            system={system}
            caps={projectCaps}
            selectedProject={selectedProject}
            onProjectChange={onProjectChange}
          />
        </div>

        {/* Start/Stop controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => void handleStart()}
            disabled={isActive || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Start Work
          </button>
          <button
            onClick={() => void handleStop()}
            disabled={!isActive || loading}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Stop Work
          </button>
          {activeElapsed && (
            <span className="text-lg font-mono text-green-700">
              {formatTimeSpan(activeElapsed)}
            </span>
          )}
        </div>

        {loading && (
          <p className="text-gray-500 text-sm">Loading timeline...</p>
        )}

        {/* Day-by-day interval history */}
        {sortedDays.map((day) => (
          <DayRow
            key={day.dateKey}
            day={day}
            activeInterval={activeInterval}
            onIntervalContextMenu={handleIntervalContextMenu}
          />
        ))}

        {!loading && sortedDays.length === 0 && (
          <p className="text-gray-500 text-sm">
            No work intervals recorded yet. Click "Start Work" to begin.
          </p>
        )}
      </div>

      {amendInterval && (
        <AmendEndTimeModal
          caps={caps}
          open={true}
          interval={amendInterval}
          onResult={handleAmendResult}
        />
      )}
    </div>
  );
}

function DayRow({
  day,
  activeInterval,
  onIntervalContextMenu,
}: {
  day: DayIntervals;
  activeInterval: Interval | null;
  onIntervalContextMenu: (iv: Interval) => void;
}) {
  const dayMs = day.dayEnd.getTime() - day.dayStart.getTime();
  const dayTotal = totalMs(day.intervals);
  const dayTimeSpan = msToTimeSpan(dayTotal);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {formatDate(day.dateKey)} — {day.intervals.length} interval
          {day.intervals.length !== 1 ? "s" : ""}
        </span>
        <span className="text-gray-600 font-mono">
          {formatTimeSpan(dayTimeSpan)}
        </span>
      </div>
      <div className="relative h-11 border border-green-700 rounded bg-gray-50 overflow-hidden">
        {day.intervals.map((iv, i) => {
          const leftPct =
            ((iv.start.getTime() - day.dayStart.getTime()) / dayMs) * 100;
          const widthPct =
            ((iv.end.getTime() - iv.start.getTime()) / dayMs) * 100;

          // Check if this interval includes the active portion
          const isActiveBar =
            activeInterval !== null &&
            iv.end.getTime() === activeInterval.end.getTime();

          const canAmend = !isActiveBar && !!iv.endEventId;

          return (
            <div
              key={i}
              className={`absolute top-1 bottom-1 rounded ${isActiveBar ? "bg-green-400" : "bg-orange-400"} ${canAmend ? "cursor-context-menu" : ""}`}
              style={{
                left: `${leftPct}%`,
                width: `${Math.max(widthPct, 0.5)}%`,
              }}
              title={`${iv.start.toLocaleTimeString()} – ${iv.end.toLocaleTimeString()}`}
              onContextMenu={
                canAmend
                  ? (e) => {
                      e.preventDefault();
                      onIntervalContextMenu(iv);
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
