"use client";

import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  code?: string;
}

/**
 * Utility function to generate the correct public URL for product images.
 * Handles external URLs, Supabase Storage paths, and local API backend paths.
 */
export function formatImageUrl(src: string | null | undefined): string | null {
  if (!src || !src.trim()) return null;
  let cleanSrc = src.trim();

  // Filter out invalid placeholder strings
  if (["none", "null", "nan", "undefined"].includes(cleanSrc.toLowerCase())) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqwpwawpmndewyxmvpju.supabase.co";

  // 1. Convert temporary Signed URLs to permanent Public URLs and strip expiration tokens
  if (cleanSrc.includes(".supabase.co/storage/v1/object/sign/")) {
    cleanSrc = cleanSrc.replace("/storage/v1/object/sign/", "/storage/v1/object/public/").split("?")[0];
  }

  // 2. Absolute external HTTP/HTTPS URLs
  if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")) {
    if (cleanSrc.includes(".supabase.co")) {
      return cleanSrc.split("?")[0];
    }
    return cleanSrc;
  }

  // 3. Relative uploads directory -> point to API backend host
  if (cleanSrc.startsWith("/uploads/")) {
    return `${API_BASE_URL}${cleanSrc}`;
  }

  // 4. Supabase Storage relative paths
  if (cleanSrc.startsWith("storage/v1")) {
    const relativePath = cleanSrc.replace("/storage/v1/object/sign/", "/storage/v1/object/public/").split("?")[0];
    return `${supabaseUrl}/${relativePath}`;
  }

  // 5. Relative backend API paths
  if (cleanSrc.startsWith("/static")) {
    return `${API_BASE_URL}${cleanSrc}`;
  }

  // 6. Default fallback: Supabase Storage public bucket
  if (!cleanSrc.startsWith("/")) {
    const filename = cleanSrc.split("?")[0];
    return `${supabaseUrl}/storage/v1/object/public/products/${filename}`;
  }

  return `${API_BASE_URL}${cleanSrc}`;
}

export default function ProductImage({
  src,
  alt,
  className = "w-full h-full object-contain",
  code
}: ProductImageProps) {
  const [attempt, setAttempt] = useState(0);
  const formattedUrl = formatImageUrl(src);

  // If primary API URL fails, attempt fallback to relative frontend URL
  const currentSrc = attempt === 0 ? formattedUrl : (src?.startsWith("/") ? src : null);

  if (!currentSrc || attempt >= 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gray-50 p-2">
        <ShoppingBag className="w-6 h-6 stroke-[1.5] text-slate-300" />
        {code && (
          <span className="text-[9px] font-bold uppercase font-mono tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 mt-1 text-slate-500">
            {code}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => setAttempt((prev) => prev + 1)}
      loading="lazy"
    />
  );
}
