"use client";

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import FeedbackImageUpload from './FeedbackImageUpload';
import { apiPost } from '@/lib/api-client';

interface Attachment {
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  publicUrl: string;
}

interface FeedbackFormData {
  feedback_type: 'bug_report' | 'feature_request' | 'general_feedback' | 'praise';
  subject: string;
  message: string;
  user_email?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  attachments?: Attachment[];
}

interface FeedbackFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

// These will be populated with translations in the component

export default function FeedbackForm({ onSuccess, onCancel, showCancel = true }: FeedbackFormProps) {
  const { t, locale } = useTranslation();
  const [formData, setFormData] = useState<FeedbackFormData>({
    feedback_type: 'general_feedback',
    subject: '',
    message: '',
    user_email: '',
    priority: 'medium',
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { value: 'bug_report', label: t('feedback.types.bugLabel'), description: t('feedback.types.bugDescription') },
    { value: 'feature_request', label: t('feedback.types.featureLabel'), description: t('feedback.types.featureDescription') },
    { value: 'general_feedback', label: t('feedback.types.generalLabel'), description: t('feedback.types.generalDescription') },
    { value: 'praise', label: t('feedback.types.praiseLabel'), description: t('feedback.types.praiseDescription') },
  ] as const;

  const priorities = [
    { value: 'low', label: t('feedback.priorities.low'), color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: t('feedback.priorities.medium'), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: t('feedback.priorities.high'), color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: t('feedback.priorities.critical'), color: 'bg-red-100 text-red-800' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      showErrorToast(t('feedback.errorFillRequired'), locale);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiPost('/api/feedback', formData, undefined, locale);

      showSuccessToast(t('feedback.successMessage'));
      onSuccess?.();

      // Reset form
      setFormData({
        feedback_type: 'general_feedback',
        subject: '',
        message: '',
        user_email: '',
        priority: 'medium',
        attachments: [],
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showErrorToast(t('feedback.error'), locale);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FeedbackFormData, value: string | Attachment[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttachmentsChange = (attachments: Attachment[]) => {
    setFormData(prev => ({ ...prev, attachments }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('feedback.type')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {feedbackTypes.map((type) => (
            <label
              key={type.value}
              className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:border-blue-300 ${
                formData.feedback_type === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="feedback_type"
                value={type.value}
                checked={formData.feedback_type === type.value}
                onChange={(e) => handleInputChange('feedback_type', e.target.value)}
                className="sr-only"
              />
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{type.label}</span>
                <span className="text-sm text-gray-500">{type.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          {t('feedback.subject')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          placeholder={t('feedback.subjectPlaceholder')}
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
          maxLength={255}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          {t('feedback.messageLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder={t('feedback.messagePlaceholder')}
          rows={5}
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none placeholder:text-gray-400"
          maxLength={2000}
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {formData.message.length}/2000
        </div>
      </div>

      {/* Email (optional) */}
      <div>
        <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 mb-2">
          {t('feedback.email')}
        </label>
        <input
          type="email"
          id="user_email"
          value={formData.user_email}
          onChange={(e) => handleInputChange('user_email', e.target.value)}
          placeholder={t('feedback.emailPlaceholder')}
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
        />
        <div className="text-xs text-gray-500 mt-1">
          {t('feedback.emailHint')}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('feedback.priority')}
        </label>
        <div className="flex flex-wrap gap-2">
          {priorities.map((priority) => (
            <button
              key={priority.value}
              type="button"
              onClick={() => handleInputChange('priority', priority.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                formData.priority === priority.value
                  ? priority.color + ' ring-2 ring-offset-1 ring-gray-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <FeedbackImageUpload
        onAttachmentsChange={handleAttachmentsChange}
        maxFiles={3}
        maxFileSize={5}
      />

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('feedback.submitting')}</span>
            </>
          ) : (
            <span>{t('feedback.submitButton')}</span>
          )}
        </button>

        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
