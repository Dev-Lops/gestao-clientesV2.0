import { NextResponse } from "next/server";

export async function GET() {
  const base =
    process.env.BIBLE_API_BASE || "https://www.abibliadigital.com.br/api";
  const token = process.env.BIBLE_API_TOKEN;

  try {
    const res = await fetch(`${base}/verses/nvi/random`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Verse service unavailable" },
        { status: 503 },
      );
    }
    const data = (await res.json()) as unknown as {
      book?: { name?: string; name_pt?: string };
      chapter?: number | { number?: number };
      chapterNumber?: number;
      number?: number;
      verse?: number;
      verseNumber?: number;
      text?: string;
    };
    const bookName = data?.book?.name || data?.book?.name_pt || "—";
    const chapter =
      (typeof data?.chapter === "number"
        ? data?.chapter
        : (data?.chapter as { number?: number })?.number) ||
      data?.chapterNumber ||
      "—";
    const verse = data?.number || data?.verse || data?.verseNumber || "—";
    const text = data?.text || "";
    const ref = `${bookName} ${chapter}:${verse}`;
    return NextResponse.json({ text, ref, version: "NVI" });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch verse" },
      { status: 500 },
    );
  }
}
