-- CreateEnum
CREATE TYPE "public"."ClassStatus" AS ENUM ('active', 'archived');

-- CreateTable
CREATE TABLE "public"."teachers" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parents" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "studentId" TEXT,
    "email" TEXT,
    "schoolName" TEXT,
    "grade" TEXT,
    "className" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" INTEGER,
    "classId" INTEGER,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."classes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "initialStudentCount" INTEGER,
    "invitationCode" TEXT NOT NULL,
    "invitationCodeExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastInvitationCodeGeneratedAt" TIMESTAMP(3),
    "status" "public"."ClassStatus" NOT NULL DEFAULT 'active',
    "finalStudentReportUrl" TEXT,
    "finalClassReportUrl" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedToClassId" INTEGER,
    "teacherId" INTEGER NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assignments" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER,
    "classId" INTEGER,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assignment_analyses" (
    "id" SERIAL NOT NULL,
    "grade" TEXT,
    "feedback" TEXT NOT NULL,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "modelUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignmentId" INTEGER NOT NULL,

    CONSTRAINT "assignment_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exams" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER,
    "classId" INTEGER,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_analyses" (
    "id" SERIAL NOT NULL,
    "grade" TEXT,
    "feedback" TEXT NOT NULL,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "modelUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" INTEGER NOT NULL,

    CONSTRAINT "exam_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mistakes" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "originalQuestionText" TEXT,
    "originalQuestionImageUrl" TEXT,
    "studentAnswer" TEXT,
    "correctAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisId" INTEGER,
    "studentId" INTEGER,
    "knowledgeAreaId" INTEGER,

    CONSTRAINT "mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_mistakes" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "originalQuestionText" TEXT,
    "originalQuestionImageUrl" TEXT,
    "studentAnswer" TEXT,
    "correctAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisId" INTEGER,
    "studentId" INTEGER,
    "knowledgeAreaId" INTEGER,

    CONSTRAINT "exam_mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teaching_materials" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "textContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "knowledgeAreaId" INTEGER,

    CONSTRAINT "teaching_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_areas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teacher_knowledge_areas" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "knowledgeAreaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_knowledge_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_knowledge_areas" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "knowledgeAreaId" INTEGER NOT NULL,
    "proficiencyLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_knowledge_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_phoneNumber_key" ON "public"."teachers"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "parents_phoneNumber_key" ON "public"."parents"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "classes_invitationCode_key" ON "public"."classes"("invitationCode");

-- CreateIndex
CREATE UNIQUE INDEX "classes_promotedToClassId_key" ON "public"."classes"("promotedToClassId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_analyses_assignmentId_key" ON "public"."assignment_analyses"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_analyses_examId_key" ON "public"."exam_analyses"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_areas_name_key" ON "public"."knowledge_areas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_knowledge_areas_teacherId_knowledgeAreaId_key" ON "public"."teacher_knowledge_areas"("teacherId", "knowledgeAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "student_knowledge_areas_studentId_knowledgeAreaId_key" ON "public"."student_knowledge_areas"("studentId", "knowledgeAreaId");

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_promotedToClassId_fkey" FOREIGN KEY ("promotedToClassId") REFERENCES "public"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignment_analyses" ADD CONSTRAINT "assignment_analyses_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_analyses" ADD CONSTRAINT "exam_analyses_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mistakes" ADD CONSTRAINT "mistakes_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "public"."assignment_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mistakes" ADD CONSTRAINT "mistakes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mistakes" ADD CONSTRAINT "mistakes_knowledgeAreaId_fkey" FOREIGN KEY ("knowledgeAreaId") REFERENCES "public"."knowledge_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_mistakes" ADD CONSTRAINT "exam_mistakes_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "public"."exam_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_mistakes" ADD CONSTRAINT "exam_mistakes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_mistakes" ADD CONSTRAINT "exam_mistakes_knowledgeAreaId_fkey" FOREIGN KEY ("knowledgeAreaId") REFERENCES "public"."knowledge_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teaching_materials" ADD CONSTRAINT "teaching_materials_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teaching_materials" ADD CONSTRAINT "teaching_materials_knowledgeAreaId_fkey" FOREIGN KEY ("knowledgeAreaId") REFERENCES "public"."knowledge_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_knowledge_areas" ADD CONSTRAINT "teacher_knowledge_areas_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_knowledge_areas" ADD CONSTRAINT "teacher_knowledge_areas_knowledgeAreaId_fkey" FOREIGN KEY ("knowledgeAreaId") REFERENCES "public"."knowledge_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_knowledge_areas" ADD CONSTRAINT "student_knowledge_areas_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_knowledge_areas" ADD CONSTRAINT "student_knowledge_areas_knowledgeAreaId_fkey" FOREIGN KEY ("knowledgeAreaId") REFERENCES "public"."knowledge_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
