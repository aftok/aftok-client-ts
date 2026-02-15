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
