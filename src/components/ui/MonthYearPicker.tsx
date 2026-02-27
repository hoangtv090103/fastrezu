"use client";

/**
 * Custom MonthYearPicker
 * Thay thế cho react-day-picker để có giao diện UI sạch sẽ chuyên cho việc chọn Tháng/Năm.
 * Value: "YYYY-MM" (tương thích với <input type="month">)
 */

import { useState, useRef, useEffect } from "react";
import { parse, isValid } from "date-fns";

interface MonthYearPickerProps {
  value?: string; // "YYYY-MM" hoặc ""
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function parseYearMonth(raw: string) {
  if (!raw || raw.length < 7) return null;
  const d = parse(raw, "yyyy-MM", new Date());
  return isValid(d) ? { year: d.getFullYear(), month: d.getMonth() } : null;
}

const MONTHS = [
  "Thg 1",
  "Thg 2",
  "Thg 3",
  "Thg 4",
  "Thg 5",
  "Thg 6",
  "Thg 7",
  "Thg 8",
  "Thg 9",
  "Thg 10",
  "Thg 11",
  "Thg 12",
];

export default function MonthYearPicker({
  value,
  onChange,
  placeholder = "Chọn tháng/năm",
  disabled = false,
  id,
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parseYearMonth(value ?? "");
  const [viewYear, setViewYear] = useState<number>(
    selected?.year ?? new Date().getFullYear(),
  );

  // Reset viewYear when opening if selected changes
  useEffect(() => {
    if (open && selected) {
      setViewYear(selected.year);
    } else if (open && !selected) {
      setViewYear(new Date().getFullYear());
    }
  }, [open, value]);

  const displayLabel = selected
    ? `Tháng ${selected.month + 1}/${selected.year}`
    : "";

  // Close khi click ra ngoài
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Nếu click vào nút thay đổi năm (header) thì không close
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close khi Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleSelectMonth = (monthIndex: number) => {
    // format as YYYY-MM (MM is 01-12)
    const mm = String(monthIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        id={id}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-200
          ${disabled ? "opacity-40 cursor-not-allowed bg-gray-50" : "cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"}
          ${open ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300"}
          ${displayLabel ? "text-gray-900" : "text-gray-400"}
        `}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{displayLabel || placeholder}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Clear button */}
      {displayLabel && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Không trigger popover
            onChange("");
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Xóa ngày"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Popover calendar */}
      {open && (
        <div
          role="dialog"
          aria-label="Chọn tháng và năm"
          className="absolute z-50 mt-1 left-0 bg-white rounded-xl border border-gray-200 shadow-xl p-3 w-[260px] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header chuuyển năm */}
          <div className="flex flex-row items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Body 12 tháng */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((label, index) => {
              const isSelected =
                selected?.year === viewYear && selected?.month === index;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectMonth(index)}
                  className={`
                    py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    ${
                      isSelected
                        ? "bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
