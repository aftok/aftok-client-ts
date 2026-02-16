import { getWithCredentials, postWithXsrf, deleteWithXsrf } from "./http";
import { parseResponse } from "./json";
import { type Either, left, right } from "../types/either";
import { type APIError } from "../types/api";
import { type ProjectId } from "../types/domain";
import {
  repoLinkInfoArraySchema,
  linkRepoResponseSchema,
  gitHubOAuthInitResponseSchema,
  gitHubUsernameResponseSchema,
} from "./schemas/github";

export interface RepoLinkInfo {
  id: string;
  owner: string;
  repo: string;
  createdAt: Date;
}

export interface LinkRepoRequest {
  owner: string;
  repo: string;
}

export interface LinkRepoResponse {
  linkId: string;
  webhookSecret: string;
}

export async function apiListRepoLinks(
  pid: ProjectId,
): Promise<Either<APIError, RepoLinkInfo[]>> {
  try {
    const response = await getWithCredentials(
      `/api/projects/${pid}/github/repos`,
    );
    return parseResponse(response, (json) =>
      repoLinkInfoArraySchema.parse(json),
    );
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiLinkRepo(
  pid: ProjectId,
  req: LinkRepoRequest,
): Promise<Either<APIError, LinkRepoResponse>> {
  try {
    const body = JSON.stringify({ owner: req.owner, repo: req.repo });
    const response = await postWithXsrf(
      `/api/projects/${pid}/github/repos`,
      body,
    );
    return parseResponse(response, (json) =>
      linkRepoResponseSchema.parse(json),
    );
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiUnlinkRepo(
  pid: ProjectId,
  linkId: string,
): Promise<Either<APIError, void>> {
  try {
    const response = await deleteWithXsrf(
      `/api/projects/${pid}/github/repos/${linkId}`,
    );
    if (response.status === 403 || response.status === 401) {
      return left({ type: "forbidden" });
    }
    if (response.status === 200 || response.status === 204) {
      return right(undefined);
    }
    return left({
      type: "error",
      status: response.status,
      message: response.statusText,
    });
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export interface GitHubOAuthInitResponse {
  authUrl: string;
}

export async function apiInitGitHubOAuth(): Promise<
  Either<APIError, GitHubOAuthInitResponse>
> {
  try {
    const response = await postWithXsrf(`/api/user/github/link`);
    return parseResponse(response, (json) =>
      gitHubOAuthInitResponseSchema.parse(json),
    );
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiGetGitHubUsername(
  signal?: AbortSignal,
): Promise<Either<APIError, string | null>> {
  try {
    const response = await getWithCredentials(`/api/user/github`, signal);
    return parseResponse(response, (json) => {
      const parsed = gitHubUsernameResponseSchema.parse(json);
      return parsed.username ?? null;
    });
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function apiUnlinkGitHub(): Promise<Either<APIError, void>> {
  try {
    const response = await deleteWithXsrf(`/api/user/github`);
    if (response.status === 403 || response.status === 401) {
      return left({ type: "forbidden" });
    }
    if (response.status === 200 || response.status === 204) {
      return right(undefined);
    }
    return left({
      type: "error",
      status: response.status,
      message: response.statusText,
    });
  } catch (e) {
    return left({
      type: "error",
      status: 0,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
