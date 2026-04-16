import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Bot, User, Sparkles, Trash2, Mic, MicOff, Plus, MessageSquare, Clock, Zap, BrainCircuit, ArrowRight, X, ArrowUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "@/components/CodeBlock";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useChatHistory } from "@/hooks/use-chat-history";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const SUGGESTIONS = [
  { icon: "📊", text: "How to increase my shop's profit?", category: "Business" },
  { icon: "🧾", text: "How to create a GST invoice?", category: "Tax" },
  { icon: "📦", text: "Best inventory management tips", category: "Inventory" },
  { icon: "📱", text: "How to do marketing via WhatsApp?", category: "Marketing" },
  { icon: "💰", text: "Tips to manage cash flow", category: "Finance" },
  { icon: "👷", text: "How is worker salary calculated?", category: "HR" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Assistant() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const {
    conversations, activeConversationId, messages, setMessages,
    loadMessages, createConversation, saveMessage, deleteConversation, newChat,
  } = useChatHistory();

  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
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
    textareaRef.current?.focus();
  }, [isLoading, isListening, messages, activeConversationId, stopListening, setMessages, createConversation, saveMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const hasContent = input.trim().length > 0;
  const canSend = hasContent && !isLoading;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex-col relative">
        {/* Chat messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Empty state - Claude-style centered greeting */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl md:text-4xl font-light text-foreground/80 font-display">
                    {greeting}, what can I help with?
                  </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="group flex flex-col gap-2 rounded-xl border border-border bg-card/50 hover:bg-card p-3.5 text-left hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{s.icon}</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{s.category}</span>
                      </div>
                      <span className="text-xs leading-relaxed text-foreground/80">{s.text}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5">
                    <Mic size={11} /> Voice
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5">
                    <Zap size={11} /> Instant
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5">
                    <BrainCircuit size={11} /> Multi-language
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex items-start gap-3", m.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    m.role === "user" ? "bg-primary/10" : "gradient-primary"
                  )}>
                    {m.role === "user"
                      ? <User size={14} className="text-primary" />
                      : <Bot size={14} className="text-primary-foreground" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  )}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:bg-muted dark:prose-code:bg-muted/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-muted dark:prose-pre:bg-muted/60 prose-pre:rounded-lg">
                        <ReactMarkdown components={{ code: ({ className, children }) => <CodeBlock className={className}>{children}</CodeBlock> }}>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                    {isLoading && i === messages.length - 1 && m.role === "assistant" && (
                      <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary">
                    <Bot size={14} className="text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Claude-style input bar */}
        <div className="max-w-3xl mx-auto w-full px-4 pb-3 pt-2">
          <div className={cn(
            "relative rounded-2xl border border-border bg-card shadow-sm transition-all",
            "focus-within:border-primary/40 focus-within:shadow-md"
          )}>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "🎙️ Listening... speak now!" : "Ask anything about your business..."}
              disabled={isLoading}
              className="min-h-[52px] max-h-[160px] w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              rows={1}
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1">
                {isSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg",
                      isListening
                        ? "text-destructive bg-destructive/10 animate-pulse"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setHistoryOpen(true)}
                  title="Chat history"
                >
                  <Clock size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={newChat}
                  title="New chat"
                >
                  <Plus size={16} />
                </Button>
              </div>

              <Button
                type="button"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  canSend
                    ? "gradient-primary text-primary-foreground shadow-sm hover:shadow-md"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                title="Send message"
              >
                <ArrowUp size={16} />
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
            VyaparSetu AI PRO • Hindi / English / Hinglish
          </p>
        </div>

        {/* History Drawer */}
        {historyOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setHistoryOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="gradient-primary px-4 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-primary-foreground flex items-center gap-2">
                    <Clock size={14} /> Chat History
                  </h3>
                  <p className="text-[10px] text-primary-foreground/70 mt-0.5">
                    {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-lg"
                    onClick={() => { newChat(); setHistoryOpen(false); }}>
                    <Plus size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-lg"
                    onClick={() => setHistoryOpen(false)}>
                    <X size={16} />
                  </Button>
                </div>
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
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl p-2.5 text-xs cursor-pointer transition-all duration-200",
                      activeConversationId === c.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-accent border border-transparent"
                    )}
                    onClick={() => { loadMessages(c.id); setHistoryOpen(false); }}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      activeConversationId === c.id ? "gradient-primary" : "bg-muted"
                    )}>
                      <MessageSquare size={12} className={activeConversationId === c.id ? "text-primary-foreground" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(c.updated_at), "dd MMM, HH:mm")}</p>
                    </div>
                    <Button variant="ghost" size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 hover:text-destructive"
                      onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}>
                      <Trash2 size={11} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
