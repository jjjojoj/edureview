import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";
import { promoteClassSchema, type PromoteClassFormData } from "./ArchiveClassModal/types";
import { ChoiceStep } from "./ArchiveClassModal/ChoiceStep";
import { PromoteFormStep } from "./ArchiveClassModal/PromoteFormStep";
import { ConfirmArchiveStep } from "./ArchiveClassModal/ConfirmArchiveStep";
import { ConfirmPromoteStep } from "./ArchiveClassModal/ConfirmPromoteStep";
import { ProcessingStep } from "./ArchiveClassModal/ProcessingStep";
import { SuccessStep } from "./ArchiveClassModal/SuccessStep";

interface ArchiveClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
  onSuccess?: () => void;
}

export function ArchiveClassModal({ isOpen, onClose, classId, className, onSuccess }: ArchiveClassModalProps) {
  const [step, setStep] = useState<'choice' | 'promote-form' | 'confirm-archive' | 'confirm-promote' | 'processing' | 'success'>('choice');
  const [archiveChoice, setArchiveChoice] = useState<'archive-only' | 'promote'>('archive-only');
  const [successData, setSuccessData] = useState<any>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { authToken } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<PromoteClassFormData>({
    resolver: zodResolver(promoteClassSchema),
    mode: 'onChange',
  });

  const concludeClassMutation = useMutation(trpc.concludeClass.mutationOptions());
  const promoteClassMutation = useMutation(trpc.promoteClass.mutationOptions());

  const watchedValues = watch();

  const handleChoice = (choice: 'archive-only' | 'promote') => {
    setArchiveChoice(choice);
    if (choice === 'archive-only') {
      setStep('confirm-archive');
    } else {
      setStep('promote-form');
    }
  };

  const handlePromoteFormSubmit = () => {
    setStep('confirm-promote');
  };

  const handleConfirmArchive = async () => {
    if (!authToken) {
      toast.error("未找到认证令牌，请重新登录");
      return;
    }

    setStep('processing');

    try {
      const result = await concludeClassMutation.mutateAsync({
        authToken,
        classId,
      });

      setSuccessData(result);
      setStep('success');

      queryClient.invalidateQueries({
        queryKey: trpc.getTeacherClasses.queryKey({ authToken }),
      });

      toast.success("班级已成功归档！");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setStep('choice');
    }
  };

  const handleConfirmPromote = async () => {
    if (!authToken || !isValid) {
      toast.error("请检查表单信息");
      return;
    }

    setStep('processing');

    try {
      const result = await promoteClassMutation.mutateAsync({
        authToken,
        oldClassId: classId,
        newClassName: watchedValues.newClassName,
        newGrade: watchedValues.newGrade,
      });

      setSuccessData(result);
      setStep('success');

      queryClient.invalidateQueries({
        queryKey: trpc.getTeacherClasses.queryKey({ authToken }),
      });

      toast.success(`班级已成功升级到${watchedValues.newGrade}！`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setStep('choice');
    }
  };

  const handleClose = () => {
    setStep('choice');
    setArchiveChoice('archive-only');
    setSuccessData(null);
    reset();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {step === 'choice' && (
                  <ChoiceStep
                    className={className}
                    archiveChoice={archiveChoice}
                    onChoiceChange={setArchiveChoice}
                    onContinue={handleChoice}
                    onClose={handleClose}
                  />
                )}
                {step === 'promote-form' && (
                  <PromoteFormStep
                    register={register}
                    errors={errors}
                    isValid={isValid}
                    onBack={() => setStep('choice')}
                    onSubmit={handlePromoteFormSubmit}
                    onClose={handleClose}
                  />
                )}
                {step === 'confirm-archive' && (
                  <ConfirmArchiveStep
                    className={className}
                    onBack={() => setStep('choice')}
                    onConfirm={handleConfirmArchive}
                    onClose={handleClose}
                  />
                )}
                {step === 'confirm-promote' && (
                  <ConfirmPromoteStep
                    className={className}
                    newClassName={watchedValues.newClassName}
                    newGrade={watchedValues.newGrade}
                    onBack={() => setStep('promote-form')}
                    onConfirm={handleConfirmPromote}
                    onClose={handleClose}
                  />
                )}
                {step === 'processing' && (
                  <ProcessingStep isPromote={archiveChoice === 'promote'} />
                )}
                {step === 'success' && (
                  <SuccessStep
                    isPromote={archiveChoice === 'promote'}
                    successData={successData}
                    onClose={handleClose}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
