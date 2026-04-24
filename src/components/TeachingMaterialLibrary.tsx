import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "~/components/Toast";
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
  X,
} from "lucide-react";
import { useAuthStore } from "~/stores/authStore";
import { TeachingMaterialUpload } from "./TeachingMaterialUpload";
import { ConfirmDialog } from "./ConfirmDialog";

interface TeachingMaterial {
  id: number;
  title: string;
  description?: string | null;
  contentType: string;
  fileUrl?: string | null;
  textContent?: string | null;
  knowledgeArea?: {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

type TeachingMaterialContentType =
  | "document"
  | "image"
  | "text"
  | "video"
  | "audio"
  | "other";

interface KnowledgeArea {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

const CONTENT_TYPE_OPTIONS: Array<{
  value: TeachingMaterialContentType;
  label: string;
}> = [
  { value: "text", label: "文本" },
  { value: "document", label: "文档" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
  { value: "audio", label: "音频" },
  { value: "other", label: "其他" },
];

function isTeachingMaterialContentType(
  value: string,
): value is TeachingMaterialContentType {
  return CONTENT_TYPE_OPTIONS.some((option) => option.value === value);
}

interface TeachingMaterialLibraryProps {
  onClose?: () => void;
  showHeader?: boolean;
  variant?: "modal" | "page";
}

export function TeachingMaterialLibrary({
  onClose,
  showHeader = true,
  variant = "modal",
}: TeachingMaterialLibraryProps) {
  const toast = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { authToken } = useAuthStore();
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<
    TeachingMaterialContentType | ""
  >("");
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<
    number | ""
  >("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch teaching materials
  const {
    data: materialsData,
    isLoading,
    error,
  } = useQuery({
    ...trpc.getTeachingMaterials.queryOptions({
      authToken: authToken!,
      ...(selectedContentType && { contentType: selectedContentType }),
      ...(selectedKnowledgeArea && {
        knowledgeAreaId: selectedKnowledgeArea,
      }),
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

  const knowledgeAreas: KnowledgeArea[] =
    knowledgeAreasData?.knowledgeAreas ?? [];

  // Delete material mutation
  const deleteMutation = useMutation(
    trpc.deleteTeachingMaterial.mutationOptions(),
  );

  const materials: TeachingMaterial[] = materialsData?.materials ?? [];

  // Filter materials based on search query
  const filteredMaterials = materials.filter(
    (material) =>
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description &&
        material.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      material.knowledgeArea?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (materialId: number, title: string) => {
    setDeleteTarget({ id: materialId, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync({
        authToken: authToken!,
        materialId: deleteTarget.id,
      });
      toast.success("教学资料删除成功");
      void queryClient.invalidateQueries({
        queryKey: ["teachingMaterials"],
      });
      setDeleteTarget(null);
    } catch {
      toast.error("删除失败，请重试");
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    // Use proper tRPC query invalidation
    void queryClient.invalidateQueries({
      queryKey: ["teachingMaterials"],
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-5 w-5 text-blue-500" />;
      case "video":
        return <Video className="h-5 w-5 text-purple-500" />;
      case "audio":
        return <Music className="h-5 w-5 text-green-500" />;
      case "text":
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <File className="h-5 w-5 text-orange-500" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "image":
        return "图片";
      case "video":
        return "视频";
      case "audio":
        return "音频";
      case "text":
        return "文本";
      case "document":
        return "文档";
      default:
        return "其他";
    }
  };

  const formatDate = (dateValue: Date | string) => {
    return new Date(dateValue).toLocaleDateString("zh-CN");
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
    <div
      className={
        variant === "page"
          ? "rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          : "rounded-lg bg-white p-6 shadow-lg"
      }
    >
      {showHeader ? (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">教学资料库</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              添加资料
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            添加资料
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="搜索教学资料..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedContentType}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedContentType(
                  isTeachingMaterialContentType(value) ? value : "",
                );
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">所有类型</option>
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {knowledgeAreas.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <select
                value={selectedKnowledgeArea}
                onChange={(e) =>
                  setSelectedKnowledgeArea(
                    e.target.value ? parseInt(e.target.value) : "",
                  )
                }
                className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">所有知识领域</option>
                {knowledgeAreas.map((area) => (
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
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="py-12 text-center">
          <p className="text-red-600">加载教学资料时出错，请刷新页面重试</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMaterials.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4 text-gray-600">
            {searchQuery || selectedContentType
              ? "没有找到匹配的教学资料"
              : "还没有上传任何教学资料"}
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            上传第一份资料
          </button>
        </div>
      )}

      {/* Materials Grid */}
      {!isLoading && !error && filteredMaterials.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getContentTypeIcon(material.contentType)}
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
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
              <h3 className="mb-2 line-clamp-2 font-medium text-gray-900">
                {material.title}
              </h3>

              {material.description && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                  {material.description}
                </p>
              )}

              {/* Knowledge Area */}
              {material.knowledgeArea && (
                <div className="mb-3 flex items-center space-x-1">
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
              {material.contentType === "text" && material.textContent && (
                <div className="mt-3 line-clamp-3 rounded bg-gray-50 p-2 text-xs text-gray-600">
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
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
