"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type GoogleFontFamily = string | { family: string; variants?: string[] };

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  onSelect?: (v: string) => void;
};

const COMMON_FONTS = [
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Poppins",
  "Lato",
  "Oswald",
  "Raleway",
  "Merriweather",
  "Playfair Display",
  "Source Sans Pro",
  "Nunito",
  "Ubuntu",
  "Inter",
  "PT Sans",
  "Rubik",
  "Josefin Sans",
  "Cabin",
  "Archivo",
  "Fira Sans",
  "Work Sans",
  "Bitter",
  "Arvo",
  "Noto Sans",
  "Hind",
  "Quicksand",
  "Oxygen",
  "Exo 2",
  "Inconsolata",
  "Mulish",
  "Karla",
  "Pacifico",
];

export default function FontAutocomplete({ value = "", onChange, onSelect }: Props) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [remoteFonts, setRemoteFonts] = useState<string[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [ariaMessage, setAriaMessage] = useState("");
  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pool = remoteFonts && remoteFonts.length ? remoteFonts : COMMON_FONTS;
    if (!term) return pool.slice(0, 12);
    // Prioritize startsWith matches, then includes
    const starts = [] as string[]
    const includes = [] as string[]
    for (const f of pool) {
      const lower = f.toLowerCase()
      if (lower.startsWith(term)) starts.push(f)
      else if (lower.includes(term)) includes.push(f)
    }
    return [...starts, ...includes].slice(0, 20)
  }, [q, remoteFonts]);

  function highlightMatch(text: string, term: string) {
    if (!term) return text;
    const lower = text.toLowerCase();
    const t = term.toLowerCase();
    const idx = lower.indexOf(t);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-indigo-50 text-indigo-700 px-1 rounded">{text.slice(idx, idx + t.length)}</mark>
        {text.slice(idx + t.length)}
      </>
    );
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/google-fonts');
        if (!mounted) return;
        if (!res.ok) return;
        const j = await res.json();
        if (j?.families && Array.isArray(j.families)) {
          // families may be objects ({ family, variants }) or strings — normalize to string names
          const names = j.families.map((f: GoogleFontFamily) =>
            (typeof f === 'string' ? f : f?.family || String(f))
          );
          // remove duplicates while preserving order
          const seen = new Set<string>();
          const unique = [] as string[];
          for (const n of names) {
            if (!seen.has(n)) {
              seen.add(n);
              unique.push(n);
            }
          }
          setRemoteFonts(unique);
          // announce remote fonts loaded if dropdown is open
          if (open) setAriaMessage(`${unique.length} fontes carregadas`);
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, [open]);

  function handleChange(val: string) {
    setQ(val);
    setSelectedIndex(-1);
    setOpen(true);
    onChange?.(val);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((s) => (s >= suggestions.length - 1 ? 0 : Math.min(s + 1, suggestions.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((s) => (s <= 0 ? Math.max(suggestions.length - 1, 0) : Math.max(s - 1, 0)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      }
    }
  }

  // Remove this effect and clear ariaMessage in the event handlers that close the dropdown.

  function handleSelect(name: string) {
    setQ(name);
    setSelectedIndex(-1);
    setOpen(false);
    onChange?.(name);
    onSelect?.(name);
    setAriaMessage(`${name} selecionada`);
    // Clear ariaMessage after dropdown closes
    setTimeout(() => setAriaMessage(""), 200);
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        ref={inputRef}
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            setAriaMessage("");
          }, 150);
        }}
        placeholder="Ex: Roboto, Inter, Montserrat"
        aria-label="Buscar fonte"
        className="w-full px-3 py-2 border rounded"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-40 mt-2 w-full bg-white border border-slate-200 rounded-md shadow-lg">
          {suggestions.map((s, i) => (
            <div
              key={s}
              role="button"
              tabIndex={0}
              onMouseDown={() => handleSelect(s)}
              className={`px-3 py-2 text-sm cursor-pointer ${i === selectedIndex ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
            >
              {highlightMatch(s, q)}
            </div>
          ))}
        </div>
      )}
      {/* Screen-reader only live region for announcements */}
      <div role="status" aria-live="polite" className="sr-only">{ariaMessage}</div>
    </div>
  );
}
