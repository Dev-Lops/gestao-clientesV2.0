"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";

interface UploadItem {
  id: string;
  file: File;
  previewUrl?: string | null;
  colors?: string[];
  progress: number;
  status: "idle" | "uploading" | "done" | "error";
  error?: string | null;
}

interface MediaUploadResult {
  id?: string;
  url?: string;
  thumbUrl?: string;
  title?: string;
  fileName?: string;
  mimeType?: string;
  fileKey?: string;
  colors?: string[];
}

interface UploaderProps {
  clientId: string;
  onUploaded?: (res: MediaUploadResult) => void;
}

const isVideo = (file: File) => file.type.startsWith("video/") || !!file.name.match(/\.(mp4|mov|avi|webm|mkv|flv|mpeg)$/i);
const isImage = (file: File) => file.type.startsWith("image/") || !!file.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|tiff)$/i);

async function generateVideoThumbnail(file: File): Promise<string | null> {
  const objUrl = URL.createObjectURL(file);
  return await new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = objUrl;
    video.muted = true;
    video.playsInline = true;
    const cleanup = () => {
      video.pause();
      video.src = "";
      video.remove();
      URL.revokeObjectURL(objUrl);
    };
    video.addEventListener("loadeddata", () => {
      const seekTo = Math.min(1, Math.floor(video.duration / 2));
      const handleSeeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL("image/png");
          cleanup();
          resolve(data);
        } catch {
          cleanup();
          resolve(null);
        }
      };
      video.currentTime = seekTo;
      video.addEventListener("seeked", handleSeeked, { once: true });
    });
    video.addEventListener("error", () => {
      cleanup();
      resolve(null);
    });
  });
}

async function extractColorsFromImage(src: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new globalThis.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = 40;
      const h = 40;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const counts: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 51) * 51; // reduce to 6 levels
        const g = Math.round(data[i + 1] / 51) * 51;
        const b = Math.round(data[i + 2] / 51) * 51;
        const key = ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
        counts[key] = (counts[key] || 0) + 1;
      }
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const top = entries.slice(0, 5).map((e) => `#${e[0]}`);
      resolve(top);
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
}

export default function Uploader({ clientId, onUploaded }: UploaderProps) {
  const [queue, setQueue] = useState<UploadItem[]>([]);

  useEffect(() => {
    return () => {
      // cleanup blob urls
      for (const it of queue) {
        if (it.previewUrl && it.previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(it.previewUrl);
          } catch { }
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const newItems: UploadItem[] = [];
    for (const f of arr) {
      let preview: string | null = null;
      let colors: string[] | undefined = undefined;
      try {
        if (isVideo(f)) {
          preview = await generateVideoThumbnail(f);
          if (preview) colors = await extractColorsFromImage(preview);
        } else if (isImage(f)) {
          preview = URL.createObjectURL(f);
          try {
            colors = await extractColorsFromImage(preview as string);
          } catch {
            colors = undefined;
          }
        } else {
          preview = null;
        }
      } catch {
        preview = URL.createObjectURL(f);
      }
      const it: UploadItem = {
        id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        previewUrl: preview || null,
        colors,
        progress: 0,
        status: "idle",
        error: null,
      };
      newItems.push(it);
    }
    setQueue((q) => [...newItems, ...q]);
  };

  const uploadOne = (it: UploadItem) => {
    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      const url = `/api/clients/${clientId}/media/upload`;
      xhr.open("POST", url);
      xhr.responseType = "json";
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setQueue((q) => q.map(x => x.id === it.id ? { ...x, progress: pct } : x));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const media: MediaUploadResult = xhr.response;
          setQueue((q) => q.map(x => x.id === it.id ? { ...x, status: 'done', progress: 100, previewUrl: media.thumbUrl ?? x.previewUrl } : x));
          onUploaded?.(xhr.response);
        } else {
          setQueue((q) => q.map(x => x.id === it.id ? { ...x, status: 'error', error: 'Upload failed' } : x));
        }
        resolve();
      };
      xhr.onerror = () => {
        setQueue((q) => q.map(x => x.id === it.id ? { ...x, status: 'error', error: 'Network error' } : x));
        resolve();
      };
      const fd = new FormData();
      fd.append("file", it.file);
      fd.append("title", it.file.name);
      fd.append("isLogo", "true"); // Marca como logo para ir para pasta Logos
      if (it.colors && it.colors.length) {
        fd.append("colors", JSON.stringify(it.colors));
      }
      setQueue((q) => q.map(x => x.id === it.id ? { ...x, status: 'uploading' } : x));
      xhr.send(fd);
    });
  };

  const processQueue = async () => {
    // process in order (oldest first)
    for (const it of [...queue].reverse()) {
      if (it.status === 'done') continue;
      await uploadOne(it);
    }
    // clear done items and revoke object urls
    for (const it of queue) {
      if (it.previewUrl && it.previewUrl.startsWith("blob:")) {
        try { URL.revokeObjectURL(it.previewUrl); } catch { }
      }
    }
    setQueue([]);
  };

  const removeItem = (id: string) => {
    setQueue((q) => {
      const found = q.find(x => x.id === id);
      if (found && found.previewUrl && found.previewUrl.startsWith("blob:")) {
        try { URL.revokeObjectURL(found.previewUrl); } catch { }
      }
      return q.filter(x => x.id !== id);
    });
  };

  return (
    <div className="p-3 border rounded studio-border studio-bg studio-radius">
      <div className="mb-2">
        <label htmlFor="branding-uploader" className="block text-sm font-medium mb-2">Enviar Arquivos</label>
        <input id="branding-uploader" title="Selecionar arquivos" type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} className="block w-full text-sm text-slate-700" />
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden relative">
                {it.previewUrl ? (
                  <Image src={it.previewUrl} alt={it.file.name} fill className="object-cover" sizes="48px" />
                ) : null}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-sm">{it.file.name}</div>
                  <div className="text-xs text-slate-500">{it.status}</div>
                </div>
                <div className="mt-1">
                  <progress value={it.progress} max={100} className="w-full h-2 appearance-none" />
                </div>
                {it.colors && it.colors.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {it.colors.map((c) => (
                      <svg key={c} className="studio-palette-swatch" viewBox="0 0 16 16" role="img" aria-label={c}>
                        <title>{c}</title>
                        <rect width="16" height="16" fill={c} rx="3" ry="3" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Button size="sm" variant="ghost" onClick={() => removeItem(it.id)}>Remover</Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={processQueue}>Enviar Todos</Button>
          </div>
        </div>
      )}
    </div>
  );
}
