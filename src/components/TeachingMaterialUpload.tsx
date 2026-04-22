import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTRPC } from '~/trpc/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '~/components/Toast';
import { FileText, Image, Video, Music, File, X } from 'lucide-react';
import { useAuthStore } from '~/stores/authStore';
import { FileDropZone } from '~/components/upload/FileDropZone';

const uploadSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  contentType: z.enum(['document', 'image', 'text', 'video', 'audio', 'other']),
  textContent: z.string().optional(),
  knowledgeAreaId: z.number().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface TeachingMaterialUploadProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function TeachingMaterialUpload({ onSuccess, onClose }: TeachingMaterialUploadProps) {
  const toast = useToast();
  const trpc = useTRPC();
  const { authToken } = useAuthStore();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      contentType: 'text',
    },
  });

  const contentType = watch('contentType');

  // Get knowledge areas for categorization
  const { data: knowledgeAreasData } = useQuery({
    ...trpc.getKnowledgeAreas.queryOptions({
      authToken: authToken!,
    }),
    enabled: !!authToken,
  });

  const knowledgeAreas = (knowledgeAreasData as any)?.knowledgeAreas || [];

  // Upload teaching material mutation
  const uploadMutation = useMutation({
    mutationFn: (data: any) => (trpc as any).uploadTeachingMaterial.mutateAsync({
      authToken: authToken!,
      ...data,
    }),
  });

  // Generate presigned URL mutation
  const presignedUrlMutation = useMutation({
    mutationFn: (data: any) => (trpc as any).generatePresignedUploadUrl.mutateAsync({
      authToken: authToken!,
      ...data,
    }),
  });

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);

    // Auto-detect content type based on file type
    if (file.type.startsWith('image/')) {
      setValue('contentType', 'image');
    } else if (file.type.startsWith('video/')) {
      setValue('contentType', 'video');
    } else if (file.type.startsWith('audio/')) {
      setValue('contentType', 'audio');
    } else {
      setValue('contentType', 'document');
    }

    // Set title to filename if not already set
    if (!watch('title')) {
      setValue('title', file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const uploadFileToStorage = async (file: File) => {
    try {
      // Get presigned URL
      const urlData: any = await presignedUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        folderName: 'teaching-materials',
      });

      // Upload file to OSS
      const uploadResponse = await fetch(urlData.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      return urlData.objectUrl;
    } catch (error) {
      throw error;
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!authToken) {
      toast.error('请先登录');
      return;
    }

    // Validate that either file or text content is provided
    if (!uploadedFile && !data.textContent) {
      toast.error('请选择文件或输入文本内容');
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl: string | undefined;

      // Upload file if provided
      if (uploadedFile) {
        fileUrl = await uploadFileToStorage(uploadedFile);
      }

      // Upload teaching material metadata
      await uploadMutation.mutateAsync({
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        fileUrl,
        textContent: data.textContent,
        knowledgeAreaId: data.knowledgeAreaId,
      });

      toast.success('教学资料上传成功！');
      reset();
      setUploadedFile(null);
      onSuccess?.();
    } catch (error) {
      toast.error('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">上传教学资料</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Content Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            资料类型
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'text', label: '文本', icon: <FileText className="h-4 w-4" /> },
              { value: 'document', label: '文档', icon: <File className="h-4 w-4" /> },
              { value: 'image', label: '图片', icon: <Image className="h-4 w-4" /> },
              { value: 'video', label: '视频', icon: <Video className="h-4 w-4" /> },
              { value: 'audio', label: '音频', icon: <Music className="h-4 w-4" /> },
              { value: 'other', label: '其他', icon: <File className="h-4 w-4" /> },
            ].map((type) => (
              <label key={type.value} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value={type.value}
                  {...register('contentType')}
                  className="text-blue-600"
                />
                {type.icon}
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* File Upload Area (for non-text content) */}
        {contentType !== 'text' && (
          <FileDropZone
            contentType={contentType}
            uploadedFile={uploadedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={() => setUploadedFile(null)}
          />
        )}

        {/* Text Content Area (for text content type) */}
        {contentType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文本内容 *
            </label>
            <textarea
              {...register('textContent')}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入教学资料的文本内容..."
            />
            {errors.textContent && (
              <p className="mt-1 text-sm text-red-600">{errors.textContent.message}</p>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标题 *
          </label>
          <input
            type="text"
            {...register('title')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入资料标题"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="简要描述这份教学资料的内容和用途"
          />
        </div>

        {/* Knowledge Area Selection */}
        {knowledgeAreas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              知识领域
            </label>
            <select
              {...register('knowledgeAreaId', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">选择知识领域（可选）</option>
              {knowledgeAreas.map((area: any) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={isUploading || (!uploadedFile && contentType !== 'text')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {isUploading ? '上传中...' : '上传资料'}
          </button>
        </div>
      </form>
    </div>
  );
}
