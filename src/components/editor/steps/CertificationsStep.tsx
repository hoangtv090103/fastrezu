"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";

export default function CertificationsStep() {
  const { state, updateSection } = useCVEditor();
  
  const certifications = state.cvData?.sections.certifications || [];

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Chứng chỉ
        </h3>
        <p className="body-text text-gray-600 mb-4">
          Liệt kê các chứng chỉ, chứng nhận hoặc khóa học quan trọng mà bạn đã hoàn thành. Đây là phần tùy chọn nhưng có thể giúp CV của bạn nổi bật.
        </p>
      </div>

      <div className="space-y-6">
        {certifications.map((cert: Record<string, unknown>, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                Chứng chỉ {index + 1}
              </h4>
              <button
                onClick={() => removeCertification(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Xóa
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chứng chỉ *
                </label>
                <input
                  type="text"
                  value={cert.name || ""}
                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                  placeholder="AWS Certified Solutions Architect"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổ chức cấp *
                </label>
                <input
                  type="text"
                  value={cert.issuing_organization || ""}
                  onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                  placeholder="Amazon Web Services"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày cấp
                  </label>
                  <input
                    type="month"
                    value={cert.date || ""}
                    onChange={(e) => updateCertification(index, 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID chứng chỉ
                  </label>
                  <input
                    type="text"
                    value={cert.credential_id || ""}
                    onChange={(e) => updateCertification(index, 'credential_id', e.target.value)}
                    placeholder="AWS-123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link chứng chỉ
                </label>
                <input
                  type="url"
                  value={cert.credential_url || ""}
                  onChange={(e) => updateCertification(index, 'credential_url', e.target.value)}
                  placeholder="https://www.credly.com/badges/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addCertification}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
        >
          + Thêm chứng chỉ
        </button>

        {/* Popular Certifications Suggestions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">Chứng chỉ phổ biến:</h5>
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
