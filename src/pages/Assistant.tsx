import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Trash2, Mic, MicOff, Plus, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useChatHistory } from "@/hooks/use-chat-history";
import { format } from "date-fns";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const SUGGESTIONS = [
  { icon: "📊", text: "Meri shop ka profit kaise badhau?" },
  { icon: "🧾", text: "GST invoice kaise banaye?" },
  { icon: "📦", text: "Inventory management ke best tips" },
  { icon: "📱", text: "WhatsApp se marketing kaise kare?" },
  { icon: "💰", text: "Cash flow manage karne ke tips" },
  { icon: "👷", text: "Worker salary calculate kaise hoti hai?" },
];

export default function Assistant() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // Sync transcript to input
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

    // Get or create conversation
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

    // Save assistant response
    if (convId && assistantSoFar) {
      await saveMessage(convId, "assistant", assistantSoFar);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] gap-4">
        {/* Sidebar - conversation history */}
        <div className="hidden md:flex w-64 flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock size={14} /> Chat History
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={newChat}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No chats yet</p>
            )}
            {conversations.map(c => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 rounded-lg p-2 text-xs cursor-pointer transition-colors ${
                  activeConversationId === c.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                }`}
                onClick={() => loadMessages(c.id)}
              >
                <MessageSquare size={12} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(c.updated_at), "dd MMM, HH:mm")}</p>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                >
                  <Trash2 size={10} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <Sparkles size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display">VyaparSetu AI Assistant</h1>
                <p className="text-xs text-muted-foreground">Your personal business advisor • Multi-language • Voice enabled 🎙️</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="md:hidden" onClick={newChat}>
                <Plus size={14} className="mr-1" /> New
              </Button>
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={newChat}>
                  <Plus size={14} className="mr-1" /> New Chat
                </Button>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                  <Bot size={32} className="text-primary-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold">Namaste! 🙏</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Main aapka AI business assistant hoon. GST, inventory, marketing, salary — kuch bhi puchiye!
                    <br />
                    <span className="text-primary font-medium">🎙️ Mic button dabao aur bol ke puchho!</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-lg w-full">
                  {SUGGESTIONS.map(s => (
                    <button key={s.text} onClick={() => sendMessage(s.text)}
                      className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs text-left hover:bg-accent transition-colors">
                      <span className="text-base">{s.icon}</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-primary/10" : "gradient-primary"
                }`}>
                  {m.role === "user"
                    ? <User size={16} className="text-primary" />
                    : <Bot size={16} className="text-primary-foreground" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}>
                  {m.content}
                  {isLoading && i === messages.length - 1 && m.role === "assistant" && (
                    <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary">
                  <Bot size={16} className="text-primary-foreground" />
                </div>
                <div className="rounded-2xl bg-card border border-border px-4 py-3">
                  <div className="flex gap-1.5">
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
            className="flex items-center gap-3 mt-3">
            {isSupported && (
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="lg"
                className={`shrink-0 rounded-xl ${isListening ? "animate-pulse" : ""}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? "🎙️ Bol rahe hain... sunne mein aayega" : "Apna sawal yahan likhe... (any language)"}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <Button type="submit" size="lg" className="shrink-0 rounded-xl" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
