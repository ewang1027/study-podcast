"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import DropZone from "@/components/DropZone";
import TranscriptPanel from "@/components/TranscriptPanel";
import AudioPlayer from "@/components/AudioPlayer";

// Load Scene client-only (Three.js requires browser APIs)
const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export type AppState = "idle" | "uploading" | "generating" | "synthesizing" | "ready";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [scriptText, setScriptText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Please upload a file under 20 MB.");
      return;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setError(null);
    setScriptText("");
    setAudioUrl(null);
    setAnalyser(null);
    setAppState("uploading");

    try {
      // 1. Upload + stream script generation
      setAppState("generating");
      const formData = new FormData();
      formData.append("file", file);

      const scriptRes = await fetch("/api/generate-script", {
        method: "POST",
        body: formData,
      });

      if (!scriptRes.ok) throw new Error(`Script generation failed: ${scriptRes.statusText}`);
      if (!scriptRes.body) throw new Error("No response body");

      const reader = scriptRes.body.getReader();
      const decoder = new TextDecoder();
      let fullScript = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullScript += chunk;
        setScriptText(fullScript);
      }

      // 2. Synthesize audio
      setAppState("synthesizing");
      const audioRes = await fetch("/api/synthesize-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: fullScript }),
      });

      if (!audioRes.ok) throw new Error(`Audio synthesis failed: ${audioRes.statusText}`);

      const blob = await audioRes.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setAppState("ready");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState("idle");
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D background */}
      <Scene appState={appState} analyser={analyser} />

      {/* Title */}
      {appState === "idle" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
          <h1 className="text-white/90 text-2xl font-semibold tracking-widest uppercase">
            Study Podcast
          </h1>
          <p className="text-white/30 text-sm mt-1">
            Upload a study guide. Get a podcast.
          </p>
        </div>
      )}

      {/* Status badge during processing */}
      {(appState === "uploading" || appState === "generating" || appState === "synthesizing") && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur border border-white/10 px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-white/70 text-sm">
              {appState === "uploading" && "Reading file…"}
              {appState === "generating" && "Writing your podcast script…"}
              {appState === "synthesizing" && "Synthesizing audio…"}
            </span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 max-w-md w-full px-4">
          <div className="rounded-xl bg-red-900/70 backdrop-blur border border-red-500/30 px-4 py-3 text-red-200 text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Overlay for drag-and-drop / idle prompt */}
      <DropZone onFile={handleFile} appState={appState} />

      {/* Transcript panel */}
      <TranscriptPanel scriptText={scriptText} appState={appState} />

      {/* Audio player */}
      {appState === "ready" && audioUrl && (
        <AudioPlayer audioUrl={audioUrl} onAnalyser={setAnalyser} />
      )}
    </div>
  );
}
