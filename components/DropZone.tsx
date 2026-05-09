"use client";

import { useRef, useState } from "react";
import type { AppState } from "@/app/page";

interface DropZoneProps {
  onFile: (file: File) => void;
  appState: AppState;
}

const ACCEPTED = [".pdf", ".txt", ".md", "text/plain", "text/markdown", "application/pdf"];

function isAccepted(file: File): boolean {
  return (
    ACCEPTED.some((t) => file.type === t) ||
    ACCEPTED.some((ext) => ext.startsWith(".") && file.name.endsWith(ext))
  );
}

export default function DropZone({ onFile, appState }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isAccepted(file)) onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  }

  const showPrompt = appState === "idle";

  return (
    <div
      style={{ position: "absolute", inset: 0, pointerEvents: "all" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showPrompt && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => inputRef.current?.click()}
            className="group flex flex-col items-center gap-4 cursor-pointer"
          >
            <div
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-12 py-10 transition-all duration-200
                ${isDragging
                  ? "border-blue-400 bg-blue-900/30 scale-105"
                  : "border-white/20 bg-black/30 hover:border-white/40 hover:bg-black/40"
                }`}
            >
              {/* Mic icon */}
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-70 group-hover:opacity-100 transition-opacity">
                <rect x="17" y="4" width="14" height="22" rx="7" fill="#4a90d9" />
                <path d="M10 24c0 7.732 6.268 14 14 14s14-6.268 14-14" stroke="#88aaff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <line x1="24" y1="38" x2="24" y2="44" stroke="#88aaff" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="44" x2="30" y2="44" stroke="#88aaff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <p className="text-white/80 text-lg font-medium tracking-wide">
                drop your study guide here
              </p>
              <p className="text-white/40 text-sm">PDF, TXT, or Markdown · click to browse</p>
            </div>
          </button>
        </div>
      )}

      {isDragging && !showPrompt && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400/50 rounded-none pointer-events-none" />
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
