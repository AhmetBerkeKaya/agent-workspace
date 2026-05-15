"use client";

import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, FileText, Settings, Loader2, CheckCircle2, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DrivePicker } from "@/components/ui/DrivePicker";

export default function WorkspacePage() {
  const { id } = useParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [sources, setSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // Kendi sapasağlam State'lerimiz
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchSources = async () => {
    try {
      const res = await fetch(`/api/workspaces/${id}/sources`);
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Kaynaklar yüklenemedi");
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = async (file: any) => {
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
    if (response.ok) fetchSources();
  };

  // İŞTE SİHİR BURADA: Native Web Streaming
  const customSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    
    // Kullanıcı mesajını ekle ve bot için boş bir mesaj balonu oluştur
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, workspaceId: id }),
      });

      if (!res.body) throw new Error("Stream bulunamadı");

      // Daktilo efekti için veriyi parça parça (chunk) okuyoruz
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let botResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          botResponse += chunk;
          
          // Son (bot) mesajının içeriğini güncelliyoruz
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = botResponse;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Chat Hatası:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Üzgünüm, bir bağlantı hatası oluştu.";
        return updated;
      });
    } finally {
      setIsLoading(false);
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
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-500 transition-colors">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0 text-left">
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

      {/* SAĞ PANEL: Chat Arayüzü */}
      <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Ajan Çevrimiçi</span>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <Settings size={18} />
          </button>
        </div>

        {/* Mesaj Alanı */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2 opacity-50">
                <Bot size={40} />
                <p className="text-sm italic">Sohbete başlamak için bir mesaj yazın...</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === "user" ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-600" : "bg-indigo-600 text-white"
                }`}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={18} />}
                </div>
                <div className={`p-4 rounded-2xl border shadow-sm ${
                  msg.role === "user" 
                    ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 rounded-tr-none" 
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-tl-none"
                }`}>
                  {msg.role === "assistant" && msg.content === "" ? (
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                  ) : (
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Alanı */}
        <div className="p-6 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent shrink-0">
          <form onSubmit={customSubmit} className="max-w-3xl mx-auto relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  customSubmit();
                }
              }}
              placeholder="Ajanına bir şeyler sor..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 pr-16 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-xl min-h-[80px] text-sm"
            />
            <button 
              type="submit"
              className="absolute bottom-4 right-4 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg disabled:opacity-50"
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}