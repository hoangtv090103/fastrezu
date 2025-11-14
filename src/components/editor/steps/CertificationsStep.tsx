"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function CertificationsStep() {
  const { state, updateSection } = useCVEditor();
  const { t } = useTranslation();
  
  const certifications = (state.cvData?.sections.certifications || []) as Record<string, unknown>[];

  const addCertification = () => {
    const newCertification = {
      name: "",
      issuing_organization: "",
      date: "",
      credential_id: "",
      credential_url: "",
    };
    updateSection('certifications', [...certifications, newCertification]);
  };

  const removeCertification = (index: number) => {
    const updatedCertifications = certifications.filter((_, i) => i !== index);
    updateSection('certifications', updatedCertifications);
  };

  const updateCertification = (index: number, field: string, value: string) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index] = {
      ...updatedCertifications[index],
      [field]: value,
    };
    updateSection('certifications', updatedCertifications);
  };

  const getStringValue = (cert: Record<string, unknown>, key: string): string => {
    const value = cert[key];
    return typeof value === 'string' ? value : '';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          {t('editor.certifications.title')}
        </h3>
        <p className="body-text text-gray-600 mb-4">
          {t('editor.certifications.description')}
        </p>
      </div>

      <div className="space-y-6">
        {certifications.map((cert: Record<string, unknown>, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                {t('editor.certifications.title')} {index + 1}
              </h4>
              <button
                onClick={() => removeCertification(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                {t('editor.certifications.remove')}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('editor.certifications.name')} *
                </label>
                <input
                  type="text"
                  value={getStringValue(cert, 'name')}
                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                  placeholder={t('editor.certifications.namePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('editor.certifications.issuer')} *
                </label>
                <input
                  type="text"
                  value={getStringValue(cert, 'issuing_organization')}
                  onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                  placeholder={t('editor.certifications.issuerPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('editor.certifications.issueDate')}
                  </label>
                  <input
                    type="month"
                    value={getStringValue(cert, 'date')}
                    onChange={(e) => updateCertification(index, 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('editor.certifications.credentialId')}
                  </label>
                  <input
                    type="text"
                    value={getStringValue(cert, 'credential_id')}
                    onChange={(e) => updateCertification(index, 'credential_id', e.target.value)}
                    placeholder={t('editor.certifications.credentialIdPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('editor.certifications.credentialUrl')}
                </label>
                <input
                  type="url"
                  value={getStringValue(cert, 'credential_url')}
                  onChange={(e) => updateCertification(index, 'credential_url', e.target.value)}
                  placeholder={t('editor.certifications.credentialUrlPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addCertification}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
        >
          + {t('editor.certifications.addCertification')}
        </button>

        {/* Popular Certifications Suggestions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">{t('editor.certifications.popularCertifications')}</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• AWS Certified Solutions Architect</div>
            <div>• Google Cloud Professional</div>
            <div>• Microsoft Azure Fundamentals</div>
            <div>• PMP (Project Management Professional)</div>
            <div>• Scrum Master Certification</div>
            <div>• Google Analytics Certified</div>
          </div>
        </div>
      </div>
    </div>
  );
}
