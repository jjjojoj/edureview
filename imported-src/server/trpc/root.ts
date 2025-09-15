import {
  createCallerFactory,
  createTRPCRouter,
  baseProcedure,
} from "~/server/trpc/main";
import { registerTeacher } from "./procedures/registerTeacher";
import { loginTeacher } from "./procedures/loginTeacher";
import { verifyTeacher } from "./procedures/verifyTeacher";
import { registerParent } from "./procedures/registerParent";
import { loginParent } from "./procedures/loginParent";
import { verifyParent } from "./procedures/verifyParent";
import { createClass } from "./procedures/createClass";
import { getTeacherClasses } from "./procedures/getTeacherClasses";
import { refreshInvitationCode } from "./procedures/refreshInvitationCode";
import { generatePresignedUploadUrl } from "./procedures/generatePresignedUploadUrl";
import { uploadFileToOSS } from "./procedures/uploadFileToOSS";
import { addStudentToClass } from "./procedures/addStudentToClass";
import { getClassStudents } from "./procedures/getClassStudents";
import { uploadParentAssignment } from "./procedures/uploadParentAssignment";
import { uploadTeacherAssignment } from "./procedures/uploadTeacherAssignment";
import { analyzeAssignmentProcedure } from "./procedures/analyzeAssignment";
import { recognizeStudentInfoProcedure, getAvailableModelsProcedure } from "./procedures/recognizeStudentInfo";
import { getParentChildData } from "./procedures/getParentChildData";
import { getTeacherSubjects } from "./procedures/getTeacherSubjects";
import { assignTeacherToSubject } from "./procedures/assignTeacherToSubject";

export const appRouter = createTRPCRouter({
  // Authentication procedures
  registerTeacher,
  loginTeacher,
  verifyTeacher,
  registerParent,
  loginParent,
  verifyParent,
  
  // Class management procedures
  createClass,
  getTeacherClasses,
  refreshInvitationCode,
  
  // Student management procedures
  addStudentToClass,
  getClassStudents,
  
  // Teacher subject management
  getTeacherSubjects,
  assignTeacherToSubject,
  
  // File upload procedures
  generatePresignedUploadUrl,
  uploadFileToOSS,
  
  // Assignment procedures
  uploadParentAssignment,
  uploadTeacherAssignment,
  analyzeAssignment: analyzeAssignmentProcedure,
  recognizeStudentInfo: recognizeStudentInfoProcedure,
  getAvailableModels: getAvailableModelsProcedure,
  getParentChildData,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
