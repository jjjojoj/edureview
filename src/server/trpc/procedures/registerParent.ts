import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";

export const registerParent = baseProcedure
  .input(z.object({
    name: z.string(),
    phoneNumber: z.string(),
    password: z.string(),
    childInfo: z.object({
      name: z.string(),
      schoolName: z.string(),
      grade: z.string(),
      className: z.string(),
    }),
    invitationCode: z.string(),
  }))
  .mutation(async () => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "家长注册功能暂未开放，敬请期待",
    });
  });
