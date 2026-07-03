"use client";

import { useState } from "react";

export default function BookCoverImage({
  apiUrl,
  fallbackUrl,
  alt = "",
  className = "absolute inset-0 w-full h-full object-cover",
}: {
  apiUrl?: string | null;
  fallbackUrl?: string | null;
  alt?: string;
  className?: string;
}) {
  const sources = [apiUrl, fallbackUrl].filter((s): s is string => Boolean(s));
  const [index, setIndex] = useState(0);

  const src = sources[index];
  if (!src) return null;

  return <img src={src} alt={alt} className={className} onError={() => setIndex((i) => i + 1)} />;
}
