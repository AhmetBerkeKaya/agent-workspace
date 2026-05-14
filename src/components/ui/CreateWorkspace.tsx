"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FolderPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateWorkspace() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setName("");
        router.refresh();
      }
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full"
    >
      <div className="flex items-center gap-3 mb-6 text-indigo-600 dark:text-indigo-400">
        <FolderPlus size={28} />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Yeni Proje Başlat</h2>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Proje Adı</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Finans Analizi 2026"
            className="w-full mt-1 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
            required
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Oluştur</>}
        </motion.button>
      </form>
    </motion.div>
  );
}