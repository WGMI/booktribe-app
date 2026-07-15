"use client";

import { useEffect, useRef, useState } from "react";
import { BarcodeDetector } from "barcode-detector/ponyfill";
import {
  searchOpenLibraryByIsbn,
  extractBookFromCover,
  extractIsbnFromPhoto,
} from "@/lib/actions";

type OLResult = {
  key: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  publishYear: number | null;
  genre: string | null;
};

type Props = {
  onResults: (results: OLResult[], via: "barcode" | "cover") => void;
  onCancel: () => void;
};

type Status =
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "looking-up"; label: string }
  | { kind: "no-camera" }
  | { kind: "error"; message: string };

const MAX_EDGE = 1024;

// Printed-number fallback: if the barcode won't decode, OCR a frame for the
// digits printed next to the bars. Attempts are capped — each one is a
// billable Vision call.
const FIRST_NUMBER_READ_MS = 3500;
const NUMBER_READ_SPACING_MS = 5000;
const MAX_NUMBER_READS = 3;

/** Downscale to MAX_EDGE and return raw base64 (no data: prefix). */
function frameToBase64(source: HTMLVideoElement | HTMLImageElement): string | null {
  const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  if (!srcW || !srcH) return null;

  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75).split(",")[1] ?? null;
}

export default function BookScanner({ onResults, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  const numberReadBusyRef = useRef(false);
  const numberReadsRef = useRef(0);
  const nextNumberReadAtRef = useRef(Infinity);
  const [readingNumber, setReadingNumber] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "starting" });

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus({ kind: "no-camera" });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus({ kind: "scanning" });
        nextNumberReadAtRef.current = Date.now() + FIRST_NUMBER_READ_MS;

        const detector = new BarcodeDetector({ formats: ["ean_13"] });
        interval = setInterval(async () => {
          const v = videoRef.current;
          if (!v || v.readyState < 2 || busyRef.current || doneRef.current) return;
          try {
            const barcodes = await detector.detect(v);
            const isbn = barcodes
              .map((b) => b.rawValue)
              .find((raw) => /^97[89]\d{10}$/.test(raw));
            if (isbn) {
              await handleIsbn(isbn);
              return;
            }
          } catch {
            // detection on a partial frame can throw — keep scanning
          }

          // Barcode not decoding yet — try reading the printed ISBN digits
          // in the background while the barcode loop keeps running
          if (
            !numberReadBusyRef.current &&
            numberReadsRef.current < MAX_NUMBER_READS &&
            Date.now() >= nextNumberReadAtRef.current
          ) {
            void tryReadPrintedNumber(v);
          }
        }, 300);
      } catch {
        if (!cancelled) setStatus({ kind: "no-camera" });
      }
    }

    async function handleIsbn(isbn: string) {
      if (busyRef.current || doneRef.current) return;
      busyRef.current = true;
      setStatus({ kind: "looking-up", label: "Barcode found — looking up ISBN..." });
      try {
        const results = await searchOpenLibraryByIsbn(isbn);
        if (results.length > 0 && !doneRef.current) {
          doneRef.current = true;
          onResults(results, "barcode");
          return;
        }
        setStatus({
          kind: "error",
          message: "No Open Library match for this barcode. Try snapping the cover instead.",
        });
      } catch {
        setStatus({ kind: "error", message: "Lookup failed. Check your connection." });
      } finally {
        busyRef.current = false;
      }
    }

    // Silent background fallback: OCR the frame for the digits printed under
    // the barcode. Failures just let the barcode loop keep scanning.
    async function tryReadPrintedNumber(video: HTMLVideoElement) {
      numberReadBusyRef.current = true;
      numberReadsRef.current += 1;
      nextNumberReadAtRef.current = Date.now() + NUMBER_READ_SPACING_MS;
      setReadingNumber(true);

      try {
        const base64 = frameToBase64(video);
        if (!base64) return;
        const result = await extractIsbnFromPhoto(base64);
        if (result.ok) {
          if (!busyRef.current && !doneRef.current) {
            doneRef.current = true;
            onResults(result.results, "barcode");
          }
        } else if (result.notConfigured) {
          // Vision isn't set up — stop burning attempts
          numberReadsRef.current = MAX_NUMBER_READS;
        }
      } catch {
        // network hiccup — the barcode loop is still running
      } finally {
        numberReadBusyRef.current = false;
        setReadingNumber(false);
      }
    }

    start();
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // onResults is stable for the lifetime of the modal; re-running would restart the camera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scanCover(base64: string | null) {
    if (!base64) {
      setStatus({ kind: "error", message: "Couldn't capture the photo. Try again." });
      return;
    }
    busyRef.current = true;
    setStatus({ kind: "looking-up", label: "Reading the cover..." });
    try {
      const result = await extractBookFromCover(base64);
      if (result.ok) {
        doneRef.current = true;
        onResults(result.results, "cover");
        return;
      }
      setStatus({ kind: "error", message: result.error });
    } catch {
      setStatus({ kind: "error", message: "Cover scan failed. Check your connection." });
    } finally {
      busyRef.current = false;
    }
  }

  function snapCover() {
    const video = videoRef.current;
    if (!video) return;
    scanCover(frameToBase64(video));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const img = new window.Image();
    img.onload = () => {
      scanCover(frameToBase64(img));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setStatus({ kind: "error", message: "Couldn't read that image." });
    img.src = URL.createObjectURL(file);
  }

  const busy = status.kind === "looking-up";
  const hasCamera = status.kind !== "no-camera";

  return (
    <div className="p-6">
      {hasCamera ? (
        <div className="relative rounded-xl overflow-hidden bg-[#1b1c19] aspect-[3/4]">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Barcode target guide */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-white/70 rounded-lg pointer-events-none" />
          {busy && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm font-medium px-6 text-center">
                {status.kind === "looking-up" ? status.label : ""}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-[#f5f3ee] border border-[#dbc1bd] p-8 text-center">
          <p className="text-3xl mb-2">📷</p>
          <p className="text-sm text-[#554240]">
            Camera isn&apos;t available here. Take a photo of the cover instead.
          </p>
        </div>
      )}

      <p className="text-xs text-[#88726f] text-center mt-3 min-h-4">
        {status.kind === "starting" && "Starting camera..."}
        {status.kind === "scanning" &&
          (readingNumber
            ? "Also trying the printed ISBN number..."
            : "Point the camera at the barcode on the back cover")}
        {status.kind === "error" && <span className="text-[#ba1a1a]">{status.message}</span>}
      </p>

      <div className="mt-4 space-y-2">
        {hasCamera ? (
          <button
            onClick={snapCover}
            disabled={busy || status.kind === "starting"}
            className="w-full bg-[#3b6934] text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            No barcode? Snap the cover
          </button>
        ) : (
          <label className="w-full flex items-center justify-center bg-[#3b6934] text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer">
            {busy ? "Reading the cover..." : "Take a photo of the cover"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={busy}
              className="hidden"
            />
          </label>
        )}
        <button
          onClick={onCancel}
          disabled={busy}
          className="w-full border-2 border-[#dbc1bd] text-[#554240] py-3 rounded-lg font-semibold text-sm hover:border-[#85332a] hover:text-[#85332a] transition-colors disabled:opacity-60"
        >
          Back to search
        </button>
      </div>
    </div>
  );
}
