import { useState } from "react";
import { type System } from "../capabilities/system";
import { type CreateBillableCapability } from "../capabilities/billing";
import { type ProjectId, type Billable, type Recurrence } from "../types/domain";
import { parseZec } from "../types/zcash";
import { Modal } from "../components/Modal";

interface CreateBillableModalProps {
  system: System;
  caps: CreateBillableCapability;
  projectId: ProjectId | null;
  open: boolean;
  onClose: () => void;
  onBillableCreated: (bid: string) => void;
}

type RecurrenceType = "annually" | "monthly" | "weekly" | "onetime";

type FieldError =
  | "name"
  | "description"
  | "message"
  | "recurrenceValue"
  | "amount"
  | "gracePeriod"
  | "requestExpiry";

export function CreateBillableModal({
  system,
  caps,
  projectId,
  open,
  onClose,
  onBillableCreated,
}: CreateBillableModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("monthly");
  const [recurrenceValue, setRecurrenceValue] = useState("");
  const [amount, setAmount] = useState("");
  const [gracePeriod, setGracePeriod] = useState("");
  const [requestExpiry, setRequestExpiry] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setDescription("");
    setMessage("");
    setRecurrenceType("monthly");
    setRecurrenceValue("");
    setAmount("");
    setGracePeriod("");
    setRequestExpiry("");
    setFieldErrors([]);
    setSubmitError(null);
  }

  function validate(): Billable | null {
    const errors: FieldError[] = [];

    if (!name.trim()) errors.push("name");
    if (!description.trim()) errors.push("description");
    if (!message.trim()) errors.push("message");

    let recurrence: Recurrence | null = null;
    switch (recurrenceType) {
      case "annually":
        recurrence = { type: "annually" };
        break;
      case "monthly": {
        const v = parseInt(recurrenceValue, 10);
        if (isNaN(v) || v < 1) errors.push("recurrenceValue");
        else recurrence = { type: "monthly", months: v };
        break;
      }
      case "weekly": {
        const v = parseInt(recurrenceValue, 10);
        if (isNaN(v) || v < 1) errors.push("recurrenceValue");
        else recurrence = { type: "weekly", weeks: v };
        break;
      }
      case "onetime":
        recurrence = { type: "onetime" };
        break;
    }

    const zats = parseZec(amount);
    if (zats === null || zats <= 0n) errors.push("amount");

    const gp = parseInt(gracePeriod, 10);
    if (isNaN(gp) || gp < 0) errors.push("gracePeriod");

    const re = parseInt(requestExpiry, 10);
    if (isNaN(re) || re < 1) errors.push("requestExpiry");

    setFieldErrors(errors);
    if (errors.length > 0 || !recurrence || !zats) return null;

    return {
      name: name.trim(),
      description: description.trim(),
      message: message.trim(),
      recurrence,
      amount: zats,
      gracePeriod: gp,
      requestExpiryPeriod: re,
    };
  }

  async function handleCreate() {
    if (!projectId) return;
    const billable = validate();
    if (!billable) return;

    setSubmitting(true);
    setSubmitError(null);
    const result = await caps.createBillable(projectId, billable);
    setSubmitting(false);

    if (result.type === "right") {
      resetForm();
      onBillableCreated(result.value);
      onClose();
    } else {
      const detail = result.value.type === "error" ? result.value.message : result.value.type;
      system.error(`Failed to create billable: ${detail}`);
      setSubmitError("Something went wrong. Please try again, or contact support if the problem persists.");
    }
  }

  function hasError(f: FieldError): boolean {
    return fieldErrors.includes(f);
  }

  const needsRecurrenceValue = recurrenceType === "monthly" || recurrenceType === "weekly";

  return (
    <Modal open={open} onClose={onClose} title="Create Billable">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            type="text"
            className={`w-full border rounded-md px-3 py-2 text-sm ${hasError("name") ? "border-red-500" : "border-gray-300"}`}
            placeholder="A name for the product or service"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {hasError("name") && (
            <p className="text-red-600 text-xs mt-1">The name field is required.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            className={`w-full border rounded-md px-3 py-2 text-sm ${hasError("description") ? "border-red-500" : "border-gray-300"}`}
            placeholder="Description of the product or service"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {hasError("description") && (
            <p className="text-red-600 text-xs mt-1">The description field is required.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <input
            type="text"
            className={`w-full border rounded-md px-3 py-2 text-sm ${hasError("message") ? "border-red-500" : "border-gray-300"}`}
            placeholder="Message to include with the bill"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {hasError("message") && (
            <p className="text-red-600 text-xs mt-1">The message field is required.</p>
          )}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">Recurrence</legend>
          <div className="space-y-2">
            {(["annually", "monthly", "weekly", "onetime"] as RecurrenceType[]).map(
              (rt) => (
                <label key={rt} className="flex items-center space-x-2 text-sm">
                  <input
                    type="radio"
                    name="recurrenceType"
                    checked={recurrenceType === rt}
                    onChange={() => setRecurrenceType(rt)}
                  />
                  <span className="capitalize">{rt === "onetime" ? "One-time" : rt}</span>
                </label>
              ),
            )}
          </div>
          {needsRecurrenceValue && (
            <div className="mt-2">
              <input
                type="number"
                min="1"
                className={`w-24 border rounded-md px-3 py-2 text-sm ${hasError("recurrenceValue") ? "border-red-500" : "border-gray-300"}`}
                placeholder={recurrenceType === "monthly" ? "months" : "weeks"}
                value={recurrenceValue}
                onChange={(e) => setRecurrenceValue(e.target.value)}
              />
              {hasError("recurrenceValue") && (
                <p className="text-red-600 text-xs mt-1">
                  Enter a valid number of {recurrenceType === "monthly" ? "months" : "weeks"}.
                </p>
              )}
            </div>
          )}
        </fieldset>

        <div>
          <label className="block text-sm font-medium mb-1">Amount (ZEC)</label>
          <input
            type="text"
            className={`w-full border rounded-md px-3 py-2 text-sm ${hasError("amount") ? "border-red-500" : "border-gray-300"}`}
            placeholder="1.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {hasError("amount") && (
            <p className="text-red-600 text-xs mt-1">Enter a valid ZEC amount.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Grace Period (days)</label>
          <input
            type="number"
            min="0"
            className={`w-full border rounded-md px-3 py-2 text-sm ${hasError("gracePeriod") ? "border-red-500" : "border-gray-300"}`}
            placeholder="Days until a bill is considered overdue"
            value={gracePeriod}
            onChange={(e) => setGracePeriod(e.target.value)}
          />
          {hasError("gracePeriod") && (
            <p className="text-red-600 text-xs mt-1">Enter a valid number of days.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Request Expiry (hours)
          </label>
          <input
            type="number"
            min="1"
            className={`w-full border rounded-md px-3 py-2 text-sm ${hasError("requestExpiry") ? "border-red-500" : "border-gray-300"}`}
            placeholder="Hours until a payment request expires"
            value={requestExpiry}
            onChange={(e) => setRequestExpiry(e.target.value)}
          />
          {hasError("requestExpiry") && (
            <p className="text-red-600 text-xs mt-1">Enter a valid number of hours.</p>
          )}
        </div>
      </div>

      {submitError && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {submitError}
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => void handleCreate()}
          disabled={submitting}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Billable"}
        </button>
      </div>
    </Modal>
  );
}
