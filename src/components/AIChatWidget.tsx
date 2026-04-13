import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Maximize2, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "@/components/CodeBlock";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const QUICK_PROMPTS = [
  "GST kaise calculate kare?",
  "Khata entry kaise kare?",
  "Marketing tips for my shop",
  "Inventory management tips",
];

export default function AIChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  if (!user) return null;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (isListening) stopListening();
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

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
    setIsLoading(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full gradient-primary shadow-lg hover:scale-105 transition-transform"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="text-primary-foreground" size={24} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex w-[340px] sm:w-[380px] flex-col rounded-2xl border border-border bg-card shadow-2xl"
          style={{ height: "min(500px, calc(100vh - 120px))" }}>
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl gradient-primary px-4 py-3">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Bot size={20} />
              <div>
                <p className="font-semibold text-sm">VyaparSetu AI</p>
                <p className="text-[10px] opacity-80">Voice + Text • Multi-language</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/20"
                onClick={() => { navigate("/assistant"); setOpen(false); }}>
                <Maximize2 size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/20"
                onClick={() => setOpen(false)}>
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary">
                    <Bot size={14} className="text-primary-foreground" />
                  </div>
                  <div className="rounded-xl bg-muted p-3 text-sm">
                    Namaste! 🙏 Kuch bhi puchiye — type karo ya 🎙️ mic use karo!
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="rounded-lg border border-border p-2 text-xs text-left hover:bg-accent transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-primary/10" : "gradient-primary"
                }`}>
                  {m.role === "user"
                    ? <User size={14} className="text-primary" />
                    : <Bot size={14} className="text-primary-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                    : "bg-muted text-foreground"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:bg-background prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background prose-pre:rounded-lg">
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
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary">
                  <Bot size={14} className="text-primary-foreground" />
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-2 border-t border-border p-3">
            {isSupported && (
              <Button
                type="button"
                variant={isListening ? "destructive" : "ghost"}
                size="icon"
                className={`h-9 w-9 shrink-0 ${isListening ? "animate-pulse" : ""}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </Button>
            )}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? "🎙️ Sun raha hoon..." : "Apna sawal puchiye..."}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || isLoading}>
              <Send size={16} />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
