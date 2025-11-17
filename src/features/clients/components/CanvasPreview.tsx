"use client";

import { useState } from "react";

export default function CanvasPreview() {
  const [tab, setTab] = useState<"header" | "card" | "social">("header");

  return (
    <div className="p-4 rounded-lg studio-bg studio-radius" >
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setTab("header")} className={`px-3 py-1 rounded ${tab === 'header' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Web Header</button>
          <button onClick={() => setTab("card")} className={`px-3 py-1 rounded ${tab === 'card' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Business Card</button>
          <button onClick={() => setTab("social")} className={`px-3 py-1 rounded ${tab === 'social' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Social</button>
        </div>
        <div className="text-sm text-slate-500">Preview</div>
      </div>

      <div className="w-full h-[420px] border border-dashed rounded-lg flex items-center justify-center">
        {tab === 'header' && <div className="w-full h-20 flex items-center px-6 bg-white rounded">
          <div className="text-xl font-bold">Client Logo</div>
        </div>}
        {tab === 'card' && <div className="w-72 h-40 bg-white rounded p-4 shadow flex flex-col justify-center items-start">
          <div className="text-lg font-semibold">Company Name</div>
          <div className="text-sm text-slate-500">Job Title</div>
        </div>}
        {tab === 'social' && <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center">Avatar</div>}
      </div>
    </div>
  );
}
