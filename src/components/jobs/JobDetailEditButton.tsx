"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import AddJobModal from "./AddJobModal";
import type { JobCard } from "./KanbanBoard";

interface JobDetailEditButtonProps {
  job: JobCard;
  /** Visual variant of the trigger */
  variant?: "button" | "link";
  label?: string;
}

export default function JobDetailEditButton({
  job,
  variant = "button",
  label = "Sửa job",
}: JobDetailEditButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "button" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shrink-0"
        >
          <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
          {label}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-blue-500 hover:underline text-sm"
        >
          {label}
        </button>
      )}

      <AddJobModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editJob={job}
        onJobAdded={() => {}}
        onJobUpdated={() => {
          setIsOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
