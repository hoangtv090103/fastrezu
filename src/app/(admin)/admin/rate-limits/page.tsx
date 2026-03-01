"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface RateLimitConfig {
  tier: string;
  feature: string;
  daily_limit: number;
}

const TIERS = ["free", "sprint_pass", "pro_pass", "beta_free"];
const FEATURES = [
  "default",
  "cv_scan",
  "jd_analysis",
  "mock_interview",
  "resume_rewrite",
];

export default function RateLimitsPage() {
  const [configs, setConfigs] = useState<
    Record<string, Record<string, number>>
  >({});
  const [original, setOriginal] = useState<
    Record<string, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rate-limits");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();

      const configMap: Record<string, Record<string, number>> = {};

      // Initialize with default values (-1 for infinite, 0 for nothing, or some default)
      TIERS.forEach((tier) => {
        configMap[tier] = {};
        FEATURES.forEach((feature) => {
          // Add default intelligent fallback limits if not set
          configMap[tier][feature] =
            tier === "beta_free" ? -1 : tier === "free" ? 3 : 50;
        });
      });

      // Override with DB values
      data.configs.forEach((c: RateLimitConfig) => {
        if (!configMap[c.tier]) configMap[c.tier] = {};
        configMap[c.tier][c.feature] = c.daily_limit;
      });

      setConfigs(JSON.parse(JSON.stringify(configMap)));
      setOriginal(JSON.parse(JSON.stringify(configMap)));
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải thông tin Rate Limits");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const rowsToUpdate: RateLimitConfig[] = [];

      TIERS.forEach((tier) => {
        FEATURES.forEach((feature) => {
          // Only update if changed
          if (configs[tier][feature] !== original[tier][feature]) {
            rowsToUpdate.push({
              tier,
              feature,
              daily_limit: configs[tier][feature],
            });
          }
        });
      });

      if (rowsToUpdate.length === 0) {
        toast("Không có thay đổi nào", { icon: "ℹ️" });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/rate-limits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rowsToUpdate }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }

      setOriginal(JSON.parse(JSON.stringify(configs)));
      toast.success("Đã lưu thành công");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu rate limits");
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (tier: string, feature: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setConfigs((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [feature]: numValue,
      },
    }));
  };

  const hasChanges = JSON.stringify(configs) !== JSON.stringify(original);

  if (loading) {
    return <div className="text-gray-500 p-8">Đang tải cấu hình...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Rate Limits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cấu hình giới hạn số lượt gọi API cho từng tính năng theo Gói cước
            (nhập -1 = vô hạn / ∞).
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`px-4 py-2 rounded-md font-medium ${
            hasChanges && !saving
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Gói cước
                </th>
                {FEATURES.map((f) => (
                  <th
                    key={f}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {TIERS.map((tier) => (
                <tr key={tier} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tier === "pro_pass"
                          ? "bg-purple-100 text-purple-800"
                          : tier === "sprint_pass"
                            ? "bg-green-100 text-green-800"
                            : tier === "beta_free"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tier}
                    </span>
                  </td>
                  {FEATURES.map((feature) => {
                    const val = configs[tier]?.[feature] ?? 0;
                    const isChanged = val !== original[tier]?.[feature];

                    return (
                      <td
                        key={`${tier}-${feature}`}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        <div className="relative">
                          <input
                            type="number"
                            min="-1"
                            value={val}
                            onChange={(e) =>
                              handleValueChange(tier, feature, e.target.value)
                            }
                            className={`block w-24 rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                              isChanged
                                ? "ring-yellow-400 bg-yellow-50"
                                : "ring-gray-300"
                            }`}
                          />
                          {val === -1 && (
                            <span className="absolute right-3 top-1.5 text-gray-400 pointer-events-none text-sm font-serif italic">
                              ∞
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
