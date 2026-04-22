import { z } from "zod";

export const promoteClassSchema = z.object({
  newClassName: z.string().min(1, "新班级名称不能为空").max(100, "班级名称过长"),
  newGrade: z.string().min(1, "年级不能为空").max(20, "年级名称过长"),
});

export type PromoteClassFormData = z.infer<typeof promoteClassSchema>;
