import { type Either } from "../types/either";
import { type APIError } from "../types/api";
import { type Project } from "../types/domain";
import { apiListProjects } from "../api/project";

export interface ProjectListCapability {
  listProjects: () => Promise<Either<APIError, Project[]>>;
}

export const apiProjectListCapability: ProjectListCapability = {
  listProjects: apiListProjects,
};

export const mockProjectListCapability: ProjectListCapability = {
  listProjects: async () => ({ type: "right", value: [] }),
};
