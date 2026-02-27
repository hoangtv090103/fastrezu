"use client";

import { useState, useTransition } from "react";
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

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-5">
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
          disabled={isPending}
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
