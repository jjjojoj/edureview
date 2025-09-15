import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { registerTeacher } from "./procedures/registerTeacher";
import { loginTeacher } from "./procedures/loginTeacher";
import { createClass } from "./procedures/createClass";
import { getTeacherClasses } from "./procedures/getTeacherClasses";
import { refreshInvitationCode } from "./procedures/refreshInvitationCode";
import { concludeClass } from "./procedures/concludeClass";
import { promoteClass } from "./procedures/promoteClass";
import { addStudentToClass } from "./procedures/addStudentToClass";
import { getClassStudents } from "./procedures/getClassStudents";
import { getStudentProfileData } from "./procedures/getStudentProfileData";
import { analyzeClassProgress } from "./procedures/analyzeClassProgress";
import { healthCheck } from "./procedures/healthCheck";
import { getStudentPerformanceTrends } from "./procedures/getStudentPerformanceTrends";
import { getClassPerformanceTrends } from "./procedures/getClassPerformanceTrends";
import { generateClassReportPdf } from "./procedures/generateClassReportPdf";
import { generateClassReportExcel } from "./procedures/generateClassReportExcel";
import { getKnowledgeAreas } from "./procedures/getKnowledgeAreas";

// Enhanced upload procedures
import { batchParentUploadProcedure, batchTeacherUploadProcedure } from "./procedures/uploadBatch";
import { getUserUploadStatsProcedure, getSystemStatsProcedure } from "./procedures/getUploadStats";

// Upload procedures
import { generatePresignedUploadUrl } from "./procedures/generatePresignedUploadUrl";
import { uploadParentAssignment } from "./procedures/uploadParentAssignment";
import { uploadTeacherAssignment } from "./procedures/uploadTeacherAssignment";
import { uploadTeacherExam } from "./procedures/uploadTeacherExam";
import { analyzeAssignmentProcedure } from "./procedures/analyzeAssignment";
import { recognizeStudentInfoProcedure, getAvailableModelsProcedure } from "./procedures/recognizeStudentInfo";

// Teaching material management procedures
import { uploadTeachingMaterial } from "./procedures/uploadTeachingMaterial";
import { getTeachingMaterials } from "./procedures/getTeachingMaterials";
import { deleteTeachingMaterial } from "./procedures/deleteTeachingMaterial";
import { generateTargetedQuestionsProcedure } from "./procedures/generateTargetedQuestions";

export const appRouter = createTRPCRouter({
  // Health check
  healthCheck,
  
  // Authentication procedures
  registerTeacher,
  loginTeacher,
  
  // Class management procedures
  createClass,
  getTeacherClasses,
  refreshInvitationCode,
  
  // Class lifecycle procedures
  concludeClass,
  promoteClass,
  
  // Student management procedures
  addStudentToClass,
  getClassStudents,
  getStudentProfileData,

  // Class analysis procedures
  analyzeClassProgress,

  // Performance trend procedures
  getStudentPerformanceTrends,
  getClassPerformanceTrends,

  // Report generation procedures
  generateClassReportPdf,
  generateClassReportExcel,

  // Knowledge area procedures
  getKnowledgeAreas,

  // File upload procedures
  generatePresignedUploadUrl,
  uploadParentAssignment,
  uploadTeacherAssignment,
  uploadTeacherExam,
  
  // Enhanced batch upload procedures
  batchParentUpload: batchParentUploadProcedure,
  batchTeacherUpload: batchTeacherUploadProcedure,
  
  // Teaching material management procedures
  uploadTeachingMaterial,
  getTeachingMaterials,
  deleteTeachingMaterial,
  
  // AI analysis and recognition procedures
  analyzeAssignment: analyzeAssignmentProcedure,
  recognizeStudentInfo: recognizeStudentInfoProcedure,
  getAvailableModels: getAvailableModelsProcedure,
  
  // AI-powered question generation
  generateTargetedQuestions: generateTargetedQuestionsProcedure,
  
  // Upload statistics procedures
  getUserUploadStats: getUserUploadStatsProcedure,
  getSystemStats: getSystemStatsProcedure,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
