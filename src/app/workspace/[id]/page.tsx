"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Bot, FileText, Settings, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DrivePicker } from "@/components/ui/DrivePicker";

export default function WorkspacePage() {
  const { id } = useParams();
  const [input, setInput] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // Kaynakları Veritabanından Getir
  const fetchSources = async () => {
    try {
      const res = await fetch(`/api/workspaces/${id}/sources`);
      const data = await res.json();
      setSources(data);
    } catch (error) {
      console.error("Kaynaklar yüklenemedi");
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [id]);

  const handleFileSelect = async (file: any) => {
    // Veritabanına Kaydet (Ingestion)
    const response = await fetch(`/api/workspaces/${id}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileId: file.id,
        fileName: file.name,
        fileUrl: file.url,
        mimeType: file.mimeType,
      }),
    });

    if (response.ok) {
      // Başarılıysa listeyi sessizce güncelle
      fetchSources();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-zinc-950">
      {/* SOL PANEL */}
      <aside className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
          <h2 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Kaynaklar</h2>
          <DrivePicker onFileSelect={handleFileSelect} />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingSources ? (
            <div className="flex items-center justify-center h-20 text-zinc-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-10">
              <FileText size={40} className="text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-xs max-w-[200px]">Henüz bir kaynak eklenmedi.</p>
            </div>
          ) : (
            sources.map((source) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={source.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-indigo-500/50 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-500">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{source.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <CheckCircle2 size={10} className="text-green-500" />
                    İşlendi
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </aside>

      {/* SAĞ PANEL (Sohbet kısmı aynen kalsın...) */}
      <main className="flex-1 flex flex-col relative">
        {/* Sohbet kodların burada durmaya devam etsin */}
      </main>
    </div>
  );
}