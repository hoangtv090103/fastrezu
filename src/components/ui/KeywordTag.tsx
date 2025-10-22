"use client";

interface KeywordTagProps {
  keyword: string;
  matched?: boolean;
}

export default function KeywordTag({ keyword, matched = false }: KeywordTagProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        matched
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-blue-100 text-blue-800 border border-blue-200'
      }`}
    >
      {matched && <span className="mr-1">✓</span>}
      {keyword}
    </span>
  );
}
