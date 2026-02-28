"use client";

import { useState, useTransition, useRef } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";

export interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  photo_url?: string;
}

const defaultPersonalInfo: PersonalInfo = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  linkedin: "",
  github: "",
  portfolio: "",
  summary: "",
  photo_url: undefined,
};

interface PersonalInfoFormProps {
  initialData?: Partial<PersonalInfo>;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

export default function PersonalInfoForm({
  initialData,
  onSaved,
  onError,
}: PersonalInfoFormProps) {
  const [form, setForm] = useState<PersonalInfo>({
    ...defaultPersonalInfo,
    ...initialData,
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setLocalError(null);
    startTransition(async () => {
      const result = await upsertVaultSection(
        "personal",
        form as unknown as Parameters<typeof upsertVaultSection>[1],
      );
      if (result.success) {
        onSaved?.();
      } else {
        const msg = result.error ?? "Lỗi khi lưu";
        setLocalError(msg);
        onError?.(msg);
      }
    });
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadError(null);

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Chỉ hỗ trợ JPG, PNG, WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ảnh không được vượt quá 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cv/photo-upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? "Lỗi khi tải ảnh lên");
        return;
      }
      setForm((prev) => ({ ...prev, photo_url: json.publicUrl }));
    } catch {
      setUploadError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
    // Reset input so same file can be re-selected after removal
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const res = await fetch("/api/cv/photo-upload", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("DELETE failed");
      }
      setForm((prev) => ({ ...prev, photo_url: undefined }));
    } catch {
      setUploadError("Lỗi khi xóa ảnh. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-5">
      {/* ── Photo Upload ── */}
      <div>
        <label className={labelClass}>
          Ảnh đại diện{" "}
          <span className="text-gray-400 font-normal">
            (Modern, Executive, Creative — JPG/PNG/WebP, tối đa 5MB)
          </span>
        </label>

        <div className="flex items-center gap-5">
          {/* Preview circle */}
          <div className="shrink-0">
            {form.photo_url ? (
              <img
                src={form.photo_url}
                alt="Ảnh đại diện"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Drop zone + buttons */}
          <div className="flex-1">
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative flex flex-col items-center justify-center gap-1
                rounded-lg border-2 border-dashed px-4 py-4 cursor-pointer
                transition-all duration-200 text-center
                ${
                  isDragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                }
                ${isUploading ? "cursor-not-allowed opacity-60" : ""}
              `}
            >
              {isUploading ? (
                <>
                  <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-500">Đang tải lên…</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-gray-500">
                    {form.photo_url
                      ? "Bấm hoặc kéo thả để đổi ảnh"
                      : "Bấm hoặc kéo thả ảnh vào đây"}
                  </span>
                </>
              )}
            </div>

            {form.photo_url && !isUploading && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
              >
                Xóa ảnh
              </button>
            )}

            {uploadError && (
              <p className="mt-1 text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Họ và tên</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="yourname@email.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Số điện thoại</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+84 900 000 000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Địa chỉ / Khu vực</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Hồ Chí Minh, Việt Nam"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>LinkedIn URL</label>
          <input
            name="linkedin"
            value={form.linkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>GitHub URL</label>
          <input
            name="github"
            value={form.github}
            onChange={handleChange}
            placeholder="https://github.com/username"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Portfolio / Website</label>
        <input
          name="portfolio"
          value={form.portfolio}
          onChange={handleChange}
          placeholder="https://yourwebsite.com"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          Tóm tắt bản thân{" "}
          <span className="text-gray-400 font-normal">
            (AI sẽ dùng phần này)
          </span>
        </label>
        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          rows={4}
          placeholder="Mô tả ngắn gọn về bạn, điểm mạnh, mục tiêu nghề nghiệp..."
          className={inputClass + " resize-none"}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          id="save-personal-info-btn"
          onClick={handleSave}
          disabled={isPending || isUploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu…
            </>
          ) : (
            "Lưu thông tin"
          )}
        </button>
        {localError && (
          <span className="text-sm text-red-600 font-medium">{localError}</span>
        )}
      </div>
    </div>
  );
}
