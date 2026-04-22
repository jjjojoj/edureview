import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

const t = initTRPC.create({
  transformer: superjson,
  sse: {
    enabled: true,
    client: {
      reconnectAfterInactivityMs: 5000,
    },
    ping: {
      enabled: true,
      intervalMs: 2500,
    },
  },
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

/**
 * Authenticated procedure - verifies JWT token from input authToken field.
 * Replaces manual jwt.verify() boilerplate in every procedure.
 * 
 * Usage: Replace `baseProcedure.input(z.object({ authToken: z.string(), ... }))`
 *   with `authedProcedure.input(z.object({ ... }))`
 */
export const authedProcedure = baseProcedure
  .input(z.object({
    authToken: z.string().min(1),
  }))
  .use(async ({ input, next }) => {
    let payload: { teacherId?: number; parentId?: number };
    try {
      payload = jwt.verify(input.authToken, env.JWT_SECRET) as typeof payload;
    } catch {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "登录已过期，请重新登录",
      });
    }

    if (!payload.teacherId && !payload.parentId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "无效的认证信息",
      });
    }

    return next({
      ctx: {
        auth: payload,
      },
    });
  });
