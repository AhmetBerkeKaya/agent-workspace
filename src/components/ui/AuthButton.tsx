"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LogIn, LogOut } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    // Yüklenme animasyonunu biraz daha genişlettik ki PP ve mail alanı için yer açılsın
    return <div className="h-10 w-40 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {/* Profil Bilgileri Alanı */}
        <div className="flex items-center gap-3 hidden md:flex">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt="Profil"
              className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm"
              referrerPolicy="no-referrer" // Google fotoğraflarının 403 hatası vermesini engeller
            />
          )}
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
              {session.user?.name}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {session.user?.email}
            </span>
          </div>
        </div>

        {/* Çıkış Butonu (Hover olunca hafif kızarır) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => signOut()}
          className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-sm font-medium transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          title="Çıkış Yap"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Çıkış</span>
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors hover:bg-indigo-700 shadow-sm"
    >
      <LogIn size={16} />
      Giriş Yap
    </motion.button>
  );
}