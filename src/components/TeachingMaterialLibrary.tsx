import React, { useState } from 'react';
import { useTRPC } from '~/trpc/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '~/components/Toast';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  File, 
  Trash2, 
  Eye, 
  Filter,
  Search,
  Plus,
  Calendar,
  Tag,
  X
} from 'lucide-react';
import { useAuthStore } from '~/stores/authStore';
import { TeachingMaterialUpload } from './TeachingMaterialUpload';
import { ConfirmDialog } from './ConfirmDialog';

interface TeachingMaterial {
  id: number;
  title: string;
  description?: string;
  contentType: string;
  fileUrl?: string;
  textContent?: string;
  knowledgeArea?: {
    id: number;
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TeachingMaterialLibraryProps {
  onGenerateQuestions?: (materials: TeachingMaterial[]) => void;
  onClose?: () => void;
}

export function TeachingMaterialLibrary({ onGenerateQuestions, onClose }: TeachingMaterialLibraryProps) {
  const toast = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { authToken } = useAuthStore();
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch teaching materials
  const { data: materialsData, isLoading, error } = useQuery({
    ...trpc.getTeachingMaterials.queryOptions({
      authToken: authToken!,
      ...(selectedContentType && { contentType: selectedContentType as any }),
      ...(selectedKnowledgeArea && { knowledgeAreaId: selectedKnowledgeArea as number }),
    }),
    enabled: !!authToken,
  });

  // Get knowledge areas for categorization
  const { data: knowledgeAreasData } = useQuery({
    ...trpc.getKnowledgeAreas.queryOptions({
      authToken: authToken!,
    }),
    enabled: !!authToken,
  });

  const knowledgeAreas = (knowledgeAreasData as any)?.knowledgeAreas || [];

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: (materialId: number) => (trpc as any).deleteTeachingMaterial.mutateAsync({
      authToken: authToken!,
      materialId,
    }),
    onSuccess: () => {
      toast.success('教学资料删除成功');
      // Use proper tRPC query invalidation
      queryClient.invalidateQueries({ 
        queryKey: ['teachingMaterials']
      });
    },
    onError: (error) => {
      toast.error('删除失败，请重试');
    },
  });

  const materials = materialsData?.materials || [];

  // Filter materials based on search query
  const filteredMaterials = materials.filter((material: any) => 
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (material.knowledgeArea?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (materialId: number, title: string) => {
    setDeleteTarget({ id: materialId, title });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    // Use proper tRPC query invalidation
    queryClient.invalidateQueries({ 
      queryKey: ['teachingMaterials']
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-blue-500" />;
      case 'video': return <Video className="h-5 w-5 text-purple-500" />;
      case 'audio': return <Music className="h-5 w-5 text-green-500" />;
      case 'text': return <FileText className="h-5 w-5 text-gray-500" />;
      default: return <File className="h-5 w-5 text-orange-500" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return '图片';
      case 'video': return '视频';
      case 'audio': return '音频';
      case 'text': return '文本';
      case 'document': return '文档';
      default: return '其他';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (showUpload) {
    return (
      <TeachingMaterialUpload
        onSuccess={handleUploadSuccess}
        onClose={() => setShowUpload(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">教学资料库</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加资料
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="搜索教学资料..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">所有类型</option>
              <option value="text">文本</option>
              <option value="document">文档</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="other">其他</option>
            </select>
          </div>

          {knowledgeAreas.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <select
                value={selectedKnowledgeArea}
                onChange={(e) => setSelectedKnowledgeArea(e.target.value ? parseInt(e.target.value) : '')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">所有知识领域</option>
                {knowledgeAreas.map((area: any) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-sm text-gray-500">
            共 {filteredMaterials.length} 份资料
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">加载教学资料时出错，请刷新页面重试</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedContentType ? '没有找到匹配的教学资料' : '还没有上传任何教学资料'}
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            上传第一份资料
          </button>
        </div>
      )}

      {/* Materials Grid */}
      {!isLoading && !error && filteredMaterials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material: any) => (
            <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getContentTypeIcon(material.contentType)}
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {getContentTypeLabel(material.contentType)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(material.id, material.title)}
                  className="text-gray-400 hover:text-red-600"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {material.title}
              </h3>
              
              {material.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {material.description}
                </p>
              )}

              {/* Knowledge Area */}
              {material.knowledgeArea && (
                <div className="flex items-center space-x-1 mb-3">
                  <Tag className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {material.knowledgeArea.name}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(material.createdAt)}</span>
                </div>
                
                {material.fileUrl && (
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-3 w-3" />
                    <span>查看</span>
                  </a>
                )}
              </div>

              {/* Text Content Preview */}
              {material.contentType === 'text' && material.textContent && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-3">
                  {material.textContent}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="删除教学资料"
        message={`确定要删除教学资料"${deleteTarget?.title}"吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
