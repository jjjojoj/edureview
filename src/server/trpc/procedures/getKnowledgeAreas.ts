import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getKnowledgeAreas = baseProcedure
  .input(z.object({
    authToken: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Fetch all knowledge areas
      const knowledgeAreas = await db.knowledgeArea.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        knowledgeAreas: knowledgeAreas.map(area => ({
          id: area.id,
          name: area.name,
          description: area.description,
          createdAt: area.createdAt,
        })),
      };
    } catch (error) {
      console.error("Get knowledge areas error:", error);
      
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch knowledge areas",
      });
    }
  });
