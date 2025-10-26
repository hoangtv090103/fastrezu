"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./BlockNoteEditor.css";

interface BlockNoteEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function BlockNoteEditor({
  value,
  onChange,
  placeholder = "Văn bản đã trích xuất sẽ xuất hiện ở đây...",
  className = "",
}: BlockNoteEditorProps) {
  const isUpdatingFromProps = useRef(false);

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: value ? [{ type: "paragraph", content: [{ type: "text", text: value, styles: {} }] }] : undefined,
  });

  // Convert blocks to plain text
  const blocksToPlainText = useCallback((blocks: any[]) => {
    return blocks
      .map((block) => {
        if (block.type === "paragraph" && block.content) {
          return block.content
            .map((item: any) => (item.type === "text" ? item.text : ""))
            .join("");
        }
        return "";
      })
      .join("\n")
      .trim();
  }, []);

  // Handle editor changes
  useEditorChange(
    useCallback(
      (editor) => {
        if (isUpdatingFromProps.current) {
          return;
        }

        // Get the current content as plain text
        const blocks = editor.document;
        const plainText = blocksToPlainText(blocks);
        onChange(plainText);
      },
      [onChange, blocksToPlainText]
    ),
    editor
  );

  // Update editor content when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      const currentBlocks = editor.document;
      const currentText = blocksToPlainText(currentBlocks);

      // Only update if the text is different to avoid infinite loops
      if (currentText !== value) {
        isUpdatingFromProps.current = true;
        
        editor.replaceBlocks(editor.document, [
          {
            type: "paragraph",
            content: value ? [{ type: "text", text: value, styles: {} }] : [],
          },
        ]);

        // Reset the flag after a short delay
        setTimeout(() => {
          isUpdatingFromProps.current = false;
        }, 100);
      }
    }
  }, [value, editor, blocksToPlainText]);

  return (
    <div className={`blocknote-editor-container h-full flex flex-col ${className}`}>
      <BlockNoteView
        editor={editor}
        theme="light"
        className="flex-1 border border-gray-300 rounded-lg overflow-y-auto"
      />
    </div>
  );
}
