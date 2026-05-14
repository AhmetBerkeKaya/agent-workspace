"use client";

import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, Folder, LogOut, LayoutDashboard, Link } from "lucide-react";
import { CreateWorkspace } from "@/components/ui/CreateWorkspace";
import { WorkspaceList } from "@/components/ui/WorkspaceList";

export default function Home() {
  const { data: session } = useSession();

  // Giriş yapmamış kullanıcıyı temiz bir karşılama ekranında tutalım
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500">Lütfen giriş yapın...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sol Kenar Menüsü (Sidebar) - Premium Glassmorphism Feel */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Agent Workspace</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Folder size={20} />
            Projelerim
          </button>
        </nav>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img
              src={session.user?.image || ""}
              alt="Profil"
              className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate w-32">
                {session.user?.name}
              </span>
              <span className="text-[10px] text-zinc-500 truncate w-32">{session.user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col items-center justify-start overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl flex flex-col items-center gap-8 py-10"
        >
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Hoş geldin, {session.user?.name?.split(" ")[0]}
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400">
              Bugün hangi ajanı orkestre etmek istersin?
            </p>
          </div>

          <CreateWorkspace />

          <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-8 mt-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 px-1">Aktif Projelerim</h2>
            <WorkspaceList />
          </div>
        </motion.div>
      </main>
    </div>
  );
}