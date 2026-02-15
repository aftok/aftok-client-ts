import { type Either } from "../types/either";
import { type APIError, type Zip321Request } from "../types/api";
import { type ZAddrCheckResponse } from "../api/account";
import { type ProjectId, type ProjectDetail, type DepreciationFn } from "../types/domain";
import {
  apiGetProjectDetail,
  apiInvite,
  apiCreateProject,
  type Invitation,
} from "../api/project";
import { apiCheckZAddr } from "../api/account";
import {
  apiListRepoLinks,
  apiLinkRepo,
  apiUnlinkRepo,
  type RepoLinkInfo,
  type LinkRepoRequest,
  type LinkRepoResponse,
} from "../api/github";

export interface InviteCapability {
  invite: (
    pid: ProjectId,
    inv: Invitation,
  ) => Promise<Either<APIError, Zip321Request | null>>;
  checkZAddr: (zaddr: string) => Promise<ZAddrCheckResponse>;
}

export interface CreateProjectCapability {
  createProject: (
    name: string,
    depf: DepreciationFn,
  ) => Promise<Either<APIError, ProjectId>>;
}

export interface GitHubRepoCapability {
  listRepoLinks: (pid: ProjectId) => Promise<Either<APIError, RepoLinkInfo[]>>;
  linkRepo: (
    pid: ProjectId,
    req: LinkRepoRequest,
  ) => Promise<Either<APIError, LinkRepoResponse>>;
  unlinkRepo: (
    pid: ProjectId,
    linkId: string,
  ) => Promise<Either<APIError, void>>;
}

export interface OverviewCapability {
  getProjectDetail: (
    pid: ProjectId,
  ) => Promise<Either<APIError, ProjectDetail | null>>;
  inviteCaps: InviteCapability;
  createCaps: CreateProjectCapability;
  githubCaps: GitHubRepoCapability;
}

export const apiOverviewCapability: OverviewCapability = {
  getProjectDetail: apiGetProjectDetail,
  inviteCaps: {
    invite: (pid: ProjectId, inv: Invitation) => apiInvite(pid, inv),
    checkZAddr: apiCheckZAddr,
  },
  createCaps: {
    createProject: (name: string, depf: DepreciationFn) =>
      apiCreateProject({ projectName: name, depf }),
  },
  githubCaps: {
    listRepoLinks: apiListRepoLinks,
    linkRepo: apiLinkRepo,
    unlinkRepo: apiUnlinkRepo,
  },
};

export const mockOverviewCapability: OverviewCapability = {
  getProjectDetail: async () => ({ type: "right", value: null }),
  inviteCaps: {
    invite: async () => ({ type: "right", value: null }),
    checkZAddr: async () => ({ type: "valid" }),
  },
  createCaps: {
    createProject: async () => ({
      type: "right",
      value: "mock-project-id",
    }),
  },
  githubCaps: {
    listRepoLinks: async () => ({ type: "right", value: [] }),
    linkRepo: async () => ({
      type: "right",
      value: { linkId: "mock-link-id", webhookSecret: "mock-secret" },
    }),
    unlinkRepo: async () => ({ type: "right", value: undefined }),
  },
};
