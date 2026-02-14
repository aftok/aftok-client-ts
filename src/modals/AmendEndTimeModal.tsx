import { useState } from "react";
import { type TimelineCapability } from "../capabilities/timeline";
import { type Interval } from "../types/domain";
import { Modal } from "../components/Modal";

export type AmendEndTimeResult =
  | { type: "amended" }
  | { type: "cancelled" };

interface AmendEndTimeModalProps {
  caps: TimelineCapability;
  open: boolean;
  interval: Interval;
  onResult: (result: AmendEndTimeResult) => void;
}

/** Format a Date as a datetime-local input value (YYYY-MM-DDTHH:mm). */
function toDatetimeLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

export function AmendEndTimeModal({
  caps,
  open,
  interval,
  onResult,
}: AmendEndTimeModalProps) {
  const [newEndTime, setNewEndTime] = useState(toDatetimeLocal(interval.end));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setFieldError(null);
    setApiError(null);
    onResult({ type: "cancelled" });
  }

  async function handleSave() {
    setFieldError(null);
    setApiError(null);

    const parsed = new Date(newEndTime);
    if (isNaN(parsed.getTime())) {
      setFieldError("Please enter a valid date and time.");
      return;
    }

    if (parsed.getTime() <= interval.start.getTime()) {
      setFieldError("New end time must be after the interval start time.");
      return;
    }

    const endEventId = interval.endEventId;
    if (!endEventId) {
      setFieldError("This interval cannot be amended (missing event ID).");
      return;
    }

    setSaving(true);
    const result = await caps.amendEventTime(endEventId, parsed);
    setSaving(false);

    if (result.type === "right") {
      onResult({ type: "amended" });
    } else {
      const err = result.value;
      let msg: string;
      if (err.type === "unexpected") {
        msg = err.message;
      } else if (err.error.type === "forbidden") {
        msg = "Forbidden";
      } else if (err.error.type === "parseFailure") {
        msg = err.error.message;
      } else {
        msg = `Server error (${err.error.status}): ${err.error.message}`;
      }
      setApiError(msg);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Amend end time"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start time
          </label>
          <p className="mt-1 text-sm text-gray-500">
            {interval.start.toLocaleString()}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current end time
          </label>
          <p className="mt-1 text-sm text-gray-500">
            {interval.end.toLocaleString()}
          </p>
        </div>
        <div>
          <label
            htmlFor="newEndTime"
            className="block text-sm font-medium text-gray-700"
          >
            New end time
          </label>
          <input
            id="newEndTime"
            type="datetime-local"
            value={newEndTime}
            onChange={(e) => setNewEndTime(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {fieldError && (
          <span className="inline-block mt-1 px-2 py-0.5 text-sm text-red-700 bg-red-50 rounded">
            {fieldError}
          </span>
        )}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {apiError}
          </div>
        )}
      </form>
    </Modal>
  );
}
