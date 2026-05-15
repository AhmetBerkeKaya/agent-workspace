"use client";

import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
// Menu ve X ikonlarını ekledik!
import { Send, Bot, FileText, Settings, Loader2, CheckCircle2, User, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DrivePicker } from "@/components/ui/DrivePicker";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";

export default function WorkspacePage() {
  const { id } = useParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sources, setSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // Mobil yan menü kontrol state'i
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null); // Klavye odaklanması için
  const [workspaceName, setWorkspaceName] = useState("Sohbet");

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

  // KLAVYE KISAYOLLARI (Keyboard First)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + K : Mesaj kutusuna odaklan
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // CMD/CTRL + SHIFT + N : Ana sayfaya dön (Yeni Proje)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // OTOMATİK İSİMLENDİRME TETİKLEYİCİSİ
  // Sohbet 2 mesaja ulaştığında (1 kullanıcı, 1 bot) sadece bir kez çalışır
  useEffect(() => {
    if (messages.length === 2 && messages[0].role === "user" && workspaceName === "Sohbet") {
      fetch(`/api/workspaces/${id}/auto-title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstMessage: messages[0].content }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.name) setWorkspaceName(data.name);
        })
        .catch(console.error);
    }
  }, [messages.length, id, workspaceName]);

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

  const customSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");

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
    // relative eklendi ki mobil menü ekranın üstüne binebilsin
    <div className="flex h-[calc(100vh-64px)] relative overflow-hidden bg-white dark:bg-[#0a0a0a]">

      {/* Mobil Karartma (Overlay) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SOL PANEL (Responsive Drawer) */}
      <aside className={`absolute md:relative top-0 left-0 z-40 w-[280px] h-full shrink-0 border-r border-zinc-200 dark:border-white/10 flex flex-col bg-zinc-50 dark:bg-[#0a0a0a] transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 backdrop-blur-md">
          <h2 className="font-semibold text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Kaynaklar</h2>
          <div className="flex items-center gap-2">
            <DrivePicker onFileSelect={handleFileSelect} />
            {/* Mobilde Menüyü Kapatma Butonu */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingSources ? (
            <div className="flex items-center justify-center h-20 text-zinc-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-10">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <FileText size={20} className="text-indigo-500" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">Drive'dan dosya ekleyerek başlayın.</p>
            </div>
          ) : (
            sources.map((source) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={source.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-200 truncate">{source.name}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    İşlendi
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </aside>

      {/* SAĞ PANEL: Chat Arayüzü */}
      {/* min-w-0 çok kritik: Flexbox içindeki çocukların ekran dışına taşmasını engeller */}
      <main className="flex-1 flex flex-col bg-white dark:bg-transparent relative min-w-0">

        {/* Üst Bar */}
        <div className="h-14 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobil Menü Açma Butonu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{workspaceName}</span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500 hidden md:inline">• Gemini 2.5 Flash</span>
            </div>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0">
            <Settings size={18} />
          </button>
        </div>

        {/* Mesaj Alanı */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-24 pb-36 md:pb-32 space-y-6 md:space-y-8 scroll-smooth w-full">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-zinc-400 gap-4 mt-10 px-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <Bot size={32} />
                </div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Sohbete başlamak için bir şeyler yazın</p>
              </motion.div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                // Mobilde gap-3, Desktopta gap-4
                className={`flex gap-3 md:gap-4 w-full max-w-4xl mx-auto ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${msg.role === "user"
                  ? "bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300"
                  : "bg-indigo-600 text-white"
                  }`}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={16} />}
                </div>

                {/* Mesaj Balonu: min-w-0 taşmaları önler */}
                <div className={`flex-1 min-w-0 ${msg.role === "user" ? "max-w-2xl" : "max-w-full"}`}>
                  <div className={`p-4 md:p-5 rounded-2xl ${msg.role === "user"
                    ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 rounded-tr-sm inline-block w-auto float-right"
                    : "bg-transparent text-zinc-800 dark:text-zinc-200"
                    }`}>
                    {msg.role === "assistant" && msg.content === "" ? (
                      <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs font-medium">Düşünüyor...</span>
                      </div>
                    ) : msg.role === "user" ? (
                      <p className="text-[14px] md:text-[15px] whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                    ) : (
                      // break-words prose alanında çok kritiktir
                      <div className="text-[14px] md:text-[15px] leading-relaxed break-words prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => <p className="mb-4 last:mb-0 text-zinc-700 dark:text-zinc-300" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2 text-zinc-700 dark:text-zinc-300" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-zinc-700 dark:text-zinc-300" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1 whitespace-pre-wrap leading-relaxed" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-xl md:text-2xl font-bold mb-4 mt-8 text-zinc-900 dark:text-white" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-lg md:text-xl font-bold mb-3 mt-6 text-zinc-900 dark:text-white" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-md md:text-lg font-semibold mb-2 mt-5 text-zinc-900 dark:text-white" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-900 dark:text-white" {...props} />,

                            code: ({ node, className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              if (match) return <code className={className} {...props}>{children}</code>;
                              return <code className="bg-zinc-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md text-[12px] md:text-[13px] font-mono break-all" {...props}>{children}</code>;
                            },

                            // Kod bloğunun dışarı taşmasını max-w-full ve overflow-x-auto engeller
                            pre: ({ node, ...props }) => (
                              <div className="relative my-4 md:my-6 rounded-xl overflow-hidden bg-[#0d1117] border border-zinc-200/20 dark:border-white/10 shadow-2xl max-w-full">
                                <div className="flex items-center px-4 py-2.5 md:py-3 bg-white/5 border-b border-white/5">
                                  <div className="flex gap-1.5 md:gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ff5f56] shadow-sm"></div>
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ffbd2e] shadow-sm"></div>
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27c93f] shadow-sm"></div>
                                  </div>
                                </div>
                                <pre className="p-4 md:p-5 overflow-x-auto text-[13px] md:text-[14px] text-zinc-300 font-mono leading-relaxed" {...props} />
                              </div>
                            )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Alanı */}
        {/* p-3 md:p-6 ile mobilde kenar boşlukları azaltıldı */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-transparent pt-10">
          <form onSubmit={customSubmit} className="max-w-4xl mx-auto relative group w-full">
            <div className="relative rounded-xl md:rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    customSubmit();
                  }
                }}
                placeholder="Gemini 2.5 Flash'a bir şeyler sor..."
                // Mobilde min-h ve text boyutları optimize edildi
                className="w-full bg-transparent p-4 md:p-5 pr-14 md:pr-16 outline-none resize-none min-h-[60px] md:min-h-[88px] max-h-[120px] md:max-h-[200px] text-[14px] md:text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="absolute bottom-2 md:bottom-4 right-2 md:right-4 p-2 md:p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg md:rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center shadow-lg"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="translate-x-[1px]" />}
              </button>
            </div>
            <div className="text-center mt-2 md:mt-3 hidden sm:block">
              <span className="text-[10px] md:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
                Agent Workspace v4.0 • Enterprise Edition
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}