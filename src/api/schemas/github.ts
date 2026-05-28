import { z } from "zod";
import { uuidSchema, isoDateSchema } from "./common";

export const repoLinkInfoSchema = z.object({
  id: uuidSchema,
  owner: z.string(),
  repo: z.string(),
  createdAt: isoDateSchema,
});

export const repoLinkInfoArraySchema = z.array(repoLinkInfoSchema);

export const linkRepoResponseSchema = z.object({
  linkId: uuidSchema,
  webhookSecret: z.string(),
});

export const gitHubOAuthInitResponseSchema = z.object({
  authUrl: z.string(),
});

export const gitHubUsernameResponseSchema = z.object({
  username: z.string().nullable().optional(),
});
