"use client"
import { useEffect, useMemo, useRef, useState } from "react";

type ClientItem = { id: string; name: string }

export function ClientTypeahead({
  name = "clientId",
  placeholder = "Cliente (opcional)",
  defaultValue,
}: {
  name?: string;
  placeholder?: string;
  defaultValue?: { id: string; name: string } | null;
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ClientItem[]>([])
  const [selected, setSelected] = useState<ClientItem | null>(
    defaultValue || null
  )
  const abortRef = useRef<AbortController | null>(null)

  const search = useMemo(
    () =>
      async (q: string) => {
        if (abortRef.current) abortRef.current.abort()
        const ac = new AbortController()
        abortRef.current = ac
        setLoading(true)
        try {
          const url = new URL("/api/clients/search", window.location.origin)
          url.searchParams.set("q", q)
          url.searchParams.set("take", "20")
          const res = await fetch(url.toString(), { signal: ac.signal })
          if (!res.ok) throw new Error("Falha na busca")
          const data: ClientItem[] = await res.json()
          setItems(data)
        } catch (e) {
          if ((e as unknown as { name?: string })?.name !== "AbortError") {
            setItems([])
          }
        } finally {
          setLoading(false)
        }
      },
    []
  )

  // Debounce query
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const t = setTimeout(() => {
      search(q);
    }, 300);
    return () => clearTimeout(t);
  }, [open, query, search]);

  return (
    <div style={{ position: "relative" }}>
      <input
        name={name}
        placeholder={placeholder}
        value={selected ? selected.name : query}
        onChange={e => {
          setQuery(e.target.value);
          setSelected(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ccc", zIndex: 10 }}>
          {loading ? (
            <div>Carregando...</div>
          ) : items.length === 0 ? (
            <div>Nenhum cliente encontrado</div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                style={{ padding: "8px", cursor: "pointer", background: selected?.id === item.id ? "#eee" : "#fff" }}
                onMouseDown={() => {
                  setSelected(item);
                  setQuery(item.name);
                  setOpen(false);
                }}
              >
                {item.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
