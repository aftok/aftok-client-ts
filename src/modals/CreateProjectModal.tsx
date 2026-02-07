import { useState } from "react";
import { type System } from "../capabilities/system";
import { type CreateProjectCapability } from "../capabilities/overview";
import { type ProjectId } from "../types/domain";
import { Modal } from "../components/Modal";

export type CreateProjectResult =
  | { type: "created"; pid: ProjectId }
  | { type: "cancelled" };

interface CreateProjectModalProps {
  system: System;
  caps: CreateProjectCapability;
  open: boolean;
  onResult: (result: CreateProjectResult) => void;
}

export function CreateProjectModal({
  system,
  caps,
  open,
  onResult,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [undepDays, setUndepDays] = useState("");
  const [depDays, setDepDays] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  function reset() {
    setProjectName("");
    setUndepDays("");
    setDepDays("");
    setFieldErrors([]);
    setApiError(null);
  }

  function handleClose() {
    reset();
    onResult({ type: "cancelled" });
  }

  async function handleSave() {
    const errors: string[] = [];
    if (!projectName.trim()) errors.push("The name field is required");
    const undep = Number(undepDays);
    if (!undepDays || isNaN(undep))
      errors.push(
        "A number of days before depreciation starts is required",
      );
    const dep = Number(depDays);
    if (!depDays || isNaN(dep))
      errors.push(
        "The number of days over which a share depreciates is required",
      );

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors([]);
    setApiError(null);
    system.log("Creating project...");

    const result = await caps.createProject(projectName.trim(), {
      type: "LinearDepreciation",
      undep,
      dep,
    });

    if (result.type === "right") {
      system.log(`Project created: ${result.value}`);
      reset();
      onResult({ type: "created", pid: result.value });
    } else {
      const err = result.value;
      const msg =
        err.type === "error" && err.status === 409
          ? "A project with this name already exists."
          : `Failed to create project: ${err.type === "error" ? err.message : err.type}`;
      setApiError(msg);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create a new project"
      footer={
        <>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={() => void handleSave()}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create project
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
          <label
            htmlFor="projectName"
            className="block text-sm font-medium text-gray-700"
          >
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            placeholder="My awesome new project!!!"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="undepDays"
            className="block text-sm font-medium text-gray-700"
          >
            Days before depreciation starts
          </label>
          <input
            id="undepDays"
            type="number"
            placeholder="180"
            value={undepDays}
            onChange={(e) => setUndepDays(e.target.value)}
            className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="depDays"
            className="block text-sm font-medium text-gray-700"
          >
            Days over which a share depreciates
          </label>
          <input
            id="depDays"
            type="number"
            placeholder="1800"
            value={depDays}
            onChange={(e) => setDepDays(e.target.value)}
            className="mt-1 w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {fieldErrors.map((err, i) => (
          <span
            key={i}
            className="inline-block mt-1 px-2 py-0.5 text-sm text-red-700 bg-red-50 rounded"
          >
            {err}
          </span>
        ))}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {apiError}
          </div>
        )}
      </form>
    </Modal>
  );
}
