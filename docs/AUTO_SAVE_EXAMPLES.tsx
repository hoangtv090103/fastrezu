/**
 * Ví dụ: Sử dụng saveNow() trong component Export PDF
 * 
 * File: src/components/editor/ExportPDFButton.tsx
 */

import { useCVEditor } from "@/contexts/CVEditorContext";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExportPDFButton() {
  const { state, saveNow } = useCVEditor();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // 1. Kiểm tra nếu có thay đổi chưa lưu
      if (state.isDirty) {
        toast.info("Đang lưu thay đổi...");
        // Lưu ngay lập tức trước khi export
        await saveNow();
        toast.success("Đã lưu thành công!");
      }

      // 2. Tiếp tục với logic export PDF
      const response = await fetch(`/api/cv/${state.cvData?.id}/export-pdf`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Export PDF thất bại");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.cvData?.title || "CV"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Đã tải xuống PDF thành công!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Không thể xuất PDF. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || state.isLoading}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang xuất...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Tải xuống PDF
        </>
      )}
    </Button>
  );
}

/**
 * ============================================================
 * Ví dụ 2: Sử dụng với Wizard Navigation
 * ============================================================
 */

import { useCVEditor } from "@/contexts/CVEditorContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function WizardNavigation() {
  const { state, setCurrentStep, saveNow } = useCVEditor();
  
  const handleNext = async () => {
    // Lưu trước khi chuyển bước
    if (state.isDirty) {
      await saveNow();
    }
    setCurrentStep(state.currentStep + 1);
  };

  const handlePrevious = async () => {
    // Lưu trước khi quay lại
    if (state.isDirty) {
      await saveNow();
    }
    setCurrentStep(state.currentStep - 1);
  };

  return (
    <div className="flex justify-between mt-6">
      <Button
        onClick={handlePrevious}
        disabled={state.currentStep === 0 || state.isSaving}
        variant="outline"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>

      <Button
        onClick={handleNext}
        disabled={state.currentStep === 6 || state.isSaving}
      >
        Tiếp theo
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * ============================================================
 * Ví dụ 3: Auto-save Indicator Component
 * ============================================================
 */

import { useCVEditor } from "@/contexts/CVEditorContext";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AutoSaveIndicator() {
  const { state } = useCVEditor();

  const getStatusConfig = () => {
    if (state.saveStatus === "saving") {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: "Đang lưu...",
        className: "text-blue-600",
      };
    }

    if (state.saveStatus === "saved" && !state.isDirty) {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        text: "Đã lưu",
        className: "text-green-600",
      };
    }

    if (state.saveStatus === "error") {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Lỗi lưu",
        className: "text-red-600",
      };
    }

    // isDirty = true nhưng chưa save
    if (state.isDirty) {
      return {
        icon: <Loader2 className="h-4 w-4" />,
        text: "Có thay đổi...",
        className: "text-yellow-600",
      };
    }

    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: "Đã lưu",
      className: "text-green-600",
    };
  };

  const config = getStatusConfig();

  return (
    <div className={cn("flex items-center gap-2 text-sm", config.className)}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

/**
 * ============================================================
 * Ví dụ 4: Prompt Before Leave (Router Integration)
 * ============================================================
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCVEditor } from "@/contexts/CVEditorContext";

export function usePromptBeforeLeave() {
  const router = useRouter();
  const { state, saveNow } = useCVEditor();

  useEffect(() => {
    // Override router.push để check dirty state
    const originalPush = router.push;
    
    router.push = async (href: string, options?: any) => {
      if (state.isDirty) {
        const confirmed = window.confirm(
          "Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi rời đi không?"
        );

        if (confirmed) {
          await saveNow();
        } else {
          // User chọn không lưu, vẫn cho phép navigate
          return;
        }
      }

      return originalPush.call(router, href, options);
    };

    return () => {
      // Restore original push
      router.push = originalPush;
    };
  }, [router, state.isDirty, saveNow]);
}

// Sử dụng trong component:
export function CVEditorPage() {
  usePromptBeforeLeave();

  return (
    <div>
      {/* Your editor UI */}
    </div>
  );
}

/**
 * ============================================================
 * Ví dụ 5: Manual Save Button (cho user muốn control)
 * ============================================================
 */

import { useCVEditor } from "@/contexts/CVEditorContext";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

export function ManualSaveButton() {
  const { state, saveNow } = useCVEditor();

  const handleManualSave = async () => {
    try {
      await saveNow();
      toast.success("Đã lưu thành công!");
    } catch (error) {
      toast.error("Lỗi khi lưu. Vui lòng thử lại.");
    }
  };

  return (
    <Button
      onClick={handleManualSave}
      disabled={!state.isDirty || state.isSaving}
      variant="outline"
      size="sm"
    >
      <Save className="mr-2 h-4 w-4" />
      {state.isSaving ? "Đang lưu..." : "Lưu ngay"}
    </Button>
  );
}
