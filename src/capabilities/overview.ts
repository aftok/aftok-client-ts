import { type Either } from "../types/either";
import { type APIError, type Zip321Request } from "../types/api";
import { type ProjectId, type ProjectDetail, type DepreciationFn } from "../types/domain";
import {
  apiGetProjectDetail,
  apiInvite,
  apiCreateProject,
  type Invitation,
} from "../api/project";

export interface InviteCapability {
  invite: (
    pid: ProjectId,
    inv: Invitation,
  ) => Promise<Either<APIError, Zip321Request | null>>;
}

export interface CreateProjectCapability {
  createProject: (
    name: string,
    depf: DepreciationFn,
  ) => Promise<Either<APIError, ProjectId>>;
}

export interface OverviewCapability {
  getProjectDetail: (
    pid: ProjectId,
  ) => Promise<Either<APIError, ProjectDetail | null>>;
  inviteCaps: InviteCapability;
  createCaps: CreateProjectCapability;
}

export const apiOverviewCapability: OverviewCapability = {
  getProjectDetail: apiGetProjectDetail,
  inviteCaps: {
    invite: (pid: ProjectId, inv: Invitation) => apiInvite(pid, inv),
  },
  createCaps: {
    createProject: (name: string, depf: DepreciationFn) =>
      apiCreateProject({ projectName: name, depf }),
  },
};

export const mockOverviewCapability: OverviewCapability = {
  getProjectDetail: async () => ({ type: "right", value: null }),
  inviteCaps: {
    invite: async () => ({ type: "right", value: null }),
  },
  createCaps: {
    createProject: async () => ({
      type: "right",
      value: "mock-project-id",
    }),
  },
};
