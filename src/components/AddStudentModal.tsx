import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import {
  X,
  UserPlus,
  User,
  Brain,
  Loader2,
  Sparkles,
  Check,
  Hash,
  Users,
  CheckCircle,
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useToast, toast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";
import * as ExcelJS from "exceljs";

import { StudentForm } from "~/components/student/StudentForm";
import type { StudentFormData } from "~/components/student/StudentForm";
import {
  StudentImportZone,
  type ImportParams,
} from "~/components/student/StudentImportZone";
import {
  StudentList,
  type EditableStudent,
} from "~/components/student/StudentList";

// Batch related types
interface StudentData {
  studentName: string;
  studentId?: string;
  confidence: number;
  reasoning: string;
}

interface BatchAnalysisResponse {
  students: StudentData[];
  autoAssignedStudentIds: string[];
  confidence: number;
  reasoning: string;
}

type TabMode = "single" | "batch";
type BatchStep = "upload" | "review" | "processing";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onSuccess?: () => void;
}

export function AddStudentModal({
  isOpen,
  onClose,
  classId,
  onSuccess,
}: AddStudentModalProps) {
  const trpc = useTRPC();
  const { authToken } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useToast();

  // Tab and step management
  const [activeTab, setActiveTab] = useState<TabMode>("single");
  const [batchStep, setBatchStep] = useState<BatchStep>("upload");

  // Reset key — incremented on close to force sub-component remounts
  const [resetKey, setResetKey] = useState(0);

  // Batch add states
  const [analysisResult, setAnalysisResult] =
    useState<BatchAnalysisResponse | null>(null);
  const [editableStudents, setEditableStudents] = useState<EditableStudent[]>(
    [],
  );

  // API mutations
  const addStudentMutation = useMutation(
    trpc.addStudentToClass.mutationOptions(),
  );
  const analyzeBatchMutation = useMutation(
    trpc.analyzeBatchStudents.mutationOptions(),
  );
  const batchAddMutation = useMutation(
    trpc.batchAddStudentsToClass.mutationOptions(),
  );

  // -------------------------------------------------------------------
  // Single student submit
  // -------------------------------------------------------------------
  const handleSingleSubmit = async (
    data: StudentFormData,
  ): Promise<boolean> => {
    if (!authToken) return false;
    try {
      await addStudentMutation.mutateAsync({
        authToken,
        classId,
        name: data.name,
        studentId: data.studentId,
      });
      toastSuccess(`${data.name} 已成功添加到班级！`);
      onSuccess?.();
      onClose();
      return true;
    } catch (error) {
      toastError(getErrorMessage(error));
      return false;
    }
  };

  // -------------------------------------------------------------------
  // File parsing helpers
  // -------------------------------------------------------------------
  const parseCsvFile = async (
    file: File,
  ): Promise<{ name: string; studentId?: string; hasId: boolean }[]> => {
    const text = await file.text();
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return [];

    let startRowIndex = 0;
    const firstLine = (lines[0] ?? "").toLowerCase();
    if (
      firstLine.includes("姓名") ||
      firstLine.includes("name") ||
      firstLine.includes("学号") ||
      firstLine.includes("id")
    ) {
      startRowIndex = 1;
    }

    const students: {
      name: string;
      studentId?: string;
      hasId: boolean;
    }[] = [];

    for (let i = startRowIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      let cells = line.split(",");
      if (cells.length === 1) cells = line.split(";");
      if (cells.length === 1) cells = line.split("\t");
      cells = cells.map((cell) =>
        cell.replace(/^["']|["']$/g, "").trim(),
      );

      let name = "";
      let studentId = "";

      for (const cell of cells) {
        if (cell && cell.length >= 2) {
          if (/^\d+$/.test(cell) && cell.length <= 10) {
            studentId = cell;
          } else if (
            /^[\u4e00-\u9fff]{2,4}$/.test(cell) ||
            /^[a-zA-Z\s]{2,20}$/.test(cell)
          ) {
            if (!name) name = cell;
          }
        }
      }

      if (name) {
        students.push({
          name,
          studentId: studentId || undefined,
          hasId: !!studentId,
        });
      }
    }

    return students;
  };

  const parseExcelFile = async (
    file: File,
  ): Promise<{ name: string; studentId?: string; hasId: boolean }[]> => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const worksheet = workbook.worksheets[0];
      if (!worksheet) return [];

      const students: {
        name: string;
        studentId?: string;
        hasId: boolean;
      }[] = [];

      let startRowIndex = 1;
      const firstRow = worksheet.getRow(1);
      const firstRowValues = firstRow.values as any[];
      if (
        firstRowValues &&
        firstRowValues.some((cell: any) =>
          String(cell || "")
            .toLowerCase()
            .includes("姓名") ||
          String(cell || "")
            .toLowerCase()
            .includes("name") ||
          String(cell || "")
            .toLowerCase()
            .includes("学号") ||
          String(cell || "")
            .toLowerCase()
            .includes("id")
        )
      ) {
        startRowIndex = 2;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRowIndex) return;

        const values = row.values as any[];
        if (!values || values.length <= 1) return;

        let name = "";
        let studentId = "";

        for (let i = 1; i < values.length; i++) {
          const cellValue = String(values[i] || "").trim();
          if (!cellValue) continue;

          if (/^\d+$/.test(cellValue) && cellValue.length <= 10) {
            studentId = cellValue;
          } else if (
            /^[\u4e00-\u9fff]{2,4}$/.test(cellValue) ||
            /^[a-zA-Z\s]{2,20}$/.test(cellValue)
          ) {
            if (!name) name = cellValue;
          }
        }

        if (name) {
          students.push({
            name,
            studentId: studentId || undefined,
            hasId: !!studentId,
          });
        }
      });

      return students;
    } catch (error) {
      throw new Error("Excel文件解析失败，请检查文件格式");
    }
  };

  const parseTextInput = (
    text: string,
  ): { name: string; studentId?: string; hasId: boolean }[] => {
    if (!text.trim()) return [];

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const students: {
      name: string;
      studentId?: string;
      hasId: boolean;
    }[] = [];

    for (const line of lines) {
      let name = "";
      let studentId = "";

      const pattern1 = line.match(/^(.+?)\s+(\d+)$/);
      if (pattern1) {
        name = pattern1[1]?.trim() || "";
        studentId = pattern1[2]?.trim() || "";
      } else {
        const pattern2 = line.match(/^(\d+)\s+(.+)$/);
        if (pattern2) {
          studentId = pattern2[1]?.trim() || "";
          name = pattern2[2]?.trim() || "";
        } else {
          const pattern3 = line.match(/^\d+[.、]\s*(.+)$/);
          if (pattern3) {
            name = pattern3[1]?.trim() || "";
          } else {
            const pattern4 = line.match(/^(.+?)[（(](\d+)[）)]$/);
            if (pattern4) {
              name = pattern4[1]?.trim() || "";
              studentId = pattern4[2]?.trim() || "";
            } else if (
              /^[\u4e00-\u9fff]{2,4}$/.test(line) ||
              /^[a-zA-Z\s]{2,20}$/.test(line)
            ) {
              name = line;
            }
          }
        }
      }

      if (
        name &&
        (/^[\u4e00-\u9fff]{2,4}$/.test(name) ||
          /^[a-zA-Z\s]{2,20}$/.test(name))
      ) {
        students.push({
          name,
          studentId: studentId || undefined,
          hasId: !!studentId,
        });
      }
    }

    return students;
  };

  // -------------------------------------------------------------------
  // Auto-assign student IDs
  // -------------------------------------------------------------------
  const handleAutoAssignIds = async (
    students: {
      name: string;
      studentId?: string;
      hasId: boolean;
    }[],
  ): Promise<{
    name: string;
    studentId?: string;
    hasId: boolean;
  }[]> => {
    const studentsWithIds = students.filter((s) => s.hasId && s.studentId);
    const studentsWithoutIds = students.filter((s) => !s.hasId);

    if (studentsWithoutIds.length === 0) return students;

    let nextIdNum = 1;
    let useLeadingZeros = true;
    let maxLength = 3;

    if (studentsWithIds.length > 0) {
      const existingIds = studentsWithIds
        .map((s) => parseInt(s.studentId!))
        .filter((id) => !isNaN(id))
        .sort((a, b) => a - b);

      if (existingIds.length > 0) {
        nextIdNum = Math.max(...existingIds) + 1;
        const firstIdStr = studentsWithIds[0]?.studentId || "";
        useLeadingZeros =
          firstIdStr.startsWith("0") && firstIdStr.length > 1;
        maxLength = Math.max(
          ...studentsWithIds.map((s) => s.studentId?.length || 0),
        );
      }
    }

    const confirmed = confirm(
      `检测到 ${studentsWithoutIds.length} 名学生没有学号，是否自动分配？\n` +
        `将从 ${String(nextIdNum).padStart(maxLength, "0")} 开始分配`,
    );

    if (!confirmed) return students;

    const result = [...students];
    let currentId = nextIdNum;

    for (let i = 0; i < result.length; i++) {
      if (!result[i]!.hasId) {
        const idStr = useLeadingZeros
          ? String(currentId).padStart(maxLength, "0")
          : String(currentId);
        result[i] = { ...result[i]!, studentId: idStr, hasId: true };
        currentId++;
      }
    }

    return result;
  };

  // -------------------------------------------------------------------
  // Batch import handler (called by StudentImportZone)
  // -------------------------------------------------------------------
  const handleImport = async (params: ImportParams) => {
    if (!authToken) return;

    const { inputMode, file, text, model } = params;
    setBatchStep("processing");

    try {
      let students: {
        name: string;
        studentId?: string;
        hasId: boolean;
      }[] = [];

      if (inputMode === "image") {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(file!);
        });

        const result = await analyzeBatchMutation.mutateAsync({
          authToken,
          imageBase64: base64,
          modelKey: model,
        });

        if (result.success && result.analysis) {
          setAnalysisResult(result.analysis);
          students = result.analysis.students.map((s) => ({
            name: s.studentName,
            studentId: s.studentId,
            hasId: !!s.studentId,
          }));
        } else {
          throw new Error("AI分析失败");
        }
      } else if (inputMode === "file") {
        if (file!.name.toLowerCase().endsWith(".csv")) {
          students = await parseCsvFile(file!);
        } else if (file!.name.toLowerCase().match(/\.(xls|xlsx)$/)) {
          students = await parseExcelFile(file!);
        } else {
          throw new Error("不支持的文件格式");
        }

        setAnalysisResult({
          students: students.map((s) => ({
            studentName: s.name,
            studentId: s.studentId,
            confidence: 0.9,
            reasoning: "从文件直接解析",
          })),
          autoAssignedStudentIds: [],
          confidence: 0.9,
          reasoning: `成功从${file!.name}解析到${students.length}名学生`,
        });
      } else if (inputMode === "text") {
        students = parseTextInput(text);

        setAnalysisResult({
          students: students.map((s) => ({
            studentName: s.name,
            studentId: s.studentId,
            confidence: 0.85,
            reasoning: "从文本直接解析",
          })),
          autoAssignedStudentIds: [],
          confidence: 0.85,
          reasoning: `成功从文本解析到${students.length}名学生`,
        });
      }

      if (students.length === 0) {
        toastError("未能解析到学生信息，请检查输入格式");
        setBatchStep("upload");
        return;
      }

      const studentsWithoutIds = students.filter((s) => !s.hasId);
      if (studentsWithoutIds.length > 0) {
        students = await handleAutoAssignIds(students);
      }

      const editable: EditableStudent[] = students.map((student, index) => ({
        id: `student-${index}`,
        name: student.name,
        studentId:
          student.studentId || String(index + 1).padStart(3, "0"),
        isEditing: false,
      }));

      setEditableStudents(editable);
      setBatchStep("review");

      const modeNames: Record<string, string> = {
        image: "AI分析",
        file: "文件解析",
        text: "文本解析",
      };
      toast(
        `🎉 ${modeNames[inputMode]}成功！识别到 ${students.length} 名学生`,
        {
          icon: "🎉",
          duration: 4000,
          style: {
            background: "#10b981",
            color: "white",
          },
        },
      );
    } catch (error: any) {
      let errorMessage =
        inputMode === "image" ? "图片分析失败，请重试" : "处理失败，请重试";

      if (error.message) {
        if (inputMode === "image") {
          if (
            error.message.includes("Stream closed") ||
            error.message.includes("stream")
          ) {
            errorMessage = "网络连接中断，请检查网络后重试";
          } else if (
            error.message.includes("timeout") ||
            error.message.includes("超时")
          ) {
            errorMessage = "AI分析超时，请尝试使用更小的图片或换个模型";
          } else if (
            error.message.includes("rate limit") ||
            error.message.includes("频率")
          ) {
            errorMessage = "API调用频率限制，请稍后重试";
          } else if (
            error.message.includes("authentication") ||
            error.message.includes("认证")
          ) {
            errorMessage = "AI服务认证失败，请联系管理员";
          } else {
            errorMessage = `分析失败: ${error.message}`;
          }
        } else {
          errorMessage = error.message;
        }
      }

      toastError(errorMessage);
      setBatchStep("upload");
    }
  };

  // -------------------------------------------------------------------
  // Editable students handlers
  // -------------------------------------------------------------------
  const handleEditStudent = (
    id: string,
    field: "name" | "studentId",
    value: string,
  ) => {
    setEditableStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, [field]: value } : student,
      ),
    );
  };

  const handleToggleEdit = (id: string) => {
    setEditableStudents((prev) =>
      prev.map((student) =>
        student.id === id
          ? { ...student, isEditing: !student.isEditing }
          : student,
      ),
    );
  };

  const handleRemoveStudent = (id: string) => {
    setEditableStudents((prev) => prev.filter((student) => student.id !== id));
  };

  const handleAddNewStudent = () => {
    const newId = `student-${Date.now()}`;
    const newStudentId = String(editableStudents.length + 1);

    setEditableStudents((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        studentId: newStudentId,
        isEditing: true,
      },
    ]);
  };

  const handleReassignIds = () => {
    setEditableStudents((prev) =>
      prev.map((student, index) => ({
        ...student,
        studentId: String(index + 1).padStart(3, "0"),
      })),
    );
    toastSuccess("学号已重新按序分配 (001, 002, 003...)");
  };

  // -------------------------------------------------------------------
  // Confirm batch add
  // -------------------------------------------------------------------
  const handleConfirmBatchAdd = async () => {
    if (!authToken) return;

    const validStudents = editableStudents.filter((s) => s.name.trim());

    if (validStudents.length === 0) {
      toastError("请至少添加一个学生");
      return;
    }

    const names = validStudents.map((s) => s.name.trim());
    const duplicateNames = names.filter(
      (name, index) => names.indexOf(name) !== index,
    );
    if (duplicateNames.length > 0) {
      toastError(`学生姓名重复: ${duplicateNames.join(", ")}`);
      return;
    }

    const studentIds = validStudents
      .map((s) => s.studentId.trim())
      .filter(Boolean);
    const duplicateIds = studentIds.filter(
      (id, index) => studentIds.indexOf(id) !== index,
    );
    if (duplicateIds.length > 0) {
      toastError(`学号重复: ${duplicateIds.join(", ")}`);
      return;
    }

    setBatchStep("processing");

    try {
      const result = await batchAddMutation.mutateAsync({
        authToken,
        classId,
        students: validStudents.map((s) => ({
          name: s.name.trim(),
          studentId: s.studentId.trim() || undefined,
        })),
      });

      if (result.success) {
        toastSuccess(result.message || `成功添加 ${result.studentsAdded} 名学生！`);
        onSuccess?.();
        handleClose();
      }
    } catch (error) {
      toastError(getErrorMessage(error));
      setBatchStep("review");
    }
  };

  // -------------------------------------------------------------------
  // Close / reset
  // -------------------------------------------------------------------
  const handleClose = () => {
    setResetKey((k) => k + 1);
    setActiveTab("single");
    setBatchStep("upload");
    setAnalysisResult(null);
    setEditableStudents([]);
    onClose();
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-glow">
                        {activeTab === "single" ? (
                          <UserPlus className="w-6 h-6 text-white" />
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                          {activeTab === "single"
                            ? "添加学生"
                            : "批量添加学生"}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mt-1">
                          {activeTab === "single"
                            ? "向您的班级添加单个学生"
                            : batchStep === "upload"
                              ? "上传学生名单图片"
                              : batchStep === "review"
                                ? "确认学生信息"
                                : "处理中"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-8 pt-6">
                  <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setActiveTab("single")}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "single"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      单个添加
                    </button>
                    <button
                      onClick={() => setActiveTab("batch")}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "batch"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Brain className="w-4 h-4 inline mr-2" />
                      AI批量添加
                    </button>
                  </div>
                </div>

                {/* Content — single tab */}
                <div className={activeTab === "single" ? "" : "hidden"}>
                  <StudentForm
                    key={`form-${resetKey}`}
                    onSubmit={handleSingleSubmit}
                    isSubmitting={addStudentMutation.isPending}
                    onCancel={handleClose}
                  />
                </div>

                {/* Content — batch tab */}
                <div className={activeTab === "batch" ? "" : "hidden"}>
                  {/* Upload step (kept mounted to preserve file state) */}
                  <div
                    className={batchStep === "upload" ? "" : "hidden"}
                  >
                    <StudentImportZone
                      key={`import-${resetKey}`}
                      onImport={handleImport}
                      isAnalyzing={analyzeBatchMutation.isPending}
                      onCancel={handleClose}
                    />
                  </div>

                  {/* Processing step */}
                  {batchStep === "processing" && (
                    <div className="px-8 py-12 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {batchStep === "processing" && analysisResult
                              ? "正在添加学生..."
                              : "正在分析图片..."}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {batchStep === "processing" && analysisResult
                              ? "请稍候，正在为您创建学生档案"
                              : "AI正在识别学生信息，请稍候"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review step */}
                  {batchStep === "review" && (
                    <div className="px-8 py-6">
                      <div className="space-y-6">
                        {/* Analysis Summary */}
                        {analysisResult && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start">
                              <Brain className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-blue-900 mb-1">
                                  AI分析结果 (置信度:{" "}
                                  {Math.round(
                                    analysisResult.confidence * 100,
                                  )}
                                  %)
                                </div>
                                <div className="text-sm text-blue-800 mb-2">
                                  {analysisResult.reasoning}
                                </div>

                                {analysisResult
                                  .autoAssignedStudentIds.length > 0 && (
                                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                                    <div className="flex items-center mb-2">
                                      <Check className="w-4 h-4 text-green-600 mr-2" />
                                      <span className="text-sm font-medium text-green-900">
                                        自动分配学号 (
                                        {
                                          analysisResult
                                            .autoAssignedStudentIds.length
                                        }{" "}
                                        名学生)
                                      </span>
                                    </div>
                                    <div className="text-xs text-green-800">
                                      学号:{" "}
                                      {analysisResult.autoAssignedStudentIds.join(
                                        ", ",
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Students List Header */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              识别到的学生 ({editableStudents.length})
                            </h3>
                            <div className="flex space-x-2">
                              {(analysisResult?.autoAssignedStudentIds
                                ?.length || 0) > 0 && (
                                <button
                                  onClick={handleReassignIds}
                                  className="btn-secondary-sm text-xs"
                                >
                                  <Hash className="w-4 h-4 mr-1" />
                                  重新排序
                                </button>
                              )}
                              <button
                                onClick={handleAddNewStudent}
                                className="btn-primary-sm"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                添加学生
                              </button>
                            </div>
                          </div>

                          {/* Student List Component */}
                          <StudentList
                            students={editableStudents}
                            autoAssignedIds={
                              analysisResult?.autoAssignedStudentIds ?? []
                            }
                            onEdit={handleEditStudent}
                            onToggleEdit={handleToggleEdit}
                            onRemove={handleRemoveStudent}
                          />
                        </div>

                        {/* Confirmation Buttons */}
                        <div className="flex space-x-4">
                          <button
                            onClick={() => setBatchStep("upload")}
                            className="btn-secondary flex-1"
                          >
                            重新上传
                          </button>
                          <button
                            onClick={handleConfirmBatchAdd}
                            disabled={
                              editableStudents.length === 0 ||
                              batchAddMutation.isPending
                            }
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {batchAddMutation.isPending ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                添加中...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                确认添加 (
                                {
                                  editableStudents.filter((s) =>
                                    s.name.trim(),
                                  ).length
                                }{" "}
                                名学生)
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
