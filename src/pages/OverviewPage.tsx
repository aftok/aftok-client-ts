import { useState, useEffect, useRef } from "react";
import { type System } from "../capabilities/system";
import { type OverviewCapability } from "../capabilities/overview";
import { type ProjectListCapability } from "../capabilities/project";
import {
  type ProjectId,
  type ProjectDetail,
  type Contributor,
  type DepreciationFn,
} from "../types/domain";
import { ProjectSelector } from "../components/ProjectSelector";
import {
  CreateProjectModal,
  type CreateProjectResult,
} from "../modals/CreateProjectModal";
import { InviteCollaboratorModal } from "../modals/InviteCollaboratorModal";

interface OverviewPageProps {
  system: System;
  caps: OverviewCapability;
  projectCaps: ProjectListCapability;
  selectedProject: ProjectId | null;
  onProjectChange: (pid: ProjectId) => void;
}

export function OverviewPage({
  system,
  caps,
  projectCaps,
  selectedProject,
  onProjectChange,
}: OverviewPageProps) {
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [projectListKey, setProjectListKey] = useState(0);

  // Track which project we've loaded to avoid redundant fetches
  const loadedProjectRef = useRef<ProjectId | null>(null);

  useEffect(() => {
    if (selectedProject && selectedProject !== loadedProjectRef.current) {
      loadedProjectRef.current = selectedProject;
      setProjectDetail(null);
      const pid = selectedProject;
      void (async () => {
        const result = await caps.getProjectDetail(pid);
        // Guard against stale responses if selection changed during fetch
        if (loadedProjectRef.current !== pid) return;
        if (result.type === "right") {
          setProjectDetail(result.value);
        } else {
          system.error(`Failed to load project detail: ${result.value.type}`);
        }
      })();
    }
  }, [selectedProject, caps, system]);

  function handleProjectChange(pid: ProjectId) {
    onProjectChange(pid);
  }

  function handleCreateResult(result: CreateProjectResult) {
    setShowCreateModal(false);
    if (result.type === "created") {
      onProjectChange(result.pid);
      setProjectListKey((k) => k + 1);
    }
  }

  function formatDate(d: Date): string {
    return d.toLocaleDateString();
  }

  function depreciationCols(depf: DepreciationFn) {
    return (
      <>
        <td className="px-4 py-2">{depf.undep} days</td>
        <td className="px-4 py-2">{depf.dep} days</td>
      </>
    );
  }

  function contributorRow(contributor: Contributor) {
    const { numerator, denominator } = contributor.revShare;
    const pct =
      denominator !== 0
        ? ((numerator / denominator) * 100).toFixed(2)
        : "N/A";

    return (
      <tr key={contributor.userId} className="border-b">
        <td className="px-4 py-2">{contributor.handle}</td>
        <td className="px-4 py-2">{formatDate(contributor.joinedOn)}</td>
        <td className="px-4 py-2">{contributor.loggedHours.toFixed(1)} hours</td>
        <td className="px-4 py-2">
          {contributor.depreciatedHours.toFixed(1)} hours
        </td>
        <td className="px-4 py-2">{pct}%</td>
      </tr>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-64">
            <ProjectSelector
              system={system}
              caps={projectCaps}
              selectedProject={selectedProject}
              onProjectChange={handleProjectChange}
              refreshKey={projectListKey}
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Create a new project
          </button>
        </div>

        {projectDetail && (
          <>
            {/* Project Overview section */}
            <section>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b font-bold">
                    <th className="px-4 py-2 text-left">Project Name</th>
                    <th className="px-4 py-2 text-left">
                      Undepreciated Period
                    </th>
                    <th className="px-4 py-2 text-left">
                      Depreciation Duration
                    </th>
                    <th className="px-4 py-2 text-left">Originator</th>
                    <th className="px-4 py-2 text-left">Origination Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2">
                      {projectDetail.project.projectName}
                    </td>
                    {depreciationCols(projectDetail.project.depf)}
                    <td className="px-4 py-2">
                      {projectDetail.contributors.get(
                        projectDetail.project.initiator,
                      )?.handle ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(projectDetail.project.inceptionDate)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Contributors section */}
            <section>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b font-bold">
                    <th className="px-4 py-2 text-left">Contributor</th>
                    <th className="px-4 py-2 text-left">Joined</th>
                    <th className="px-4 py-2 text-left">Contributed</th>
                    <th className="px-4 py-2 text-left">
                      After Depreciation
                    </th>
                    <th className="px-4 py-2 text-left">Revenue Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(projectDetail.contributors.values())
                    .sort(
                      (a, b) =>
                        b.revShare.numerator / b.revShare.denominator -
                        a.revShare.numerator / a.revShare.denominator,
                    )
                    .map(contributorRow)}
                </tbody>
              </table>
              <div className="mt-4">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Invite a collaborator
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      <CreateProjectModal
        system={system}
        caps={caps.createCaps}
        open={showCreateModal}
        onResult={handleCreateResult}
      />
      <InviteCollaboratorModal
        system={system}
        caps={caps.inviteCaps}
        projectId={selectedProject}
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
