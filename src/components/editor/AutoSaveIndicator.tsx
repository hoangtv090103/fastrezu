"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function AutoSaveIndicator() {
  const { state } = useCVEditor();
  const { t } = useTranslation();

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
        return t('editor.autoSave.saving');
      case 'saved':
        return t('editor.autoSave.saved');
      case 'error':
        return t('editor.autoSave.error');
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
