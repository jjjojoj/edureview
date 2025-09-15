import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { UserPlus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const addStudentSchema = z.object({
  name: z.string().min(1, "Student name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  studentId: z.string().optional(),
  schoolName: z.string().min(1, "School name is required"),
  grade: z.string().min(1, "Grade is required"),
});

type AddStudentFormData = z.infer<typeof addStudentSchema>;

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
}

export function AddStudentModal({ isOpen, onClose, classId }: AddStudentModalProps) {
  const { authToken } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
  });

  const addStudentMutation = useMutation(trpc.addStudentToClass.mutationOptions());

  const onSubmit = async (data: AddStudentFormData) => {
    try {
      await addStudentMutation.mutateAsync({
        authToken: authToken!,
        classId,
        name: data.name,
        email: data.email || undefined,
        studentId: data.studentId || undefined,
        schoolName: data.schoolName,
        grade: data.grade,
      });

      toast.success('Student added successfully!');
      
      // Refresh the students data
      queryClient.invalidateQueries({
        queryKey: trpc.getClassStudents.queryKey({ 
          authToken: authToken!, 
          classId 
        }),
      });
      
      // Reset form and close modal
      reset();
      onClose();
    } catch (error: any) {
      console.error('Add student error:', error);
      toast.error(error.message || 'Failed to add student');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserPlus className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Add Student</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Add a new student to this class
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Student Name *
            </label>
            <input
              {...register("name")}
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter student's full name"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="student@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
              Student ID (Optional)
            </label>
            <input
              {...register("studentId")}
              type="text"
              id="studentId"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., S12345"
            />
          </div>

          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
              School Name *
            </label>
            <input
              {...register("schoolName")}
              type="text"
              id="schoolName"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter school name"
            />
            {errors.schoolName && (
              <p className="text-red-600 text-sm mt-1">{errors.schoolName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
              Grade *
            </label>
            <input
              {...register("grade")}
              type="text"
              id="grade"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., 5th Grade, Grade 10"
            />
            {errors.grade && (
              <p className="text-red-600 text-sm mt-1">{errors.grade.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
