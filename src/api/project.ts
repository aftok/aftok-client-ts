import { getWithCredentials, postWithXsrf } from "./http";
import { parseResponse, parseResponseMaybe } from "./json";
import { type Either, left } from "../types/either";
import { type APIError, type CommsAddress, type Zip321Request } from "../types/api";
import {
  type ProjectId,
  type Project,
  type ProjectDetail,
  type DepreciationFn,
} from "../types/domain";
import { decodeProjects, decodeProjectDetail, projectCreateResponseSchema, projectInviteResponseSchema } from "./schemas/project";

// --- API functions ---

export async function apiListProjects(): Promise<
  Either<APIError, Project[]>
> {
  try {
    const response = await getWithCredentials("/api/projects");
    return parseResponse(response, decodeProjects);
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiGetProjectDetail(
  pid: ProjectId,
): Promise<Either<APIError, ProjectDetail | null>> {
  try {
    const response = await getWithCredentials(
      `/api/projects/${pid}/detail`,
    );
    return parseResponseMaybe(response, decodeProjectDetail(pid));
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

function encodeInviteBy(addr: CommsAddress): object {
  switch (addr.type) {
    case "email":
      return { email: addr.email };
    case "zcash":
      return { zaddr: addr.zaddr };
  }
}

export interface Invitation {
  greetName: string;
  message: string | null;
  inviteBy: CommsAddress;
}

export async function apiInvite(
  pid: ProjectId,
  inv: Invitation,
): Promise<Either<APIError, Zip321Request | null>> {
  try {
    const body = JSON.stringify({
      greetName: inv.greetName,
      message: inv.message,
      inviteBy: encodeInviteBy(inv.inviteBy),
    });
    const response = await postWithXsrf(
      `/api/projects/${pid}/invite`,
      body,
    );
    return parseResponse(response, (json) => {
      const parsed = projectInviteResponseSchema.parse(json);
      return parsed.zip321_request ?? null;
    });
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export interface ProjectCreateRequest {
  projectName: string;
  depf: DepreciationFn;
}

export async function apiCreateProject(
  req: ProjectCreateRequest,
): Promise<Either<APIError, ProjectId>> {
  try {
    const body = JSON.stringify({
      projectName: req.projectName,
      depf: {
        type: req.depf.type,
        arguments: { undep: req.depf.undep, dep: req.depf.dep },
      },
    });
    const response = await postWithXsrf("/api/projects/", body);
    return parseResponse(response, (json) => {
      return projectCreateResponseSchema.parse(json).projectId;
    });
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
