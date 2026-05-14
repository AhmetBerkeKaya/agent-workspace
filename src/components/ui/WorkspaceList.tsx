"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Folder } from "lucide-react";
import { useRouter } from "next/navigation";

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/workspaces")
      .then((res) => {
        if (!res.ok) throw new Error("Yüklenemedi");
        return res.json();
      })
      .then((data) => {
        setWorkspaces(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse text-sm">Projeler yükleniyor...</div>;
  if (workspaces.length === 0) return <div className="text-zinc-400 text-sm italic px-2">Henüz proje yok. İlkini yukarıdan oluşturun!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mt-4">
      {workspaces.map((ws, index) => (
        <motion.div
          key={ws.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => router.push(`/workspace/${ws.id}`)}
          className="group cursor-pointer p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-indigo-500 transition-colors">
                <Folder size={20} />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ws.name}</h3>
            </div>
            <ChevronRight size={16} className="text-zinc-300 group-hover:text-indigo-500 transition-all" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}