import { useState, useEffect } from "react";
import { type System } from "../capabilities/system";
import { type ProjectListCapability } from "../capabilities/project";
import { type Project, type ProjectId } from "../types/domain";

interface ProjectSelectorProps {
  system: System;
  caps: ProjectListCapability;
  selectedProject: ProjectId | null;
  onProjectChange: (pid: ProjectId) => void;
  /** Increment to force a re-fetch of the project list. */
  refreshKey?: number;
}

export function ProjectSelector({
  system,
  caps,
  selectedProject,
  onProjectChange,
  refreshKey,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void (async () => {
      const result = await caps.listProjects();
      if (result.type === "right") {
        setProjects(result.value);
        // Auto-select first project if nothing is selected
        if (!selectedProject && result.value.length > 0) {
          onProjectChange(result.value[0]!.projectId);
        }
      } else {
        system.error("Could not retrieve project list.");
      }
    })();
  }, [caps, system, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <label htmlFor="projectSelect" className="sr-only">
        Project
      </label>
      <select
        id="projectSelect"
        value={selectedProject ?? ""}
        onChange={(e) => {
          if (e.target.value) {
            onProjectChange(e.target.value);
          }
        }}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>
          Select a project
        </option>
        {projects.map((p) => (
          <option key={p.projectId} value={p.projectId}>
            {p.projectName}
          </option>
        ))}
      </select>
    </div>
  );
}
