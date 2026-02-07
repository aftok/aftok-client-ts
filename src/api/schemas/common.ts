import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const isoDateSchema = z.string().transform((s) => new Date(s));
