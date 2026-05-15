import { z } from "zod";

export const billStatusValues = ["unpaid", "paid", "skipped"] as const;
export const incomeKindValues = ["paycheck", "misc"] as const;
export const payFrequencyValues = ["weekly", "biweekly", "monthly"] as const;

export const createBillSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).nullish(),
  amount: z.number().min(0),
  categoryId: z.string().uuid().nullish(),
  dueDate: z.coerce.date(),
  status: z.enum(billStatusValues).default("unpaid"),
  paidAmount: z.number().min(0).nullish(),
  notes: z.string().trim().min(1).nullish(),
  color: z.string().trim().min(1).nullish(),
  recurrenceRuleId: z.string().uuid().nullish(),
});
export const updateBillSchema = createBillSchema.partial();
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export const bulkMarkPaidSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const createBillCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).nullish(),
  sortOrder: z.number().int().min(0).default(0),
});
export const updateBillCategorySchema = createBillCategorySchema.partial();
export type CreateBillCategoryInput = z.infer<
  typeof createBillCategorySchema
>;
export type UpdateBillCategoryInput = z.infer<
  typeof updateBillCategorySchema
>;

export const createIncomeSchema = z.object({
  kind: z.enum(incomeKindValues).default("paycheck"),
  receivedDate: z.coerce.date(),
  amount: z.number().min(0),
  source: z.string().trim().min(1).nullish(),
  notes: z.string().trim().min(1).nullish(),
});
export const updateIncomeSchema = createIncomeSchema.partial();
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;

export const putPayScheduleSchema = z.object({
  frequency: z.enum(payFrequencyValues),
  referenceDate: z.coerce.date(),
});
export type PutPayScheduleInput = z.infer<typeof putPayScheduleSchema>;
