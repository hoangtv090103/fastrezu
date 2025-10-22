"use client";

interface AIAssistButtonProps {
  onClick: () => void;
  loading: boolean;
  label: string;
  disabled?: boolean;
}

export default function AIAssistButton({ onClick, loading, label, disabled = false }: AIAssistButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          <span>🤖</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
