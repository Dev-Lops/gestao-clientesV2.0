import { getServerEnv } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = getServerEnv();
  if (!env?.BIBLE_API_BASE) {
    return NextResponse.json(
      { error: "BIBLE_API_BASE not configured" },
      { status: 501 },
    );
  }

  try {
    const { id } = await params;
    const url = `${env.BIBLE_API_BASE.replace(/\/$/, "")}/verses/${id}`;
    const res = await fetch(url, {
      headers: env.BIBLE_API_TOKEN
        ? { Authorization: `Bearer ${env.BIBLE_API_TOKEN}` }
        : undefined,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Failed to fetch verse" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
