import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const verifyParent = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify and parse the JWT token
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ parentId: z.number() }).parse(verified);

      // Get the parent from database with their children
      const parent = await db.parent.findUnique({
        where: {
          id: parsed.parentId,
        },
        include: {
          children: {
            include: {
              class: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          children: true,
        },
      });

      if (!parent) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Parent not found",
        });
      }

      return {
        parent: {
          id: parent.id,
          email: parent.email,
          name: parent.name,
          children: parent.children.map(child => ({
            id: child.id,
            name: child.name,
            schoolName: child.schoolName,
            grade: child.grade,
            className: child.class.name,
          })),
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
