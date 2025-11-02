"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./BlockNoteEditor.css";

interface BlockNoteEditorProps {
  // Markdown string representing the editor content
  value: string;
  // onChange will receive Markdown (lossy) to preserve structure like headings and lists
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

export default function BlockNoteEditor({
  value,
  onChange,
  className = "",
}: BlockNoteEditorProps) {
  const isUpdatingFromProps = useRef(false);

  // Create editor instance (content will be set after mount to support Markdown parsing)
  const editor = useCreateBlockNote();

  // Handle editor changes
  useEditorChange(
    useCallback(
      (editor) => {
        if (isUpdatingFromProps.current) {
          return;
        }

        // Convert current document to Markdown (lossy) to preserve structure
        const markdown = editor.blocksToMarkdownLossy(editor.document);
        onChange(markdown);
      },
      [onChange]
    ),
    editor
  );

  // Update editor content when value prop changes
  useEffect(() => {
    if (value === undefined) return;
    // Convert incoming Markdown to blocks; if parsing fails, fallback to plain paragraph
    const incomingMarkdown = value || "";

    const currentMarkdown = editor.blocksToMarkdownLossy(editor.document);
    if (currentMarkdown.trim() === incomingMarkdown.trim()) return;

    isUpdatingFromProps.current = true;
    try {
      const parsed = editor.tryParseMarkdownToBlocks(incomingMarkdown);
      const newBlocks: Block[] = (parsed && Array.isArray(parsed) && parsed.length > 0)
        ? (parsed as Block[])
        : [
            {
              type: "paragraph",
              content: incomingMarkdown
                ? [{ type: "text", text: incomingMarkdown, styles: {} }]
                : [],
            } as unknown as Block,
          ];

      editor.replaceBlocks(editor.document, newBlocks);
    } finally {
      // Reset the flag after a short delay to allow BlockNote to process updates
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 100);
    }
  }, [value, editor]);

  return (
    <div className={`blocknote-editor-container h-full flex flex-col ${className}`}>
      <BlockNoteView
        editor={editor}
        theme="light"
        className="flex-1 border border-gray-300 rounded-lg overflow-y-auto"
        sideMenu={true}
        slashMenu={true}
      />
    </div>
  );
}
