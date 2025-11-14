import { NextResponse } from "next/server";

// Lista reduzida de referências para seleção diária determinística
const DAILY_REFERENCES = [
  "John 3:16",
  "Psalm 23:1",
  "Romans 8:28",
  "Philippians 4:13",
  "Proverbs 3:5-6",
  "Isaiah 41:10",
  "Matthew 6:33",
  "Jeremiah 29:11",
  "Matthew 11:28",
  "Psalm 46:1",
];

function getDailyIndex() {
  const now = new Date();
  const seed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % DAILY_REFERENCES.length;
}

export async function GET() {
  try {
    // Verso aleatório em Português usando bible-api.com
    // Tradução: Almeida (única em português disponível)
    // Documentação: https://bible-api.com/
    const url = "https://bible-api.com/john+3:16?translation=almeida";

    // Gera um versículo "aleatório" baseado no dia (determinístico)
    const books = [
      { book: "john", chapter: 3, verse: 16 },
      { book: "psalm", chapter: 23, verse: 1 },
      { book: "romans", chapter: 8, verse: 28 },
      { book: "philippians", chapter: 4, verse: 13 },
      { book: "jeremiah", chapter: 29, verse: 11 },
      { book: "matthew", chapter: 11, verse: 28 },
      { book: "isaiah", chapter: 41, verse: 10 },
      { book: "proverbs", chapter: 3, verse: 5 },
    ];

    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const selected = books[dayOfYear % books.length];

    const verseUrl = `https://bible-api.com/${selected.book}+${selected.chapter}:${selected.verse}?translation=almeida`;
    const res = await fetch(verseUrl, { cache: "no-store" });

    if (!res.ok) {
      const fallback = {
        id: 0,
        text: "Não foi possível carregar o versículo agora. Tente novamente em alguns minutos.",
        book: { id: 0, name: "Verso indisponível" },
        chapter: 0,
        verse: 0,
        translationId: "almeida",
        translationName: "João Ferreira de Almeida",
      };
      return NextResponse.json(fallback);
    }

    const raw = await res.json();
    const verses = raw?.verses || [];
    const firstVerse = verses[0] || {};

    const adapted = {
      id: 0,
      text: (raw?.text || firstVerse?.text || "").trim(),
      book: {
        id: 0,
        name:
          firstVerse?.book_name || raw?.reference?.split(" ")[0] || "Bíblia",
      },
      chapter: firstVerse?.chapter || 0,
      verse: firstVerse?.verse || 0,
      translationId: raw?.translation_id || "almeida",
      translationName: raw?.translation_name || "João Ferreira de Almeida",
    };
    return NextResponse.json(adapted);
  } catch {
    const fallback = {
      id: 0,
      text: "Não foi possível carregar o versículo agora. Verifique sua conexão e tente novamente.",
      book: { id: 0, name: "Verso indisponível" },
      chapter: 0,
      verse: 0,
      translationId: "almeida",
      translationName: "João Ferreira de Almeida",
    };
    return NextResponse.json(fallback);
  }
}
