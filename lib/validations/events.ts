import { z } from "zod";

export const eventStatusValues = [
  "confirmed",
  "tentative",
  "cancelled",
  "completed",
] as const;

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).nullish(),
  categoryId: z.string().uuid().nullish(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullish(),
  allDay: z.boolean().default(false),
  location: z.string().trim().min(1).nullish(),
  url: z.string().trim().url().nullish(),
  attendees: z.string().trim().min(1).nullish(),
  status: z.enum(eventStatusValues).default("confirmed"),
  color: z.string().trim().min(1).nullish(),
  recurrenceRuleId: z.string().uuid().nullish(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const createEventCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).nullish(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateEventCategorySchema = createEventCategorySchema.partial();

export type CreateEventCategoryInput = z.infer<
  typeof createEventCategorySchema
>;
export type UpdateEventCategoryInput = z.infer<
  typeof updateEventCategorySchema
>;
