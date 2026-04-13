import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Trash2, Mic, MicOff, Plus, MessageSquare, Clock, Zap, BrainCircuit, ArrowRight, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "@/components/CodeBlock";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useChatHistory } from "@/hooks/use-chat-history";
import { format } from "date-fns";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const SUGGESTIONS = [
  { icon: "📊", text: "Meri shop ka profit kaise badhau?", category: "Business" },
  { icon: "🧾", text: "GST invoice kaise banaye?", category: "Tax" },
  { icon: "📦", text: "Inventory management ke best tips", category: "Inventory" },
  { icon: "📱", text: "WhatsApp se marketing kaise kare?", category: "Marketing" },
  { icon: "💰", text: "Cash flow manage karne ke tips", category: "Finance" },
  { icon: "👷", text: "Worker salary calculate kaise hoti hai?", category: "HR" },
];

export default function Assistant() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const {
    conversations, activeConversationId, messages, setMessages,
    loadMessages, createConversation, saveMessage, deleteConversation, newChat,
  } = useChatHistory();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (isListening) stopListening();
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(text.trim());
    }
    if (convId) await saveMessage(convId, "user", text.trim());

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        upsert(err.error || "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch {
      upsert("Connection error. Please check your internet.");
    }

    if (convId && assistantSoFar) {
      await saveMessage(convId, "assistant", assistantSoFar);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] relative">
        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sliding sidebar */}
        <div
          className={`fixed md:relative z-40 top-0 left-0 h-full w-72 flex flex-col bg-card border-r border-border shadow-xl md:shadow-sm transition-all duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="gradient-primary px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary-foreground flex items-center gap-2">
                <Clock size={14} /> Chat History
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-lg"
                  onClick={newChat}
                >
                  <Plus size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-lg"
                  onClick={() => setSidebarOpen(false)}
                >
                  <PanelLeftClose size={16} />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-primary-foreground/70 mt-1">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare size={24} className="text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No chats yet</p>
                <p className="text-[10px] text-muted-foreground/60">Start a conversation below!</p>
              </div>
            )}
            {conversations.map(c => (
              <div
                key={c.id}
                className={`group flex items-center gap-2.5 rounded-xl p-2.5 text-xs cursor-pointer transition-all duration-200 ${
                  activeConversationId === c.id
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                    : "hover:bg-accent border border-transparent"
                }`}
                onClick={() => { loadMessages(c.id); setSidebarOpen(false); }}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  activeConversationId === c.id ? "gradient-primary" : "bg-muted"
                }`}>
                  <MessageSquare size={12} className={activeConversationId === c.id ? "text-primary-foreground" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(c.updated_at), "dd MMM, HH:mm")}</p>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 hover:text-destructive"
                  onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                >
                  <Trash2 size={11} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col w-full">
          {/* Premium Header */}
          <div className="flex items-center justify-between mb-4 p-4 rounded-2xl gradient-primary shadow-lg">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 text-primary-foreground hover:bg-white/20 rounded-xl border border-white/20"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeftOpen size={18} />
              </Button>
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <BrainCircuit size={20} className="text-primary-foreground" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold text-primary-foreground font-display flex items-center gap-2">
                  VyaparSetu AI
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                    <Zap size={8} /> PRO
                  </span>
                </h1>
                <p className="text-[11px] text-primary-foreground/80">
                  Smart Business Advisor • Multi-language • Voice 🎙️
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/20 rounded-lg"
                onClick={newChat}
              >
                <Plus size={14} className="mr-1" /> New Chat
              </Button>
            </div>
          </div>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-muted/40 p-4 md:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-xl">
                    <Sparkles size={36} className="text-primary-foreground" />
                  </div>
                </div>
                <div className="text-center space-y-3 max-w-md">
                  <h2 className="text-2xl font-bold font-display">Namaste! 🙏</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Main aapka <span className="text-primary font-semibold">AI Business Assistant</span> hoon.
                    GST, inventory, marketing, salary — kuch bhi puchiye Hindi, English ya Hinglish mein!
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-primary">
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-medium">
                      <Mic size={12} /> Voice Input
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-medium">
                      <Zap size={12} /> Instant Answers
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-medium">
                      <BrainCircuit size={12} /> Smart AI
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl w-full">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.category}</span>
                      </div>
                      <span className="text-xs leading-relaxed">{s.text}</span>
                      <ArrowRight size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                  m.role === "user" ? "bg-primary/10 border border-primary/20" : "gradient-primary"
                }`}>
                  {m.role === "user"
                    ? <User size={16} className="text-primary" />
                    : <Bot size={16} className="text-primary-foreground" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-muted prose-pre:rounded-lg">
                      <ReactMarkdown components={{ code: ({ className, children }) => <CodeBlock className={className}>{children}</CodeBlock> }}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                  {isLoading && i === messages.length - 1 && m.role === "assistant" && (
                    <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-sm">
                  <Bot size={16} className="text-primary-foreground" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-3 mt-3 p-3 rounded-2xl border border-border bg-card shadow-sm">
            {isSupported && (
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={`h-11 w-11 shrink-0 rounded-xl transition-all duration-200 ${
                  isListening
                    ? "animate-pulse shadow-lg shadow-destructive/30"
                    : "hover:bg-primary hover:text-primary-foreground"
                }`}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
            )}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isListening ? "🎙️ Sun raha hoon... bolo!" : "Apna sawal yahan likhe... (Hindi / English / Hinglish)"}
                className="w-full rounded-xl border-0 bg-muted/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
                disabled={isLoading}
              />
              {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
                  <span className="h-3 w-0.5 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="h-4 w-0.5 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "100ms" }} />
                  <span className="h-2 w-0.5 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                  <span className="h-5 w-0.5 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                  <span className="h-3 w-0.5 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl gradient-primary shadow-md hover:shadow-lg transition-all duration-200"
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} className="text-primary-foreground" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
