import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, BookOpen, Users, CheckCircle, Clock } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";

const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateClassModal({ isOpen, onClose }: CreateClassModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const authToken = useAuthStore((state) => state.authToken);

  const [createdClass, setCreatedClass] = useState<{
    name: string;
    invitationCode: string;
    invitationCodeExpiresAt: Date;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
  });

  const createClassMutation = useMutation(trpc.createClass.mutationOptions());

  const onSubmit = async (data: CreateClassFormData) => {
    if (!authToken) {
      toast.error("Authentication required");
      return;
    }

    try {
      const result = await createClassMutation.mutateAsync({
        authToken,
        name: data.name,
        description: data.description,
      });
      
      toast.success(`Class "${result.class.name}" created successfully!`);
      
      // Store created class info to show invitation code
      setCreatedClass({
        name: result.class.name,
        invitationCode: result.class.invitationCode!,
        invitationCodeExpiresAt: new Date(result.class.invitationCodeExpiresAt!),
      });
      
      // Invalidate and refetch classes using proper tRPC query key
      queryClient.invalidateQueries({
        queryKey: trpc.getTeacherClasses.queryKey({ authToken }),
      });
      
      reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to create class");
    }
  };

  const handleClose = () => {
    reset();
    setCreatedClass(null);
    onClose();
  };

  const handleCopyCode = () => {
    if (createdClass?.invitationCode) {
      navigator.clipboard.writeText(createdClass.invitationCode);
      toast.success("Invitation code copied to clipboard!");
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="relative p-6">
                  <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {createdClass ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">
                        Class Created Successfully!
                      </Dialog.Title>
                      <p className="text-gray-600 mb-6">
                        Share this invitation code with parents to allow them to register
                      </p>

                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Class Name</p>
                        <p className="text-lg font-semibold text-gray-900 mb-4">{createdClass.name}</p>
                        
                        <p className="text-sm font-medium text-gray-700 mb-2">Invitation Code</p>
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                          <p className="text-3xl font-mono font-bold text-center text-gray-900 tracking-wider">
                            {createdClass.invitationCode}
                          </p>
                        </div>
                        
                        <button
                          onClick={handleCopyCode}
                          className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                        >
                          Copy Code
                        </button>
                        
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-700">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Code expires: {createdClass.invitationCodeExpiresAt.toLocaleDateString()} at{" "}
                            {createdClass.invitationCodeExpiresAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                          Create New Class
                        </Dialog.Title>
                        <p className="text-gray-600 mt-2">
                          Set up a new class to manage your students and assignments.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Class Name *
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              {...register("name")}
                              type="text"
                              id="name"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              placeholder="e.g., Mathematics Grade 10"
                            />
                          </div>
                          {errors.name && (
                            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                          </label>
                          <textarea
                            {...register("description")}
                            id="description"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                            placeholder="Brief description of the class..."
                          />
                          {errors.description && (
                            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                          )}
                        </div>

                        <div className="flex space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Creating..." : "Create Class"}
                          </button>
                        </div>
                      </form>
                    </>
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
