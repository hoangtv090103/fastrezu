"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";

export default function AutoSaveIndicator() {
  const { state } = useCVEditor();

  const getStatusColor = () => {
    switch (state.saveStatus) {
      case 'saving':
        return 'text-yellow-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (state.saveStatus) {
      case 'saving':
        return 'Đang lưu...';
      case 'saved':
        return 'Đã lưu';
      case 'error':
        return 'Lỗi lưu';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (state.saveStatus) {
      case 'saving':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
        );
      case 'saved':
        return '✓';
      case 'error':
        return '⚠';
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center space-x-2 small-text ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}
