"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/lib/debounce";
import ValidationMessage from "@/components/ui/ValidationMessage";

export default function EducationStep() {
  const { state, updateSection } = useCVEditor();
  const { t } = useTranslation();

  const education = (state.cvData?.sections.education || []) as Record<
    string,
    unknown
  >[];
  const [dateErrors, setDateErrors] = useState<{
    [key: number]: string | null;
  }>({});

  const validateGraduationDate = (index: number, graduationDate: string) => {
    if (graduationDate) {
      const year = parseInt(graduationDate, 10);
      const currentYear = new Date().getFullYear();

      if (isNaN(year)) {
        setDateErrors((prev) => ({
          ...prev,
          [index]: t("editor.education.graduationDateInvalid"),
        }));
      } else if (year < 1950) {
        setDateErrors((prev) => ({
          ...prev,
          [index]: t("editor.education.graduationDatePast"),
        }));
      } else if (year > currentYear + 10) {
        setDateErrors((prev) => ({
          ...prev,
          [index]: t("editor.education.graduationDateFuture"),
        }));
      } else {
        setDateErrors((prev) => ({ ...prev, [index]: null }));
      }
    } else {
      setDateErrors((prev) => ({ ...prev, [index]: null }));
    }
  };

  // Debounced validation (300ms delay)
  const debouncedValidateDate = useDebounce(
    (index: number, graduationDate: string) => {
      validateGraduationDate(index, graduationDate);
    },
    300
  );

  const addEducation = () => {
    const newEducation = {
      school: "",
      degree: "",
      field_of_study: "",
      graduation_date: "",
      gpa: "",
      relevant_coursework: "",
      activities: [""],
    };
    updateSection("education", [...education, newEducation]);
  };

  const removeEducation = (index: number) => {
    const updatedEducation = education.filter(
      (_: unknown, i: number) => i !== index
    );
    updateSection("education", updatedEducation);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updatedEducation = [...education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value,
    };
    updateSection("education", updatedEducation);

    // Debounced validation for graduation date
    if (field === "graduation_date") {
      debouncedValidateDate(index, value);
    }
  };

  const addActivity = (eduIndex: number) => {
    const updatedEducation = [...education];
    let currentActivities = updatedEducation[eduIndex].activities;

    if (typeof currentActivities === "string") {
      currentActivities = currentActivities ? [currentActivities] : [];
    } else if (!Array.isArray(currentActivities)) {
      currentActivities = [];
    }

    updatedEducation[eduIndex] = {
      ...updatedEducation[eduIndex],
      activities: [...(currentActivities as string[]), ""],
    };
    updateSection("education", updatedEducation);
  };

  const removeActivity = (eduIndex: number, actIndex: number) => {
    const updatedEducation = [...education];
    let currentActivities = updatedEducation[eduIndex].activities;

    if (typeof currentActivities === "string") {
      currentActivities = currentActivities ? [currentActivities] : [];
    } else if (!Array.isArray(currentActivities)) {
      currentActivities = [];
    }

    updatedEducation[eduIndex] = {
      ...updatedEducation[eduIndex],
      activities: (currentActivities as string[]).filter(
        (_, i) => i !== actIndex
      ),
    };
    updateSection("education", updatedEducation);
  };

  const updateActivity = (
    eduIndex: number,
    actIndex: number,
    value: string
  ) => {
    const updatedEducation = [...education];
    let currentActivities = updatedEducation[eduIndex].activities;

    if (typeof currentActivities === "string") {
      currentActivities = currentActivities ? [currentActivities] : [];
    } else if (!Array.isArray(currentActivities)) {
      currentActivities = [];
    }

    const newActivities = [...(currentActivities as string[])];
    newActivities[actIndex] = value;
    updatedEducation[eduIndex] = {
      ...updatedEducation[eduIndex],
      activities: newActivities,
    };
    updateSection("education", updatedEducation);
  };

  const getStringValue = (
    edu: Record<string, unknown>,
    key: string
  ): string => {
    const value = edu[key];
    return typeof value === "string" ? value : "";
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          {t("editor.education.title")}
        </h3>
        <p className="body-text text-gray-600 mb-4">
          {t("editor.education.description")}
        </p>
      </div>

      <div className="space-y-6">
        {education.map((edu: Record<string, unknown>, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                {t("editor.education.title")} {index + 1}
              </h4>
              <button
                onClick={() => removeEducation(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                {t("editor.education.remove")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.education.school")} *
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, "school")}
                  onChange={(e) =>
                    updateEducation(index, "school", e.target.value)
                  }
                  placeholder={t("editor.education.schoolPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.education.degree")} *
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, "degree")}
                  onChange={(e) =>
                    updateEducation(index, "degree", e.target.value)
                  }
                  placeholder={t("editor.education.degreePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.education.fieldOfStudy")}
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, "field_of_study")}
                  onChange={(e) =>
                    updateEducation(index, "field_of_study", e.target.value)
                  }
                  placeholder={t("editor.education.fieldPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.education.endDate")}
                </label>
                <input
                  type="number"
                  value={getStringValue(edu, "graduation_date")}
                  onChange={(e) =>
                    updateEducation(index, "graduation_date", e.target.value)
                  }
                  placeholder="2023"
                  min="1950"
                  max="2030"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 ${
                    dateErrors[index]
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.education.gpa")}
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, "gpa")}
                  onChange={(e) =>
                    updateEducation(index, "gpa", e.target.value)
                  }
                  placeholder={t("editor.education.gpaPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.education.relevantCoursework")}
                </label>
                <textarea
                  value={getStringValue(edu, "relevant_coursework")}
                  onChange={(e) =>
                    updateEducation(
                      index,
                      "relevant_coursework",
                      e.target.value
                    )
                  }
                  placeholder={t(
                    "editor.education.relevantCourseworkPlaceholder"
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 min-h-[80px]"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("editor.education.activities")}
              </label>
              <div className="space-y-2">
                {(Array.isArray(edu.activities)
                  ? edu.activities
                  : typeof edu.activities === "string" && edu.activities
                  ? [edu.activities]
                  : []
                ).map((activity: string, actIndex: number) => (
                  <div key={actIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) =>
                        updateActivity(index, actIndex, e.target.value)
                      }
                      placeholder={t("editor.education.activitiesPlaceholder")}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    />
                    <button
                      onClick={() => removeActivity(index, actIndex)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addActivity(index)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  + {t("editor.education.addActivity")}
                </button>
              </div>
            </div>

            {dateErrors[index] && (
              <div className="mt-3">
                <ValidationMessage type="error" message={dateErrors[index]!} />
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addEducation}
          className="w-full border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 rounded-lg p-4 transition-colors duration-200 font-medium"
        >
          + {t("editor.education.addEducation")}
        </button>
      </div>
    </div>
  );
}

// Export validation function for use in navigation
export function validateEducationStep(
  education: Record<string, unknown>[]
): boolean {
  const currentYear = new Date().getFullYear();

  for (const edu of education) {
    const graduationDate = String(edu.graduation_date || "");

    if (graduationDate) {
      const year = parseInt(graduationDate, 10);

      if (isNaN(year) || year < 1950 || year > currentYear + 10) {
        return false;
      }
    }
  }

  return true;
}
