"use client";
import { Button } from "@/components/ui/button";
import Uploader from "@/features/clients/components/Uploader";
import { logger } from "@/lib/logger";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useGoogleFont, { loadGoogleFont } from "../../hooks/useGoogleFont";
import FontAutocomplete from "./FontAutocomplete";

type SelectedFont = {
  name: string;
  loaded: boolean;
};

interface BrandingData {
  id?: string | number;
  fileUrl?: string | null;
  palette?: string[] | null;
  content?: string | Record<string, unknown> | null;
  description?: string | null;
}

interface BrandingPageProps {
  clientId: string;
  clientName?: string | null;
  initialBranding?: BrandingData | null;
}

export default function BrandingPage({ clientId, clientName, initialBranding }: BrandingPageProps) {

  // Initialize state from server-provided props so server and client render match.
  const _initialLogo = initialBranding?.fileUrl ?? null;
  const _initialPrimary =
    initialBranding && Array.isArray(initialBranding.palette) && initialBranding.palette[0]
      ? initialBranding.palette[0]
      : "#0b5fff";
  const _initialSecondary =
    initialBranding && Array.isArray(initialBranding.palette) && initialBranding.palette[1]
      ? initialBranding.palette[1]
      : "#f59e0b";
  const _initialSample = clientName ?? "Nome da Empresa";

  // parse initial fonts from initialBranding.content (if provided)
  let _initialFonts: SelectedFont[] = [];
  if (initialBranding?.content) {
    try {
      const content = typeof initialBranding.content === "string" ? JSON.parse(initialBranding.content) : initialBranding.content;
      if (content?.fonts && Array.isArray(content.fonts)) {
        _initialFonts = content.fonts.map((n: string) => ({ name: n, loaded: false }));
      }
    } catch {
      /* ignore parse errors */
    }
  }
  const _initialPalette = (_initialFonts && initialBranding?.palette && initialBranding.palette.length > 0) ? initialBranding.palette : [_initialPrimary, _initialSecondary];

  // State declarations
  const [logoUrl, setLogoUrl] = useState<string | null>(_initialLogo);
  const [palette, setPalette] = useState<string[]>(_initialPalette);
  const [colorToAdd, setColorToAdd] = useState<string>(palette[palette.length - 1] ?? '#000000');
  const [fontInput, setFontInput] = useState<string>('');
  const [fonts, setFonts] = useState<SelectedFont[]>(_initialFonts);
  const [sampleText] = useState<string>(_initialSample);
  const [fontToRemove, setFontToRemove] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Modal refs
  const modalRef = useRef<HTMLDivElement | null>(null);
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);

  // Clipboard helper
  function copyToClipboard(text: string, label?: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success(`${label ?? 'Valor'} copiado para área de transferência`))
        .catch(() => toast.error('Falha ao copiar'));
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        toast.success(`${label ?? 'Valor'} copiado`);
      } catch { toast.error('Falha ao copiar'); }
    }
  }

  // preload first font for page chrome (if any)
  useGoogleFont(fonts[0]?.name);
  // ensure previously loaded (from DB) fonts are fetched on mount
  useEffect(() => {
    fonts.forEach(f => {
      if (!f.loaded) {
        loadGoogleFont(f.name)
          .then(() => setFonts(s => s.map(x => x.name === f.name ? { ...x, loaded: true } : x)))
          .catch(() => {/* ignore */ });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // clientName is provided from server props (SSR) when available

  async function handleAddFont() {
    const name = fontInput.trim();
    if (!name) return;
    if (fonts.find((f) => f.name.toLowerCase() === name.toLowerCase())) {
      setFontInput("");
      return;
    }
    // optimistically add with loaded=false
    setFonts((s) => [{ name, loaded: false }, ...s]);
    setFontInput("");
    try {
      await loadGoogleFont(name);
      setFonts((s) => s.map((f) => (f.name === name ? { ...f, loaded: true } : f)));
    } catch {
      setFonts((s) => s.map((f) => (f.name === name ? { ...f, loaded: false } : f)));
    }
  }

  function handleRemoveFont(name: string) {
    // open confirmation modal
    setFontToRemove(name);
  }

  function confirmRemoveFont() {
    if (!fontToRemove) return;
    setFonts((s) => s.filter((f) => f.name !== fontToRemove));
    setFontToRemove(null);
  }

  function cancelRemoveFont() {
    setFontToRemove(null);
  }

  function moveFontUp(name: string) {
    setFonts((s) => {
      const i = s.findIndex((f) => f.name === name);
      if (i <= 0) return s;
      const copy = [...s];
      const tmp = copy[i - 1];
      copy[i - 1] = copy[i];
      copy[i] = tmp;
      return copy;
    });
  }

  function moveFontDown(name: string) {
    setFonts((s) => {
      const i = s.findIndex((f) => f.name === name);
      if (i === -1 || i >= s.length - 1) return s;
      const copy = [...s];
      const tmp = copy[i + 1];
      copy[i + 1] = copy[i];
      copy[i] = tmp;
      return copy;
    });
  }

  // Uploader will call `handleMediaUploaded` with the uploaded media
  interface MediaUploadResult {
    id?: string;
    url?: string;
    thumbUrl?: string;
    fileKey?: string;
    title?: string;
    mimeType?: string;
    colors?: string[];
  }

  // callback when Uploader finishes uploading a media item
  function handleMediaUploaded(res?: MediaUploadResult | null) {
    if (res?.url) {
      setLogoUrl(res.url);
      // Auto-apply colors extracted before upload if palette is minimal
      if (palette.length <= 2 && res.colors && res.colors.length > 0) {
        setPalette((prev) => {
          const merged = [...prev];
          res.colors!.forEach(c => { if (!merged.includes(c)) merged.push(c); });
          return merged.slice(0, 12); // limit total palette size
        });
        toast.success(`${res.colors.length} cores extraídas da logo`);
      }
    }
  }

  function handleReplaceLogo() {
    // attempt to open the file input inside the Uploader
    try {
      const el = document.getElementById('branding-uploader') as HTMLInputElement | null;
      if (el) {
        el.click();
        // ensure dropdown/focus
        el.focus();
        return;
      }
    } catch {
      // ignore
    }
    toast(`Abra o seletor de arquivos acima para substituir a logo`);
  }

  function handleRemoveLogo() {
    setLogoUrl(null);
    toast.success('Logo removida');
    // If we already have a saved branding entry, persist removal immediately
    // so reloads don't bring the old URL back.
    (async () => {
      try {
        if (initialBranding?.id) {
          await handleSave();
        }
      } catch (e) {
        console.error('Erro ao persistir remoção da logo', e);
      }
    })();
  }

  function addColor(hex: string) {
    const h = hex.trim();
    if (!h) return;
    // normalize to #xxxxxx
    const normalized = h.startsWith('#') ? h : `#${h}`;
    if (palette.includes(normalized)) {
      toast('Cor já adicionada');
      return;
    }
    setPalette((p) => [...p, normalized]);
    setColorToAdd(normalized);
    toast.success('Cor adicionada');
  }

  function removeColor(index: number) {
    setPalette((p) => p.filter((_, i) => i !== index));
    toast.success('Cor removida');
  }

  function moveColorLeft(index: number) {
    if (index <= 0) return;
    setPalette((p) => {
      const cp = [...p];
      const tmp = cp[index - 1];
      cp[index - 1] = cp[index];
      cp[index] = tmp;
      return cp;
    });
  }

  function moveColorRight(index: number) {
    setPalette((p) => {
      if (index >= p.length - 1) return p;
      const cp = [...p];
      const tmp = cp[index + 1];
      cp[index + 1] = cp[index];
      cp[index] = tmp;
      return cp;
    });
  }

  // Drag & drop reorder palette
  function reorderPalette(from: number, to: number) {
    setPalette((p) => {
      if (from === to || from < 0 || to < 0 || from >= p.length || to >= p.length) return p;
      const cp = [...p];
      const [item] = cp.splice(from, 1);
      cp.splice(to, 0, item);
      return cp;
    });
  }

  // Drag & drop reorder fonts
  function reorderFonts(from: number, to: number) {
    setFonts((list) => {
      if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
      const cp = [...list];
      const [item] = cp.splice(from, 1);
      cp.splice(to, 0, item);
      return cp;
    });
  }

  const onPaletteDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const onPaletteDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onPaletteDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    reorderPalette(from, idx);
  };

  const onFontDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const onFontDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onFontDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    reorderFonts(from, idx);
  };

  // Color extraction from logo image (server-side to avoid CORS)
  async function extractColorsFromLogo(url: string, count = 6): Promise<string[]> {
    try {
      const response = await fetch('/api/branding/extract-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao extrair cores');
      }

      const { colors } = await response.json();
      return colors.slice(0, count);
    } catch (error) {
      console.error('Erro ao extrair cores:', error);
      throw error;
    }
  }

  const handleManualExtract = useCallback(() => {
    if (!logoUrl) { toast.error('Adicione uma logo antes'); return; }
    setExtractingColors(true);
    logger.debug('Extraindo cores da logo', { logoUrl });
    extractColorsFromLogo(logoUrl, 6)
      .then(colors => {
        logger.debug('Cores extraídas da logo', { colors });
        if (colors.length) {
          setPalette(prev => {
            const merged = [...prev];
            colors.forEach(c => { if (!merged.includes(c)) merged.push(c); });
            return merged.slice(0, 12);
          });
          toast.success(`${colors.length} cores extraídas da logo`);
        } else {
          toast.warning('Nenhuma cor identificada na logo');
        }
      })
      .catch((err) => {
        console.error('Erro ao extrair cores:', err);
        toast.error('Falha ao extrair cores: ' + (err.message || 'Erro desconhecido'));
      })
      .finally(() => setExtractingColors(false));
  }, [logoUrl]);

  async function handleSave() {
    try {
      setSaving(true);
      const fileUrl: string | null = logoUrl ?? null;

      // `logoUrl` should be set by the Uploader; if not, fileUrl stays null

      const body = {
        title: sampleText,
        description: "Branding criado via editor",
        type: "branding",
        fileUrl,
        thumbUrl: null,
        palette,
        content: JSON.stringify({ fonts: fonts.map((f) => f.name) }),
      };

      // If we have an existing branding id, do a PATCH, otherwise POST
      const isUpdate = !!initialBranding?.id;
      const url = isUpdate
        ? `/api/clients/${clientId}/branding?brandingId=${encodeURIComponent(String(initialBranding.id))}`
        : `/api/clients/${clientId}/branding`;
      const method = isUpdate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const resp = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = resp?.error || resp?.message || "Erro ao salvar no servidor";
        console.error("Erro ao salvar branding", resp);
        toast.error(String(msg));
        return;
      }
      toast.success("Branding salvo com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao salvar branding. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function sanitizeName(n: string) {
    return n.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }

  const primaryCss = palette[0] ?? '#0b5fff';
  const secondaryCss = palette[1] ?? '#f59e0b';

  let dynamicCss = `
    .branding-dynamic { --brand-primary: ${primaryCss}; --brand-secondary: ${secondaryCss}; }
    .branding-dynamic .sample-primary { color: var(--brand-primary); }
    .branding-dynamic .sample-secondary { color: var(--brand-secondary); }
    .branding-dynamic .saveBtnDynamic { background: var(--brand-primary); color: white; }
    .branding-dynamic .saveBtnDynamic:hover { filter:brightness(.95); }
    .branding-dynamic .color-swatch-primary { background: var(--brand-primary); }
    .branding-dynamic .color-swatch-secondary { background: var(--brand-secondary); }
    .branding-dynamic .brand-font-loaded { color: #059669; }
  `;

  // add per-font rules (font-family + loaded color)
  for (const f of fonts) {
    const id = sanitizeName(f.name);
    // Apply font-family to the element that carries the brand-font-{id} class so
    // it affects both the preview title (when the class is on the same element)
    // and child elements (font cards where the brand class is on the parent).
    dynamicCss += `
      .branding-dynamic .brand-font-${id} { font-family: '${f.name}', sans-serif; }
      .branding-dynamic .brand-font-${id} .font-sample-text { font-family: '${f.name}', sans-serif; }
      .branding-dynamic .brand-font-${id} .font-status { color: ${f.loaded ? "#059669" : "#6b7280"}; }
      .branding-dynamic .brand-font-${id} .active-font-chip, .branding-dynamic .brand-font-${id}.active-font-chip { font-family: '${f.name}', sans-serif; }
    `;
  }

  // add per-palette swatch rules so we can avoid inline styles
  palette.forEach((c, i) => {
    const id = `palette-swatch-${i}`;
    dynamicCss += `
      .branding-dynamic .${id} { background: ${c}; }
    `;
  });

  const primaryFontObj = fonts[0];
  const primaryFontClass = primaryFontObj?.loaded ? `brand-font-${sanitizeName(primaryFontObj.name)}` : "";
  // (removed duplicate isEditing declaration during cleanup)

  // Modal accessibility: initial focus + ESC + focus trap
  useEffect(() => {
    if (!isEditing) return;
    const node = modalRef.current;
    if (!node) return;
    const focusableSelectors = '[data-focus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(focusableSelectors)).filter(el => !el.hasAttribute('disabled'));
    const first = initialFocusRef.current || focusables[0];
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
      } else if (e.key === 'Tab') {
        if (focusables.length === 0) return;
        const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey) {
          // backwards
          const prev = currentIndex <= 0 ? focusables[focusables.length - 1] : focusables[currentIndex - 1];
          prev.focus();
          e.preventDefault();
        } else {
          const next = currentIndex === focusables.length - 1 ? focusables[0] : focusables[currentIndex + 1];
          next.focus();
          e.preventDefault();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isEditing]);

  return (
    <div className={`branding-dynamic max-w-7xl mx-auto p-6`}>
      <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Configuração de Branding</h2>
        <Button onClick={() => setIsEditing(true)} className="rounded-md">Editar Branding</Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className=" border border-slate-200 rounded-xl px-8 py-10 shadow-sm">
          {/** Four column minimal preview layout */}
          <div className="grid gap-10 xl:gap-16 md:grid-cols-2 xl:grid-cols-3">
            {/* CORES */}
            <div>
              <h4 className="font-serif italic text-4xl mb-6 text-[#767c77] select-none">Cores</h4>
              <div className="flex items-end gap-4 flex-wrap mb-4" role="list">
                {palette.map((c, i) => (
                  <div
                    key={`${c}-${i}`}
                    className="group flex flex-col items-center gap-2"
                    role="listitem"
                    draggable
                    onDragStart={(e) => onPaletteDragStart(e, i)}
                    onDragOver={onPaletteDragOver}
                    onDrop={(e) => onPaletteDrop(e, i)}
                    aria-label={`Reordenar cor ${c}`}
                  >
                    <button
                      type="button"
                      onClick={() => copyToClipboard(c, 'Cor')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyToClipboard(c, 'Cor'); } }}
                      aria-label={`Copiar cor ${c}`}
                      className={`h-40 w-14 rounded-[28px] shadow-sm palette-swatch-${i} ring-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-transform group-hover:-translate-y-1 active:scale-95 border border-slate-200/40`}
                    />
                    <span className="text-[11px] font-mono text-slate-600 select-none">{c}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">Clique para copiar. Arraste para reordenar.</p>
            </div>
            {/* TIPOGRAFIA */}
            <div>
              <h4 className="font-serif italic text-4xl mb-6 text-[#767c77] select-none">Tipografia</h4>
              <div className="flex flex-col gap-4" role="list">
                {fonts.length === 0 && <div className="text-xs text-slate-500">Nenhuma fonte adicionada.</div>}
                {fonts.map((f, idx) => (
                  <div
                    key={f.name}
                    role="listitem"
                    className={`space-y-1 ${'brand-font-' + sanitizeName(f.name)}`}
                    draggable
                    onDragStart={(e) => onFontDragStart(e, idx)}
                    onDragOver={onFontDragOver}
                    onDrop={(e) => onFontDrop(e, idx)}
                    aria-label={`Reordenar fonte ${f.name}`}
                  >
                    <div className={`text-2xl font-semibold tracking-wide ${idx === 0 ? 'text-rose-400' : idx === 1 ? 'text-slate-500' : 'text-slate-600'}`}>{f.name.toLowerCase()}</div>
                    {idx === 0 && <div className="text-sm uppercase text-rose-300 font-medium tracking-wider">hero</div>}
                    {idx === 1 && <div className="text-sm text-slate-500 tracking-wide">corpo</div>}
                    {idx > 1 && <div className="text-xs text-slate-400">extra</div>}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">Arraste as fontes para definir prioridade.</p>
            </div>
            {/* LOGOMARCA */}
            <div>
              <h4 className="font-serif italic text-4xl mb-6 text-[#767c77] select-none">Logomarca</h4>
              <div className="aspect-square w-full max-w-[260px] bg-[#f3eded] border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <Image src={logoUrl} alt="logo" width={240} height={160} className="w-auto h-auto max-h-40 object-contain" style={{ height: 'auto' }} sizes="240px" />
                ) : (
                  <div className="text-xs text-slate-400">Sem logo</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Editing modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-6 overflow-auto" onClick={() => setIsEditing(false)}>
          <div ref={modalRef} className="bg-white rounded-xl w-full max-w-6xl p-6 shadow-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="branding-modal-title">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
              <h3 id="branding-modal-title" className="text-lg font-bold tracking-tight">Editar Branding</h3>
              <div className="flex items-center gap-2">
                <Button ref={initialFocusRef} data-focus onClick={handleSave} className="saveBtnDynamic text-white rounded-md px-4 py-2" disabled={saving} aria-busy={saving ? 'true' : 'false'}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => {
                  const data = { logo: logoUrl ?? null, palette, fonts: fonts.map((f) => f.name) };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'branding.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}>Exportar</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Fechar</Button>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <section className="space-y-4">
                  <header className="flex items-center justify-between">
                    <label htmlFor="branding-uploader" className="text-sm font-semibold">Logo</label>
                    {logoUrl && (
                      <div className="flex gap-2">
                        <button type="button" onClick={handleReplaceLogo} title="Substituir logo" className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Substituir</button>
                        <button type="button" onClick={handleRemoveLogo} title="Remover logo" className="text-xs px-2 py-1 text-red-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Remover</button>
                      </div>
                    )}
                  </header>
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <Uploader clientId={clientId} onUploaded={handleMediaUploaded} />
                    {logoUrl && (
                      <div className="mt-4 flex justify-center">
                        <div className="w-40 h-40 bg-white border border-slate-200 rounded-md flex items-center justify-center overflow-hidden">
                          <Image src={logoUrl} alt="logo-preview" width={160} height={160} className="object-contain w-full h-full" sizes="160px" />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
                <section className="space-y-4">
                  <header>
                    <h4 className="text-sm font-semibold mb-1">Cores</h4>
                    <p className="text-xs text-slate-500">Adicione, reordene e copie suas cores.</p>
                  </header>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input title="Escolher cor" aria-label="Escolher cor" type="color" value={colorToAdd} onChange={(e) => setColorToAdd(e.target.value)} className="w-10 h-10 p-0 border-0 rounded-md" />
                    <input title="Hex da cor" aria-label="Hex da cor" type="text" value={colorToAdd} onChange={(e) => setColorToAdd(e.target.value)} placeholder="#rrggbb" className="h-10 px-3 border rounded-md text-sm" />
                    <Button onClick={() => addColor(colorToAdd)}>Adicionar</Button>
                    {logoUrl && (
                      <Button variant="outline" disabled={extractingColors} onClick={handleManualExtract}>
                        {extractingColors ? 'Extraindo...' : 'Gerar da Logo'}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-6 items-end flex-wrap">
                    {palette.map((c, i) => (
                      <div
                        key={`${c}-${i}`}
                        className="group flex flex-col items-center gap-2"
                        aria-grabbed="false"
                      >
                        <div
                          className={`h-32 w-10 rounded-xl shadow-sm palette-swatch-${i} cursor-pointer active:scale-95 transition-transform`}
                          onClick={() => copyToClipboard(c, 'Cor')}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyToClipboard(c, 'Cor') } }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Copiar cor ${c}`}
                        />
                        <div className="text-[11px] flex items-center gap-2 text-slate-600">
                          <span className="font-mono select-none">{c}</span>
                          <button type="button" onClick={() => moveColorLeft(i)} title="Mover esquerda" className="text-xs px-1">◀</button>
                          <button type="button" onClick={() => moveColorRight(i)} title="Mover direita" className="text-xs px-1">▶</button>
                          <button type="button" onClick={() => removeColor(i)} title="Remover cor" className="text-xs text-red-600">✕</button>
                        </div>
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">Clique para copiar</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="space-y-8">
                <section className="space-y-4">
                  <header>
                    <h4 className="text-sm font-semibold mb-1">Tipografias</h4>
                    <p className="text-xs text-slate-500">Busque pelo nome da fonte e adicione à coleção.</p>
                  </header>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <FontAutocomplete
                        value={fontInput}
                        onChange={(v) => setFontInput(v)}
                        onSelect={(v) => { setFontInput(v); handleAddFont(); }}
                      />
                    </div>
                    <Button variant="outline" onClick={handleAddFont}>Adicionar</Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {fonts.length === 0 && (
                      <div className="col-span-full border border-dashed border-slate-200 rounded-lg p-6 bg-slate-50 text-sm text-slate-600">Nenhuma tipografia adicionada. Use o campo acima para adicionar fontes (ex.: Inter, Roboto).</div>
                    )}
                    {fonts.map((f) => {
                      const cname = `brand-font-${sanitizeName(f.name)}`;
                      return (
                        <div
                          key={f.name}
                          className={`relative border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition ${cname}`}
                          aria-grabbed="false"
                        >
                          <div className="flex items-start justify-between mb-3 gap-3">
                            <div className="space-y-1">
                              <div className="font-semibold text-sm">{f.name}</div>
                              <div className={`text-lg leading-snug font-medium ${cname}`}>Aa Bb Cc</div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center gap-2 text-[11px] ${f.loaded ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  <span className={`h-2 w-2 rounded-full ${f.loaded ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                  {f.loaded ? 'Carregada' : 'Carregando'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <button aria-label={`Mover ${f.name} para cima`} title="Mover para cima" type="button" onClick={() => moveFontUp(f.name)} className="text-[10px] px-2 py-1 rounded-md hover:bg-slate-100">▲</button>
                              <button aria-label={`Mover ${f.name} para baixo`} title="Mover para baixo" type="button" onClick={() => moveFontDown(f.name)} className="text-[10px] px-2 py-1 rounded-md hover:bg-slate-100">▼</button>
                              <button aria-label={`Remover ${f.name}`} type="button" onClick={() => handleRemoveFont(f.name)} className="text-[11px] text-red-600 hover:underline">Remover</button>
                            </div>
                          </div>
                          <div className={`text-sm ${primaryFontClass}`}>{sampleText}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* confirmation modal */}
      {fontToRemove && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={cancelRemoveFont}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Remover tipografia</h3>
            <p className="text-sm text-slate-600">Tem certeza que deseja remover a tipografia <strong>{fontToRemove}</strong>?</p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={cancelRemoveFont}>Cancelar</Button>
              <Button onClick={confirmRemoveFont}>Remover</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
