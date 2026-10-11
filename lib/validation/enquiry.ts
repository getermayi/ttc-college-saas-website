import { z } from "zod";
import { ARUNACHAL_DISTRICTS, CATEGORIES, CONTACT_TIMES, QUALIFICATIONS } from "@/lib/constants";
import { normaliseIndianPhone } from "@/lib/utils";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Shared by the enquiry form (client) and the server action. */
export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100, "That name is too long."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your mobile number.")
    .refine((v) => normaliseIndianPhone(v) !== null, "Enter a valid 10-digit Indian mobile number, e.g. 98765 43210."),
  email: z
    .union([z.literal(""), z.email("Please enter a valid email, or leave it empty.").max(150)])
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined)),
  programmeId: z.string().trim().min(1, "Please choose a programme."),
  district: z.enum(ARUNACHAL_DISTRICTS, { error: "Please choose your district." }),
  qualification: z.enum(QUALIFICATIONS.map((q) => q.value) as [string, ...string[]], {
    error: "Please choose your highest qualification.",
  }),
  percentage: z
    .union([z.literal(""), z.coerce.number({ error: "Enter your marks as a number." })])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v))
    .refine((v) => v === undefined || (v >= 0 && v <= 100), "Marks must be between 0 and 100."),
  category: z.enum(CATEGORIES, { error: "Please choose your category." }),
  preferredTime: z.enum(CONTACT_TIMES, { error: "Please choose a time." }),
  message: optionalText(1000),
  consent: z.literal(true, { error: "Please tick the box so we can contact you." }),
  // Attribution (hidden fields)
  utmSource: optionalText(120),
  utmMedium: optionalText(120),
  utmCampaign: optionalText(120),
  utmTerm: optionalText(120),
  utmContent: optionalText(120),
  referrer: optionalText(300),
  landingPage: optionalText(300),
  formName: optionalText(60),
  // Bot protection
  turnstileToken: optionalText(4000),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type EnquiryData = z.output<typeof enquirySchema>;

export const grievanceSchema = z
  .object({
    anonymous: z.boolean().default(false),
    name: optionalText(100),
    email: z
      .union([z.literal(""), z.email("Please enter a valid email.").max(150)])
      .optional()
      .transform((v) => (v ? v.toLowerCase() : undefined)),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || normaliseIndianPhone(v) !== null, "Enter a valid 10-digit Indian mobile number."),
    role: z.string().trim().min(1, "Please choose who you are.").max(60),
    category: z.string().trim().min(1, "Please choose a category.").max(60),
    subject: z.string().trim().min(5, "Please add a short subject (at least 5 characters).").max(150),
    description: z
      .string()
      .trim()
      .min(20, "Please describe the issue in a little more detail (at least 20 characters).")
      .max(5000),
    consent: z.literal(true, { error: "Please confirm the information is true." }),
    turnstileToken: optionalText(4000),
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.anonymous && !v.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Please enter your name, or choose to stay anonymous." });
    if (!v.anonymous && !v.phone && !v.email)
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Give us a phone number or email so we can update you." });
  });

export type GrievanceInput = z.input<typeof grievanceSchema>;

export type FormState<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function zodFieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
