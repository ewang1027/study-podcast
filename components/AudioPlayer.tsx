"use client";

import { useRef, useState, useEffect } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  onAnalyser: (node: AnalyserNode | null) => void;
}

const SPEEDS = [1, 1.25, 1.5, 2] as const;

export default function AudioPlayer({ audioUrl, onAnalyser }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null!);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Update audio src when url changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
  }, [audioUrl]);

  function initAudioContext() {
    if (ctxRef.current) return;
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    sourceRef.current = source;
    analyserRef.current = analyser;
    onAnalyser(analyser);
  }

  async function togglePlay() {
    initAudioContext();
    if (ctxRef.current?.state === "suspended") {
      await ctxRef.current.resume();
    }
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  function handleStop() {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
  }

  function cycleSpeed() {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    audioRef.current.playbackRate = SPEEDS[next];
  }

  function handleTimeUpdate() {
    const el = audioRef.current;
    if (el.duration) setProgress(el.currentTime / el.duration);
  }

  function handleLoadedMetadata() {
    setDuration(audioRef.current.duration);
  }

  function handleEnded() {
    setIsPlaying(false);
    setProgress(0);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const ratio = parseFloat(e.target.value);
    audioRef.current.currentTime = ratio * audioRef.current.duration;
    setProgress(ratio);
  }

  function formatTime(secs: number) {
    if (!isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-[420px] max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl bg-black/70 backdrop-blur border border-white/15 p-4 flex flex-col gap-3">
        {/* Title */}
        <p className="text-white/60 text-xs font-medium text-center tracking-wider uppercase">
          Study Podcast
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs w-9 text-right">
            {formatTime(progress * duration)}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 accent-blue-400 cursor-pointer"
          />
          <span className="text-white/40 text-xs w-9">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Stop */}
          <button
            onClick={handleStop}
            className="text-white/50 hover:text-white/90 transition-colors"
            title="Stop"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="4" width="12" height="12" rx="2" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
                <rect x="3" y="2" width="4" height="14" rx="1.5" />
                <rect x="11" y="2" width="4" height="14" rx="1.5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
                <path d="M5 3l10 6-10 6V3z" />
              </svg>
            )}
          </button>

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="text-white/50 hover:text-white/90 transition-colors text-xs font-bold w-9 text-center"
            title="Playback speed"
          >
            {SPEEDS[speedIdx]}×
          </button>

          {/* Download */}
          <a
            href={audioUrl}
            download="study_podcast.mp3"
            className="text-white/50 hover:text-white/90 transition-colors"
            title="Download MP3"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 13l-4-4h3V3h2v6h3l-4 4z" />
              <path d="M4 15h12v1.5H4z" />
            </svg>
          </a>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="auto"
        />
      </div>
    </div>
  );
}
