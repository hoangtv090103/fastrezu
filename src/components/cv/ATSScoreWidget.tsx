
"use client";

import { useTranslation } from "@/hooks/useTranslation";

interface ATSScoreWidgetProps {
  score: number;
}

export default function ATSScoreWidget({ score }: ATSScoreWidgetProps) {
  const { t } = useTranslation();

  const getScoreColor = () => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreLabel = () => {
    if (score >= 80) return t('editor.review.atsScoreExcellent');
    if (score >= 60) return t('editor.review.atsScoreGood');
    return t('editor.review.atsScoreNeedsImprovement');
  };

  return (
    <div className="flex items-center space-x-3">
      <div
        className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor()}`}
      >
        {score}/100
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">{t('editor.review.atsScore')}</p>
        <p className="text-xs font-medium text-gray-700">{getScoreLabel()}</p>
      </div>
    </div>
  );
}
