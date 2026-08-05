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
  const cleanSrc = src.trim();

  // 1. Absolute external HTTP/HTTPS URLs
  if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")) {
    return cleanSrc;
  }

  // 2. Static uploads directory served directly by frontend CDN
  if (cleanSrc.startsWith("/uploads/")) {
    return cleanSrc;
  }

  // 3. Supabase Storage paths
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqwpwawpmndewyxmvpju.supabase.co";
  if (cleanSrc.startsWith("storage/v1")) {
    return `${supabaseUrl}/${cleanSrc}`;
  }

  // 4. Relative backend API paths
  if (cleanSrc.startsWith("/static")) {
    return `${API_BASE_URL}${cleanSrc}`;
  }

  // 5. Default fallback: Supabase Storage public bucket
  if (!cleanSrc.startsWith("/")) {
    return `${supabaseUrl}/storage/v1/object/public/products/${cleanSrc}`;
  }

  return `${API_BASE_URL}${cleanSrc}`;
}

export default function ProductImage({
  src,
  alt,
  className = "w-full h-full object-contain",
  code
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const formattedUrl = formatImageUrl(src);

  if (!formattedUrl || hasError) {
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
      src={formattedUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
