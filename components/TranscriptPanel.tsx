"use client";

import { useEffect, useRef } from "react";
import type { AppState } from "@/app/page";

interface TranscriptPanelProps {
  scriptText: string;
  appState: AppState;
}

export default function TranscriptPanel({ scriptText, appState }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visible = appState === "generating" || appState === "synthesizing" || appState === "ready";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [scriptText]);

  if (!visible) return null;

  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const listenMins = Math.ceil(wordCount / 140);

  const statusLabel =
    appState === "generating"
      ? "Generating script…"
      : appState === "synthesizing"
      ? "Synthesizing audio…"
      : "Script ready";

  return (
    <div className="fixed top-4 right-4 w-80 flex flex-col gap-2 z-10">
      <div className="rounded-xl bg-black/60 backdrop-blur border border-white/10 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {appState !== "ready" && (
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          )}
          <span className="text-white/70 text-xs font-medium">{statusLabel}</span>
        </div>
        <div className="text-white/40 text-xs">
          {wordCount > 0 && `${wordCount} words · ~${listenMins} min`}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="rounded-xl bg-black/60 backdrop-blur border border-white/10 p-4 max-h-72 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}
      >
        {scriptText ? (
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{scriptText}</p>
        ) : (
          <p className="text-white/30 text-sm italic">Script will appear here…</p>
        )}
      </div>
    </div>
  );
}
