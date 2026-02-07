import { useState } from "react";
import { type System } from "../capabilities/system";
import { type InviteCapability } from "../capabilities/overview";
import { type ProjectId } from "../types/domain";
import { type CommsAddress, type Zip321Request } from "../types/api";
import { Modal } from "../components/Modal";
import { Zip321QR } from "../components/Zip321QR";

type CommsType = "email" | "zcash";

type Mode =
  | { type: "form" }
  | { type: "qrScan"; request: Zip321Request };

interface InviteCollaboratorModalProps {
  system: System;
  caps: InviteCapability;
  projectId: ProjectId | null;
  open: boolean;
  onClose: () => void;
}

export function InviteCollaboratorModal({
  system,
  caps,
  projectId,
  open,
  onClose,
}: InviteCollaboratorModalProps) {
  const [mode, setMode] = useState<Mode>({ type: "form" });
  const [greetName, setGreetName] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<CommsType>("email");
  const [email, setEmail] = useState("");
  const [zaddr, setZaddr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  function reset() {
    setMode({ type: "form" });
    setGreetName("");
    setMessage("");
    setChannel("email");
    setEmail("");
    setZaddr("");
    setFieldErrors([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleInvite() {
    if (!projectId) {
      setFieldErrors(["No project selected"]);
      return;
    }

    const errors: string[] = [];
    if (!greetName.trim()) errors.push("The name field is required");
    if (channel === "email" && !email.trim())
      errors.push("An email value is required when email comms are selected");
    if (channel === "zcash" && !zaddr.trim())
      errors.push("A Zcash shielded address is required");

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors([]);

    const inviteBy: CommsAddress =
      channel === "email"
        ? { type: "email", email: email.trim() }
        : { type: "zcash", zaddr: zaddr.trim() };

    const result = await caps.invite(projectId, {
      greetName: greetName.trim(),
      message: message.trim() || null,
      inviteBy,
    });

    if (result.type === "right") {
      if (result.value) {
        setMode({ type: "qrScan", request: result.value });
      } else {
        handleClose();
      }
    } else {
      system.error(`Invitation failed: ${result.value.type}`);
      setFieldErrors(["Failed to send invitation"]);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite a collaborator"
      footer={
        mode.type === "form" ? (
          <>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
            <button
              onClick={() => void handleInvite()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Send invitation
            </button>
          </>
        ) : (
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Done
          </button>
        )
      }
    >
      {mode.type === "form" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleInvite();
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="greetName"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="greetName"
              type="text"
              placeholder="Who are you inviting?"
              value={greetName}
              onChange={(e) => setGreetName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="inviteMessage"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <input
              id="inviteMessage"
              type="text"
              placeholder="Enter your message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Method
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  channel === "email"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setChannel("zcash")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  channel === "zcash"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Zcash
              </button>
            </div>
          </div>
          {channel === "email" ? (
            <div>
              <label
                htmlFor="inviteEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="inviteEmail"
                type="email"
                placeholder="name@address.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="inviteZaddr"
                className="block text-sm font-medium text-gray-700"
              >
                Zcash Shielded Address
              </label>
              <input
                id="inviteZaddr"
                type="text"
                placeholder="Enter a Zcash shielded address"
                value={zaddr}
                onChange={(e) => setZaddr(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {fieldErrors.map((err, i) => (
            <span
              key={i}
              className="inline-block mt-1 px-2 py-0.5 text-sm text-red-700 bg-red-50 rounded"
            >
              {err}
            </span>
          ))}
        </form>
      ) : (
        <Zip321QR request={mode.request} />
      )}
    </Modal>
  );
}
