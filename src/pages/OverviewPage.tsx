import { useState, useEffect, useRef } from "react";
import { type System } from "../capabilities/system";
import { type OverviewCapability } from "../capabilities/overview";
import { type ProjectListCapability } from "../capabilities/project";
import { type RepoLinkInfo } from "../api/github";
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

  const [githubRepos, setGithubRepos] = useState<RepoLinkInfo[]>([]);
  const [newRepoOwner, setNewRepoOwner] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Track which project we've loaded to avoid redundant fetches
  const loadedProjectRef = useRef<ProjectId | null>(null);

  async function loadGithubRepos(pid: ProjectId) {
    const result = await caps.githubCaps.listRepoLinks(pid);
    if (loadedProjectRef.current !== pid) return;
    if (result.type === "right") {
      setGithubRepos(result.value);
    } else {
      setGithubError(`Failed to load GitHub repos: ${result.value.type}`);
    }
  }

  useEffect(() => {
    if (selectedProject && selectedProject !== loadedProjectRef.current) {
      loadedProjectRef.current = selectedProject;
      setProjectDetail(null);
      setGithubRepos([]);
      setWebhookSecret(null);
      setGithubError(null);
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
      void loadGithubRepos(pid);
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

  async function handleLinkRepo() {
    if (!selectedProject || !newRepoOwner.trim() || !newRepoName.trim()) return;
    setGithubError(null);
    setWebhookSecret(null);
    setSecretCopied(false);
    const result = await caps.githubCaps.linkRepo(selectedProject, {
      owner: newRepoOwner.trim(),
      repo: newRepoName.trim(),
    });
    if (result.type === "right") {
      setWebhookSecret(result.value.webhookSecret);
      setNewRepoOwner("");
      setNewRepoName("");
      void loadGithubRepos(selectedProject);
    } else {
      setGithubError(`Failed to link repository: ${result.value.type}`);
    }
  }

  async function handleUnlinkRepo(linkId: string) {
    if (!selectedProject) return;
    setGithubError(null);
    const result = await caps.githubCaps.unlinkRepo(selectedProject, linkId);
    if (result.type === "right") {
      void loadGithubRepos(selectedProject);
    } else {
      setGithubError(`Failed to unlink repository: ${result.value.type}`);
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

            {/* GitHub Repositories section */}
            <section>
              <h3 className="text-lg font-semibold mb-3">
                Linked GitHub Repositories
              </h3>

              {githubError && (
                <div className="mb-3 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                  {githubError}
                </div>
              )}

              {webhookSecret && (
                <div className="mb-3 p-3 bg-yellow-100 text-yellow-900 rounded-md text-sm">
                  <p className="font-semibold">
                    Webhook secret (save this now — it will not be shown again):
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <code className="flex-1 px-2 py-1 font-mono text-sm bg-white border rounded break-all">
                      {webhookSecret}
                    </code>
                    <button
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(webhookSecret)
                          .then(() => {
                            setSecretCopied(true);
                            setTimeout(() => setSecretCopied(false), 2000);
                          });
                      }}
                      className={`px-3 py-1 rounded text-sm whitespace-nowrap ${secretCopied ? "bg-green-200 text-green-800" : "bg-yellow-200 hover:bg-yellow-300"}`}
                    >
                      {secretCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-2">
                    To complete the link, go to your repository's Settings
                    &rarr; Webhooks &rarr; Add webhook. Set the Payload URL
                    to{" "}
                    <code>
                      https://&lt;your-domain&gt;/api/webhooks/github
                    </code>
                    , choose{" "}
                    <code>application/json</code> as the content type, and paste
                    the secret above into the Secret field.
                  </p>
                  <p className="mt-1">
                    Under "Which events would you like to trigger this
                    webhook?", select "Let me select individual events" and
                    enable <strong>Pull requests</strong>.
                  </p>
                  <button
                    onClick={() => setWebhookSecret(null)}
                    className="mt-2 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {githubRepos.length === 0 ? (
                <p className="text-sm text-gray-500 mb-3">
                  No repositories linked yet.
                </p>
              ) : (
                <table className="w-full text-sm mb-3">
                  <thead>
                    <tr className="border-b font-bold">
                      <th className="px-4 py-2 text-left">Repository</th>
                      <th className="px-4 py-2 text-left">Linked</th>
                      <th className="px-4 py-2 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {githubRepos.map((link) => (
                      <tr key={link.id} className="border-b">
                        <td className="px-4 py-2">
                          {link.owner}/{link.repo}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(link.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleUnlinkRepo(link.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newRepoOwner}
                  onChange={(e) => setNewRepoOwner(e.target.value)}
                  placeholder="Owner"
                  className="px-3 py-2 border rounded-md text-sm w-40"
                />
                <span className="text-gray-500">/</span>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="Repository"
                  className="px-3 py-2 border rounded-md text-sm w-48"
                />
                <button
                  onClick={() => void handleLinkRepo()}
                  disabled={!newRepoOwner.trim() || !newRepoName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Link Repository
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
