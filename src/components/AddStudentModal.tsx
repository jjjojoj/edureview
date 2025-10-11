import { Fragment, useState, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  X,
  UserPlus,
  User,
  GraduationCap,
  Loader2,
  Sparkles,
  Check,
  Hash,
  Camera,
  Brain,
  Upload,
  Users,
  CheckCircle,
  AlertCircle,
  Edit3,
  Trash2,
  FileSpreadsheet,
  FileUp,
  FileText
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";
import * as ExcelJS from 'exceljs';

const addStudentSchema = z.object({
  name: z.string().min(1, "学生姓名不能为空").max(100, "姓名过长"),
  studentId: z.string().optional(),
});

type AddStudentFormData = z.infer<typeof addStudentSchema>;

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

interface EditableStudent {
  id: string;
  name: string;
  studentId: string;
  isEditing: boolean;
}

type TabMode = 'single' | 'batch';
type BatchStep = 'upload' | 'review' | 'processing';
type InputMode = 'image' | 'file' | 'text';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onSuccess?: () => void;
}

export function AddStudentModal({ isOpen, onClose, classId, onSuccess }: AddStudentModalProps) {
  const trpc = useTRPC();
  const { authToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab and step management
  const [activeTab, setActiveTab] = useState<TabMode>('single');
  const [batchStep, setBatchStep] = useState<BatchStep>('upload');

  // Single add form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
  });

  // Batch add states
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<BatchAnalysisResponse | null>(null);
  const [editableStudents, setEditableStudents] = useState<EditableStudent[]>([]);
  const [selectedModel, setSelectedModel] = useState('siliconcloud/qwen2.5-vl-7b');

  // API mutations
  const addStudentMutation = useMutation(trpc.addStudentToClass.mutationOptions());
  const analyzeBatchMutation = useMutation(trpc.analyzeBatchStudents.mutationOptions());
  const batchAddMutation = useMutation(trpc.batchAddStudentsToClass.mutationOptions());

  const onSubmit = async (data: AddStudentFormData) => {
    if (!authToken) return;

    try {
      await addStudentMutation.mutateAsync({
        authToken,
        classId,
        name: data.name,
        studentId: data.studentId,
      });

      toast.success(`${data.name} 已成功添加到班级！`);
      reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Add student error:", error);
      toast.error(error.message || "添加学生失败");
    }
  };

  // Available AI models
  const availableModels = [
    { key: 'siliconcloud/qwen2.5-vl-7b', name: 'Qwen2.5-VL-7B (推荐)', description: '高性价比，准确度良好' },
    { key: 'alibaba-bailian/qwen-vl-max', name: 'Qwen VL Max (高级)', description: '最高准确度，适合复杂图片' },
  ];

  // File parsing functions
  const parseCsvFile = async (file: File): Promise<{name: string, studentId?: string, hasId: boolean}[]> => {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) return [];

    // Try to identify header row
    let startRowIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('姓名') || firstLine.includes('name') || firstLine.includes('学号') || firstLine.includes('id')) {
      startRowIndex = 1;
    }

    const students: {name: string, studentId?: string, hasId: boolean}[] = [];

    for (let i = startRowIndex; i < lines.length; i++) {
      const line = lines[i];

      // Handle various CSV delimiters: comma, semicolon, tab
      let cells = line.split(',');
      if (cells.length === 1) cells = line.split(';');
      if (cells.length === 1) cells = line.split('\t');

      // Clean up cells (remove quotes, trim whitespace)
      cells = cells.map(cell => cell.replace(/^["']|["']$/g, '').trim());

      let name = '';
      let studentId = '';

      // Try to extract name and ID from cells
      for (const cell of cells) {
        if (cell && cell.length >= 2) {
          // Check if it's a number (likely student ID)
          if (/^\d+$/.test(cell) && cell.length <= 10) {
            studentId = cell;
          }
          // Check if it's a name (2-4 Chinese characters or alphabetic)
          else if (/^[\u4e00-\u9fff]{2,4}$/.test(cell) || /^[a-zA-Z\s]{2,20}$/.test(cell)) {
            if (!name) name = cell;
          }
        }
      }

      if (name) {
        students.push({
          name,
          studentId: studentId || undefined,
          hasId: !!studentId
        });
      }
    }

    return students;
  };

  const parseExcelFile = async (file: File): Promise<{name: string, studentId?: string, hasId: boolean}[]> => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const worksheet = workbook.worksheets[0]; // Get first worksheet
      if (!worksheet) return [];

      const students: {name: string, studentId?: string, hasId: boolean}[] = [];

      // Try to identify header row
      let startRowIndex = 1;
      const firstRow = worksheet.getRow(1);
      const firstRowValues = firstRow.values as any[];
      if (firstRowValues && firstRowValues.some((cell: any) =>
        String(cell || '').toLowerCase().includes('姓名') ||
        String(cell || '').toLowerCase().includes('name') ||
        String(cell || '').toLowerCase().includes('学号') ||
        String(cell || '').toLowerCase().includes('id')
      )) {
        startRowIndex = 2;
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRowIndex) return;

        const values = row.values as any[];
        if (!values || values.length <= 1) return;

        let name = '';
        let studentId = '';

        // Extract values from cells (skip index 0 as it's empty in ExcelJS)
        for (let i = 1; i < values.length; i++) {
          const cellValue = String(values[i] || '').trim();
          if (!cellValue) continue;

          // Check if it's a number (likely student ID)
          if (/^\d+$/.test(cellValue) && cellValue.length <= 10) {
            studentId = cellValue;
          }
          // Check if it's a name
          else if (/^[\u4e00-\u9fff]{2,4}$/.test(cellValue) || /^[a-zA-Z\s]{2,20}$/.test(cellValue)) {
            if (!name) name = cellValue;
          }
        }

        if (name) {
          students.push({
            name,
            studentId: studentId || undefined,
            hasId: !!studentId
          });
        }
      });

      return students;
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw new Error('Excel文件解析失败，请检查文件格式');
    }
  };

  const parseTextInput = (text: string): {name: string, studentId?: string, hasId: boolean}[] => {
    if (!text.trim()) return [];

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const students: {name: string, studentId?: string, hasId: boolean}[] = [];

    for (const line of lines) {
      let name = '';
      let studentId = '';

      // Pattern 1: "张三 001" or "张三 2023001"
      const pattern1 = line.match(/^(.+?)\s+(\d+)$/);
      if (pattern1) {
        name = pattern1[1]?.trim() || '';
        studentId = pattern1[2]?.trim() || '';
      }
      // Pattern 2: "001 张三" or "2023001 张三"
      else {
        const pattern2 = line.match(/^(\d+)\s+(.+)$/);
        if (pattern2) {
          studentId = pattern2[1]?.trim() || '';
          name = pattern2[2]?.trim() || '';
        }
        // Pattern 3: "1. 张三" or "1、张三"
        else {
          const pattern3 = line.match(/^\d+[.、]\s*(.+)$/);
          if (pattern3) {
            name = pattern3[1]?.trim() || '';
          }
          // Pattern 4: "张三(001)" or "张三（001）"
          else {
            const pattern4 = line.match(/^(.+?)[（(](\d+)[）)]$/);
            if (pattern4) {
              name = pattern4[1]?.trim() || '';
              studentId = pattern4[2]?.trim() || '';
            }
            // Pattern 5: Simple name only
            else if (/^[\u4e00-\u9fff]{2,4}$/.test(line) || /^[a-zA-Z\s]{2,20}$/.test(line)) {
              name = line;
            }
          }
        }
      }

      // Validate name
      if (name && (
        /^[\u4e00-\u9fff]{2,4}$/.test(name) ||
        /^[a-zA-Z\s]{2,20}$/.test(name)
      )) {
        students.push({
          name,
          studentId: studentId || undefined,
          hasId: !!studentId
        });
      }
    }

    return students;
  };

  const handleClose = () => {
    // Reset single form
    reset();

    // Reset batch states
    setActiveTab('single');
    setBatchStep('upload');
    setSelectedFile(null);
    setPreviewUrl('');
    setAnalysisResult(null);
    setEditableStudents([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onClose();
  };

  // Batch add handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type based on input mode
    if (inputMode === 'image') {
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('图片文件不能超过10MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (inputMode === 'file') {
      // Check for CSV/Excel files
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      const validExtensions = ['.csv', '.xls', '.xlsx'];
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!hasValidType && !hasValidExtension) {
        toast.error('请选择CSV或Excel文件');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('文件不能超过5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(''); // No preview for file mode
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as any);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!authToken) return;

    // Validate input based on mode
    if (inputMode === 'image' && !selectedFile) {
      toast.error('请选择图片文件');
      return;
    }
    if (inputMode === 'file' && !selectedFile) {
      toast.error('请选择CSV或Excel文件');
      return;
    }
    if (inputMode === 'text' && !textInput.trim()) {
      toast.error('请输入学生名单');
      return;
    }

    setBatchStep('processing');

    try {
      let students: {name: string, studentId?: string, hasId: boolean}[] = [];

      if (inputMode === 'image') {
        // Handle image analysis with AI
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile!);
        });

        const result = await analyzeBatchMutation.mutateAsync({
          authToken,
          imageBase64: base64,
          modelKey: selectedModel,
        });

        if (result.success && result.analysis) {
          setAnalysisResult(result.analysis);
          students = result.analysis.students.map(s => ({
            name: s.studentName,
            studentId: s.studentId,
            hasId: !!s.studentId
          }));
        } else {
          throw new Error('AI分析失败');
        }
      } else if (inputMode === 'file') {
        // Handle CSV/Excel file parsing
        if (selectedFile!.name.toLowerCase().endsWith('.csv')) {
          students = await parseCsvFile(selectedFile!);
        } else if (selectedFile!.name.toLowerCase().match(/\.(xls|xlsx)$/)) {
          students = await parseExcelFile(selectedFile!);
        } else {
          throw new Error('不支持的文件格式');
        }

        // Create mock analysis result for file input
        setAnalysisResult({
          students: students.map(s => ({
            studentName: s.name,
            studentId: s.studentId,
            confidence: 0.9,
            reasoning: '从文件直接解析'
          })),
          autoAssignedStudentIds: [],
          confidence: 0.9,
          reasoning: `成功从${selectedFile!.name}解析到${students.length}名学生`
        });
      } else if (inputMode === 'text') {
        // Handle text input parsing
        students = parseTextInput(textInput);

        // Create mock analysis result for text input
        setAnalysisResult({
          students: students.map(s => ({
            studentName: s.name,
            studentId: s.studentId,
            confidence: 0.85,
            reasoning: '从文本直接解析'
          })),
          autoAssignedStudentIds: [],
          confidence: 0.85,
          reasoning: `成功从文本解析到${students.length}名学生`
        });
      }

      if (students.length === 0) {
        toast.error('未能解析到学生信息，请检查输入格式');
        setBatchStep('upload');
        return;
      }

      // Handle auto student ID assignment
      const studentsWithoutIds = students.filter(s => !s.hasId);
      if (studentsWithoutIds.length > 0) {
        students = await handleAutoAssignIds(students);
      }

      const editable: EditableStudent[] = students.map((student, index) => ({
        id: `student-${index}`,
        name: student.name,
        studentId: student.studentId || String(index + 1).padStart(3, '0'),
        isEditing: false,
      }));

      setEditableStudents(editable);
      setBatchStep('review');

      // Show success message
      const modeNames = { image: 'AI分析', file: '文件解析', text: '文本解析' };
      toast(`🎉 ${modeNames[inputMode]}成功！识别到 ${students.length} 名学生`, {
        icon: '🎉',
        duration: 4000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });
    } catch (error: any) {
      console.error('Analysis error:', error);

      let errorMessage = inputMode === 'image' ? '图片分析失败，请重试' : '处理失败，请重试';

      if (error.message) {
        if (inputMode === 'image') {
          if (error.message.includes('Stream closed') || error.message.includes('stream')) {
            errorMessage = '网络连接中断，请检查网络后重试';
          } else if (error.message.includes('timeout') || error.message.includes('超时')) {
            errorMessage = 'AI分析超时，请尝试使用更小的图片或换个模型';
          } else if (error.message.includes('rate limit') || error.message.includes('频率')) {
            errorMessage = 'API调用频率限制，请稍后重试';
          } else if (error.message.includes('authentication') || error.message.includes('认证')) {
            errorMessage = 'AI服务认证失败，请联系管理员';
          } else {
            errorMessage = `分析失败: ${error.message}`;
          }
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, {
        duration: 8000,
      });

      setBatchStep('upload');
    }
  };

  const handleAutoAssignIds = async (students: {name: string, studentId?: string, hasId: boolean}[]): Promise<{name: string, studentId?: string, hasId: boolean}[]> => {
    // Find students with and without IDs
    const studentsWithIds = students.filter(s => s.hasId && s.studentId);
    const studentsWithoutIds = students.filter(s => !s.hasId);

    if (studentsWithoutIds.length === 0) return students;

    // Determine next ID pattern
    let nextIdNum = 1;
    let useLeadingZeros = true;
    let maxLength = 3;

    if (studentsWithIds.length > 0) {
      const existingIds = studentsWithIds
        .map(s => parseInt(s.studentId!))
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b);

      if (existingIds.length > 0) {
        nextIdNum = Math.max(...existingIds) + 1;

        // Check if existing IDs use leading zeros
        const firstIdStr = studentsWithIds[0]?.studentId || '';
        useLeadingZeros = firstIdStr.startsWith('0') && firstIdStr.length > 1;
        maxLength = Math.max(...studentsWithIds.map(s => s.studentId?.length || 0));
      }
    }

    // Show confirmation dialog
    const confirmed = confirm(
      `检测到 ${studentsWithoutIds.length} 名学生没有学号，是否自动分配？\n` +
      `将从 ${String(nextIdNum).padStart(maxLength, '0')} 开始分配`
    );

    if (!confirmed) {
      // User declined, keep students without IDs as is
      return students;
    }

    // Assign IDs
    const result = [...students];
    let currentId = nextIdNum;

    for (let i = 0; i < result.length; i++) {
      if (!result[i]!.hasId) {
        const idStr = useLeadingZeros
          ? String(currentId).padStart(maxLength, '0')
          : String(currentId);
        result[i] = { ...result[i]!, studentId: idStr, hasId: true };
        currentId++;
      }
    }

    return result;
  };

  const handleEditStudent = (id: string, field: 'name' | 'studentId', value: string) => {
    setEditableStudents(prev => prev.map(student =>
      student.id === id ? { ...student, [field]: value } : student
    ));
  };

  const handleToggleEdit = (id: string) => {
    setEditableStudents(prev => prev.map(student =>
      student.id === id ? { ...student, isEditing: !student.isEditing } : student
    ));
  };

  const handleRemoveStudent = (id: string) => {
    setEditableStudents(prev => prev.filter(student => student.id !== id));
  };

  const handleAddNewStudent = () => {
    const newId = `student-${Date.now()}`;
    const newStudentId = String(editableStudents.length + 1);

    setEditableStudents(prev => [...prev, {
      id: newId,
      name: '',
      studentId: newStudentId,
      isEditing: true,
    }]);
  };

  const handleConfirmBatchAdd = async () => {
    if (!authToken) return;

    const validStudents = editableStudents.filter(s => s.name.trim());

    if (validStudents.length === 0) {
      toast.error('请至少添加一个学生');
      return;
    }

    const names = validStudents.map(s => s.name.trim());
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);

    if (duplicateNames.length > 0) {
      toast.error(`学生姓名重复: ${duplicateNames.join(", ")}`);
      return;
    }

    const studentIds = validStudents.map(s => s.studentId.trim()).filter(Boolean);
    const duplicateIds = studentIds.filter((id, index) => studentIds.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
      toast.error(`学号重复: ${duplicateIds.join(", ")}`);
      return;
    }

    setBatchStep('processing');

    try {
      const result = await batchAddMutation.mutateAsync({
        authToken,
        classId,
        students: validStudents.map(s => ({
          name: s.name.trim(),
          studentId: s.studentId.trim() || undefined,
        })),
      });

      if (result.success) {
        toast.success(result.message || `成功添加 ${result.studentsAdded} 名学生！`);
        onSuccess?.();
        handleClose();
      }
    } catch (error: any) {
      console.error('Batch add error:', error);
      toast.error(error.message || '批量添加学生失败');
      setBatchStep('review');
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'single') {
      return (
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6">
          <div className="space-y-6">
            <div className="animate-slide-up">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                学生姓名 *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  className="form-input pl-10"
                  placeholder="请输入学生姓名"
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.name.message}</p>
              )}
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 mb-2">
                学号 <span className="text-gray-400">(可选)</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register("studentId")}
                  type="text"
                  id="studentId"
                  className="form-input pl-10"
                  placeholder="请输入学号（可选）"
                />
              </div>
              {errors.studentId && (
                <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.studentId.message}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start">
                <GraduationCap className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">自动信息填充</p>
                  <p>学生的学校、年级和班级信息将自动从您的账户信息中获取。</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    添加学生
                    <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      );
    }

    // Batch add content
    if (batchStep === 'upload') {
      return (
        <div className="px-8 py-6">
          <div className="space-y-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                选择AI模型
              </label>
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <label key={model.key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="aiModel"
                      value={model.key}
                      checked={selectedModel === model.key}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{model.name}</div>
                      <div className="text-xs text-gray-500">{model.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Input Mode Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🎯 选择输入方式
              </label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setInputMode('image')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    inputMode === 'image'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <Camera className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">图片上传</div>
                  <div className="text-xs text-gray-500">AI智能识别</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    inputMode === 'file'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <FileSpreadsheet className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">文件上传</div>
                  <div className="text-xs text-gray-500">CSV/Excel文件</div>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    inputMode === 'text'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">文字输入</div>
                  <div className="text-xs text-gray-500">复制粘贴</div>
                </button>
              </div>
            </div>

            {/* Input Area */}
            {inputMode === 'image' && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                    <div className="text-sm text-gray-600">
                      已选择: {selectedFile.name}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                      <Camera className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">上传学生名单图片</p>
                      <p className="text-sm text-gray-500 mt-1">
                        支持JPG、PNG格式，建议小于5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputMode === 'file' && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-sm text-gray-600">
                      已选择: {selectedFile.name}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">上传CSV或Excel文件</p>
                      <p className="text-sm text-gray-500 mt-1">
                        支持.csv, .xls, .xlsx格式，建议小于5MB
                      </p>
                      <div className="text-xs mt-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="font-medium text-green-900 mb-2">📊 支持的文件格式：</p>
                          <ul className="text-green-800 space-y-1 text-left">
                            <li>• CSV文件：姓名，学号（逗号分隔）</li>
                            <li>• Excel文件：第一列姓名，第二列学号</li>
                            <li>• 自动识别表头行（姓名/name, 学号/id）</li>
                            <li>• 智能处理空学号，自动分配编号</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputMode === 'text' && (
              <div className="border-2 border-gray-300 rounded-xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 text-purple-600 mr-3" />
                    <p className="text-lg font-medium text-gray-900">文本输入学生名单</p>
                  </div>

                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="请输入学生名单，支持多种格式：&#10;张三 001&#10;李四 002&#10;王五&#10;1. 赵六&#10;陈七(003)"
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />

                  <div className="text-xs space-y-2">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="font-medium text-purple-900 mb-2">📝 支持的文本格式：</p>
                      <ul className="text-purple-800 space-y-1 text-left">
                        <li>• 姓名 学号：张三 001</li>
                        <li>• 学号 姓名：001 张三</li>
                        <li>• 带序号：1. 张三 或 1、张三</li>
                        <li>• 括号格式：张三(001) 或 张三（001）</li>
                        <li>• 纯姓名：张三（每行一个）</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleAnalyze}
                disabled={
                  (inputMode === 'image' && !selectedFile) ||
                  (inputMode === 'file' && !selectedFile) ||
                  (inputMode === 'text' && !textInput.trim()) ||
                  analyzeBatchMutation.isPending
                }
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzeBatchMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    {inputMode === 'image' && <Brain className="w-5 h-5 mr-2" />}
                    {inputMode === 'file' && <FileSpreadsheet className="w-5 h-5 mr-2" />}
                    {inputMode === 'text' && <FileText className="w-5 h-5 mr-2" />}
                    {inputMode === 'image' && '开始AI分析'}
                    {inputMode === 'file' && '解析文件'}
                    {inputMode === 'text' && '解析文本'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (batchStep === 'review') {
      return (
        <div className="px-8 py-6">
          <div className="space-y-6">
            {/* Analysis Summary */}
            {analysisResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start">
                  <Brain className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-900 mb-1">
                      AI分析结果 (置信度: {Math.round(analysisResult.confidence * 100)}%)
                    </div>
                    <div className="text-sm text-blue-800 mb-2">{analysisResult.reasoning}</div>

                    {/* Auto-assignment summary */}
                    {analysisResult.autoAssignedStudentIds.length > 0 && (
                      <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                        <div className="flex items-center mb-2">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-900">
                            自动分配学号 ({analysisResult.autoAssignedStudentIds.length} 名学生)
                          </span>
                        </div>
                        <div className="text-xs text-green-800">
                          学号: {analysisResult.autoAssignedStudentIds.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Students List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  识别到的学生 ({editableStudents.length})
                </h3>
                <div className="flex space-x-2">
                  {(analysisResult?.autoAssignedStudentIds?.length || 0) > 0 && (
                    <button
                      onClick={() => {
                        // Re-assign all student IDs in sequence
                        setEditableStudents(prev => prev.map((student, index) => ({
                          ...student,
                          studentId: String(index + 1).padStart(3, '0')
                        })));
                        toast.success('学号已重新按序分配 (001, 002, 003...)');
                      }}
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

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {editableStudents.map((student, index) => (
                  <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">姓名</label>
                          {student.isEditing ? (
                            <input
                              type="text"
                              value={student.name}
                              onChange={(e) => handleEditStudent(student.id, 'name', e.target.value)}
                              className="form-input-sm"
                              placeholder="请输入学生姓名"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">{student.name || '未填写'}</div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">学号</label>
                          {student.isEditing ? (
                            <input
                              type="text"
                              value={student.studentId}
                              onChange={(e) => handleEditStudent(student.id, 'studentId', e.target.value)}
                              className="form-input-sm"
                              placeholder="请输入学号"
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-700">{student.studentId}</span>
                              {analysisResult?.autoAssignedStudentIds.includes(student.studentId) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  自动分配
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleEdit(student.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setBatchStep('upload')}
                className="btn-secondary flex-1"
              >
                重新上传
              </button>
              <button
                onClick={handleConfirmBatchAdd}
                disabled={editableStudents.length === 0 || batchAddMutation.isPending}
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
                    确认添加 ({editableStudents.filter(s => s.name.trim()).length} 名学生)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Processing step
    return (
      <div className="px-8 py-12 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {batchStep === 'processing' && analysisResult ? '正在添加学生...' : '正在分析图片...'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {batchStep === 'processing' && analysisResult ? '请稍候，正在为您创建学生档案' : 'AI正在识别学生信息，请稍候'}
            </p>
          </div>
        </div>
      </div>
    );
  };

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
                        {activeTab === 'single' ? (
                          <UserPlus className="w-6 h-6 text-white" />
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                          {activeTab === 'single' ? '添加学生' : '批量添加学生'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mt-1">
                          {activeTab === 'single' ? '向您的班级添加单个学生' : (
                            batchStep === 'upload' ? '上传学生名单图片' :
                            batchStep === 'review' ? '确认学生信息' : '处理中'
                          )}
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
                      onClick={() => setActiveTab('single')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'single'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      单个添加
                    </button>
                    <button
                      onClick={() => setActiveTab('batch')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'batch'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Brain className="w-4 h-4 inline mr-2" />
                      AI批量添加
                    </button>
                  </div>
                </div>

                {/* Content */}
                {renderTabContent()}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
