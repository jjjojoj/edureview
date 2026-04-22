import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";

const phoneRegex = /^1[3-9]\d{9}$/;

export const loginParent = baseProcedure
  .input(z.object({
    phoneNumber: z.string().regex(phoneRegex, "请输入有效的手机号码"),
    password: z.string(),
  }))
  .mutation(async () => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "家长登录功能暂未开放，敬请期待",
    });
  });
