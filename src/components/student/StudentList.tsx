import { Edit3, Trash2, Sparkles } from "lucide-react";

export interface EditableStudent {
  id: string;
  name: string;
  studentId: string;
  isEditing: boolean;
}

interface StudentListProps {
  students: EditableStudent[];
  autoAssignedIds?: string[];
  onEdit: (id: string, field: "name" | "studentId", value: string) => void;
  onToggleEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export function StudentList({
  students,
  autoAssignedIds = [],
  onEdit,
  onToggleEdit,
  onRemove,
}: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">暂无学生数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {students.map((student, index) => (
        <div key={student.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
              {index + 1}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  姓名
                </label>
                {student.isEditing ? (
                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) =>
                      onEdit(student.id, "name", e.target.value)
                    }
                    className="form-input-sm"
                    placeholder="请输入学生姓名"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {student.name || "未填写"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  学号
                </label>
                {student.isEditing ? (
                  <input
                    type="text"
                    value={student.studentId}
                    onChange={(e) =>
                      onEdit(student.id, "studentId", e.target.value)
                    }
                    className="form-input-sm"
                    placeholder="请输入学号"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      {student.studentId}
                    </span>
                    {autoAssignedIds.includes(student.studentId) && (
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
                onClick={() => onToggleEdit(student.id)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemove(student.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
