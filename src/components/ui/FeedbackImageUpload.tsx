"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { apiPostFormData } from '@/lib/api-client';

interface Attachment {
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  publicUrl: string;
}

interface FeedbackImageUploadProps {
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

const allowedTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export default function FeedbackImageUpload({
  onAttachmentsChange,
  maxFiles = 3,
  maxFileSize = 5
}: FeedbackImageUploadProps) {
  const { t, locale } = useTranslation();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return t('feedback.fileValidation.invalidType');
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return t('feedback.fileValidation.tooLarge', { maxSize: maxFileSize });
    }

    if (attachments.length >= maxFiles) {
      return t('feedback.fileValidation.maxFiles', { maxFiles });
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<Attachment | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await apiPostFormData<Attachment & { originalName: string }>(
        '/api/feedback/upload',
        formData,
        undefined,
        locale
      );

      return {
        fileName: result.fileName,
        originalName: result.originalName,
        fileSize: result.fileSize,
        fileType: result.fileType,
        publicUrl: result.publicUrl,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToProcess = Array.from(files);

    for (const file of filesToProcess) {
      const validationError = validateFile(file);
      if (validationError) {
        showErrorToast(validationError, locale);
        continue;
      }

      setUploading(file.name);

      try {
        const attachment = await uploadFile(file);

        if (attachment) {
          const newAttachments = [...attachments, attachment];
          setAttachments(newAttachments);
          onAttachmentsChange(newAttachments);
          showSuccessToast(t('feedback.uploadSuccess', { fileName: file.name }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showErrorToast(t('feedback.uploadError', { fileName: file.name, error: errorMessage }), locale);
      } finally {
        setUploading(null);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    onAttachmentsChange(newAttachments);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('feedback.attachmentsLabel')}
        </label>
        <p className="text-sm text-gray-500 mb-3">
          {t('feedback.attachmentsDescription', { maxFiles, maxFileSize })}
        </p>

        {/* Upload Button */}
        <div className="flex items-center justify-center w-full">
          <label
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploading
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-sm text-gray-500">{t('feedback.uploading', { fileName: uploading })}</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">{t('feedback.clickToUpload')}</span> {t('feedback.dragDrop')}
                  </p>
                  <p className="text-xs text-gray-500">{t('feedback.supportedFormats')}</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading !== null}
            />
          </label>
        </div>

        {/* Or Button */}
        <div className="flex justify-center mt-3">
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploading !== null || attachments.length >= maxFiles}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          >
            {t('feedback.uploadButton')}
          </button>
        </div>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{t('feedback.uploadedFiles')}</p>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  {/* Image Preview */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src={attachment.publicUrl}
                      alt={attachment.originalName}
                      fill
                      className="object-cover"
                      sizes="48px"
                      onError={(e) => {
                        // Hide the image and show fallback icon
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          // Show the fallback icon by changing its opacity
                          const fallback = parent.querySelector('.fallback-icon');
                          if (fallback) {
                            (fallback as HTMLElement).style.opacity = '1';
                          }
                        }
                      }}
                    />
                    {/* Fallback icon - shows when image fails */}
                    <div className="fallback-icon absolute inset-0 flex items-center justify-center text-gray-400 opacity-0 transition-opacity duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title={t('feedback.removeFile')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
