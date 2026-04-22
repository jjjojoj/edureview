import React, { useCallback } from 'react';
import { Upload, FileText, Image, Video, Music, File, X } from 'lucide-react';

interface FileDropZoneProps {
  contentType: string;
  uploadedFile: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

function getContentTypeIcon(type: string) {
  switch (type) {
    case 'image': return <Image className="h-5 w-5" />;
    case 'video': return <Video className="h-5 w-5" />;
    case 'audio': return <Music className="h-5 w-5" />;
    case 'text': return <FileText className="h-5 w-5" />;
    default: return <File className="h-5 w-5" />;
  }
}

export function FileDropZone({
  contentType,
  uploadedFile,
  onFileSelect,
  onFileRemove,
}: FileDropZoneProps) {
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {uploadedFile ? (
        <div className="flex items-center justify-center space-x-2">
          {getContentTypeIcon(contentType)}
          <span className="text-sm font-medium">{uploadedFile.name}</span>
          <button
            type="button"
            onClick={onFileRemove}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">拖拽文件到此处或点击上传</p>
          <input
            type="file"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload"
            accept={
              contentType === 'image' ? 'image/*' :
              contentType === 'video' ? 'video/*' :
              contentType === 'audio' ? 'audio/*' :
              '*/*'
            }
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            选择文件
          </label>
        </>
      )}
    </div>
  );
}
