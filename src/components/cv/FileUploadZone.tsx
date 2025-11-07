"use client";

import { useState, useRef, DragEvent } from 'react';

interface FileUploadZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function FileUploadZone({
  file,
  onFileSelect,
  accept = ".pdf,.docx",
  maxSizeMB = 10,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      return `File quá lớn. Kích thước tối đa: ${maxSizeMB}MB`;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.some(type => 
      type === fileExtension || type === selectedFile.type
    );

    if (!isValidType) {
      return `Định dạng file không hợp lệ. Chỉ chấp nhận: ${accept}`;
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    setError("");
    const validationError = validateFile(selectedFile);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center">
          {/* Icon */}
          <div className={`mb-4 transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
            {isDragging ? (
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div className="space-y-1">
            {file ? (
              <>
                <p className="text-lg font-medium text-gray-900">
                  📄 {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Nhấp hoặc kéo thả để chọn file khác
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900">
                  {isDragging ? "Thả file vào đây" : "Nhấp để tải lên hoặc kéo thả file"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF hoặc DOCX
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Kích thước file tối đa: {maxSizeMB}MB
                </p>
              </>
            )}
          </div>

          {/* Supported formats */}
          {!file && (
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                📄 PDF
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                📝 DOCX
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
