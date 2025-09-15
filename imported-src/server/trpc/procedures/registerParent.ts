import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const registerParent = baseProcedure
  .input(z.object({ 
    phoneNumber: z.string().min(10, "Please enter a valid phone number"),
    name: z.string().min(1),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^[A-Za-z0-9]+$/, "Password must not contain special characters")
      .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain at least one number"),
    childInfo: z.object({
      name: z.string().min(1),
      schoolName: z.string().min(1),
      grade: z.string().min(1),
      className: z.string().min(1),
    }),
    invitationCode: z.string().length(6, "Invitation code must be 6 digits"),
  }).refine((data) => !data.password.toLowerCase().includes(data.name.toLowerCase()), {
    message: "Password must not contain your name",
    path: ["password"],
  }))
  .mutation(async ({ input }) => {
    // Check if parent already exists
    const existingParent = await db.parent.findUnique({
      where: {
        phoneNumber: input.phoneNumber,
      },
    });
    
    if (existingParent) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A parent with this phone number already exists",
      });
    }

    // Find the class with the matching invitation code
    const targetClass = await db.class.findFirst({
      where: {
        name: input.childInfo.className,
        invitationCode: input.invitationCode,
        invitationCodeExpiresAt: {
          gt: new Date(), // Code must not be expired
        },
      },
    });

    if (!targetClass) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid or expired invitation code",
      });
    }

    // Check if student exists in this class with the provided name
    const existingStudent = await db.student.findUnique({
      where: {
        schoolName_grade_classId_name: {
          schoolName: input.childInfo.schoolName,
          grade: input.childInfo.grade,
          classId: targetClass.id,
          name: input.childInfo.name,
        },
      },
    });

    if (!existingStudent) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Student name does not match any student in this class. Please check with your teacher.",
      });
    }

    if (existingStudent.parentId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This student is already linked to another parent account",
      });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(input.password, 12);

    // Create the parent and link to existing student in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the parent
      const parent = await tx.parent.create({
        data: {
          phoneNumber: input.phoneNumber,
          name: input.name,
          password: hashedPassword,
        },
        select: {
          id: true,
          phoneNumber: true,
          name: true,
          createdAt: true,
        },
      });

      // Link existing student to parent
      const student = await tx.student.update({
        where: { id: existingStudent.id },
        data: { parentId: parent.id },
        include: {
          class: {
            select: {
              name: true,
            },
          },
        },
      });

      return { parent, student };
    });

    return {
      success: true,
      parent: result.parent,
      child: result.student,
    };
  });
