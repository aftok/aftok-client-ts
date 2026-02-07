import { useState } from "react";
import { type System } from "../capabilities/system";
import { type PaymentRequestCapability } from "../capabilities/billing";
import { type ProjectId, type BillableId, type PaymentRequest } from "../types/domain";
import { Zip321QR } from "../components/Zip321QR";
import { Modal } from "../components/Modal";

interface PaymentRequestModalProps {
  system: System;
  caps: PaymentRequestCapability;
  projectId: ProjectId | null;
  billableId: BillableId | null;
  open: boolean;
  onClose: () => void;
}

type Mode =
  | { type: "form" }
  | { type: "qr"; paymentRequest: PaymentRequest };

export function PaymentRequestModal({
  system,
  caps,
  projectId,
  billableId,
  open,
  onClose,
}: PaymentRequestModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<Mode>({ type: "form" });
  const [nameError, setNameError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setName("");
    setDescription("");
    setMode({ type: "form" });
    setNameError(false);
    onClose();
  }

  async function handleCreate() {
    if (!projectId || !billableId) {
      system.error("Project or billable ID is missing.");
      return;
    }
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setSubmitting(true);

    const result = await caps.createPaymentRequest(projectId, billableId, {
      requestName: name.trim(),
      requestDesc: description.trim() || undefined,
    });

    setSubmitting(false);

    if (result.type === "right") {
      setMode({ type: "qr", paymentRequest: result.value });
    } else {
      system.error("Failed to create payment request.");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Payment Request">
      {mode.type === "form" ? (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Request Name</label>
              <input
                type="text"
                className={`w-full border rounded-md px-3 py-2 text-sm ${nameError ? "border-red-500" : "border-gray-300"}`}
                placeholder="A name for the payment request"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {nameError && (
                <p className="text-red-600 text-xs mt-1">The name field is required.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Additional descriptive information"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Request"}
            </button>
          </div>
        </>
      ) : (
        <>
          <Zip321QR
            request={mode.paymentRequest.nativeRequest.zip321Request}
          />
          <div className="flex justify-end mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
