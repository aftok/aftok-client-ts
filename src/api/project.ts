import { getWithCredentials, postWithXsrf } from "./http";
import { parseResponse, parseResponseMaybe } from "./json";
import { type Either, left } from "../types/either";
import { type APIError, type CommsAddress, type Zip321Request } from "../types/api";
import {
  type ProjectId,
  type UserId,
  type Project,
  type ProjectDetail,
  type Contributor,
  type DepreciationFn,
} from "../types/domain";

// --- JSON decoders ---

function parseDate(s: string): Date {
  return new Date(s);
}

interface ProjectJSON {
  projectId: string;
  project: {
    projectName: string;
    inceptionDate: string;
    initiator: string;
    depf: {
      type: string;
      arguments: { undep: number; dep: number };
    };
  };
}

function decodeProject(json: unknown): Project {
  const j = json as ProjectJSON;
  return {
    projectId: j.projectId,
    projectName: j.project.projectName,
    inceptionDate: parseDate(j.project.inceptionDate),
    initiator: j.project.initiator,
    depf: decodeDepreciationFn(j.project.depf),
  };
}

function decodeDepreciationFn(json: {
  type: string;
  arguments: { undep: number; dep: number };
}): DepreciationFn {
  return {
    type: "LinearDepreciation",
    undep: json.arguments.undep,
    dep: json.arguments.dep,
  };
}

function decodeProjects(json: unknown): Project[] {
  return (json as ProjectJSON[]).map(decodeProject);
}

interface ContributorJSON {
  userId: string;
  username: string;
  joinedOn: string;
  loggedHours: number;
  depreciatedHours: number;
  revenueShare: { numerator: number; denominator: number };
}

interface ProjectDetailJSON {
  project: {
    projectName: string;
    inceptionDate: string;
    initiator: string;
    depf: {
      type: string;
      arguments: { undep: number; dep: number };
    };
  };
  contributors: ContributorJSON[];
}

function decodeProjectDetail(pid: ProjectId) {
  return (json: unknown): ProjectDetail => {
    const j = json as ProjectDetailJSON;
    const contributors = new Map<UserId, Contributor>();
    for (const c of j.contributors) {
      contributors.set(c.userId, {
        userId: c.userId,
        handle: c.username,
        joinedOn: parseDate(c.joinedOn),
        loggedHours: c.loggedHours,
        depreciatedHours: c.depreciatedHours,
        revShare: {
          numerator: c.revenueShare.numerator,
          denominator: c.revenueShare.denominator,
        },
      });
    }
    return {
      project: {
        projectId: pid,
        projectName: j.project.projectName,
        inceptionDate: parseDate(j.project.inceptionDate),
        initiator: j.project.initiator,
        depf: decodeDepreciationFn(j.project.depf),
      },
      contributors,
    };
  };
}

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
      const j = json as { zip321_request?: string };
      return j.zip321_request ?? null;
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
    return parseResponse(
      response,
      (json) => (json as { projectId: string }).projectId,
    );
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
