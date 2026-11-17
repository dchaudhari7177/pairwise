import { z } from "zod";
import { INTERESTS, LANGUAGES, PROMPTS, VALUES } from "./options";

export const signupSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(128),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consents: z.object({
    terms: z.boolean(),
    privacy: z.boolean(),
    sensitive: z.boolean(),
    marketing: z.boolean(),
  }),
});

export const loginSchema = z.object({ email: z.string().trim().max(120), password: z.string().max(128) });

const gender = z.enum(["woman", "man", "nonbinary"]);

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(30),
  gender,
  interestedIn: z.array(gender).min(1).max(3),
  ageRange: z.tuple([z.number().int().min(18).max(80), z.number().int().min(18).max(80)]),
  city: z.enum(["bengaluru", "pune", "hyderabad", "chennai", "ncr", "mumbai"]),
  area: z.string().trim().max(40).optional(),
  hometown: z.string().trim().min(1).max(40),
  languages: z.array(z.enum(LANGUAGES)).min(1).max(6),
  heightCm: z.number().int().min(120).max(230).optional(),
  role: z.string().trim().min(1).max(50),
  intent: z.enum(["long_term", "marriage", "figuring_out"]),
  lifePlan: z.object({
    relocate: z.enum(["yes", "maybe", "no"]),
    timeline: z.enum(["within_2y", "2_4y", "not_sure"]),
    kids: z.enum(["want", "open", "dont_want", "not_sure"]),
    family: z.enum(["nuclear", "joint", "open"]),
  }),
  habits: z.object({
    diet: z.enum(["veg", "nonveg", "eggetarian", "vegan", "jain"]),
    drinks: z.enum(["never", "socially", "often"]),
    smokes: z.enum(["never", "socially", "often"]),
  }),
  values: z.array(z.enum(VALUES)).min(3).max(5),
  interests: z.array(z.enum(INTERESTS)).min(3).max(8),
  prompts: z
    .array(z.object({ q: z.enum(PROMPTS), a: z.string().trim().min(1).max(200) }))
    .length(3),
  bio: z.string().trim().max(300).optional(),
  faith: z.string().trim().max(30).optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;
