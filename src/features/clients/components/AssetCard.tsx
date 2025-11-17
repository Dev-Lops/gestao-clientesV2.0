"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface AssetCardProps {
  title: string;
  thumb?: string | undefined;
  palette?: string[] | undefined;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function AssetCard({ title, thumb, palette, selected, onToggleSelect }: AssetCardProps) {
  return (
    <div className="relative p-2 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col items-start">
      {typeof selected !== "undefined" && (
        <button aria-label="Selecionar asset" onClick={onToggleSelect} className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border bg-white flex items-center justify-center ${selected ? "ring-2 ring-blue-500" : ""}`}>
          {selected ? "✓" : ""}
        </button>
      )}
      <div className="w-full h-20 bg-slate-100 rounded overflow-hidden mb-2 flex items-center justify-center relative">
        {thumb ? (
          <Image src={thumb} alt={title} fill className="object-cover" sizes="320px" />
        ) : (
          <div className="text-slate-400 text-sm">No preview</div>
        )}
      </div>
      <div className="w-full flex items-center justify-between">
        <div className="text-sm truncate">{title}</div>
        <Button size="sm" variant="ghost">...</Button>
      </div>
      {palette && palette.length > 0 && (
        <div className="flex gap-1 mt-2">
          {palette.map((c) => (
            <svg key={c} className="w-6 h-6 rounded" viewBox="0 0 16 16" role="img" aria-label={c}>
              <title>{c}</title>
              <rect width="16" height="16" fill={c} rx="3" ry="3" />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
}
