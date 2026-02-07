import { z } from "zod";
import { uuidSchema } from "./common";
import type {
  Project,
  ProjectDetail,
  Contributor,
  DepreciationFn,
} from "../../types/domain";

const depreciationFnSchema = z.object({
  type: z.literal("LinearDepreciation"),
  arguments: z.object({
    undep: z.number(),
    dep: z.number(),
  }),
});

function decodeDepreciationFn(json: z.infer<typeof depreciationFnSchema>): DepreciationFn {
  return {
    type: "LinearDepreciation",
    undep: json.arguments.undep,
    dep: json.arguments.dep,
  };
}

const projectInnerSchema = z.object({
  projectName: z.string(),
  inceptionDate: z.string(),
  initiator: uuidSchema,
  depf: depreciationFnSchema,
});

// GET /projects list item
const projectSummarySchema = z.object({
  projectId: uuidSchema,
  project: projectInnerSchema,
});

export const projectListSchema = z.array(projectSummarySchema);

export function decodeProjects(json: unknown): Project[] {
  const parsed = projectListSchema.parse(json);
  return parsed.map((item) => ({
    projectId: item.projectId,
    projectName: item.project.projectName,
    inceptionDate: new Date(item.project.inceptionDate),
    initiator: item.project.initiator,
    depf: decodeDepreciationFn(item.project.depf),
  }));
}

// GET /projects/:pid/detail
const contributorSchema = z.object({
  userId: uuidSchema,
  username: z.string(),
  joinedOn: z.string(),
  loggedHours: z.number(),
  depreciatedHours: z.number(),
  revenueShare: z.object({
    numerator: z.number(),
    denominator: z.number(),
  }),
});

const projectDetailSchema = z.object({
  project: projectInnerSchema,
  contributors: z.array(contributorSchema),
});

export function decodeProjectDetail(pid: string) {
  return (json: unknown): ProjectDetail => {
    const parsed = projectDetailSchema.parse(json);
    const contributors = new Map<string, Contributor>();
    for (const c of parsed.contributors) {
      contributors.set(c.userId, {
        userId: c.userId,
        handle: c.username,
        joinedOn: new Date(c.joinedOn),
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
        projectName: parsed.project.projectName,
        inceptionDate: new Date(parsed.project.inceptionDate),
        initiator: parsed.project.initiator,
        depf: decodeDepreciationFn(parsed.project.depf),
      },
      contributors,
    };
  };
}

// POST /projects response
export const projectCreateResponseSchema = z.object({
  projectId: uuidSchema,
});

// POST /projects/:pid/invite response
export const projectInviteResponseSchema = z.object({
  zip321_request: z.string().optional(),
});
