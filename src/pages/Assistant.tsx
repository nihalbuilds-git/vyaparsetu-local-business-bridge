import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Bot, User, Sparkles, Trash2, Mic, MicOff, Plus, MessageSquare, Clock, Zap, BrainCircuit, ArrowRight, X, ArrowUp, Paperclip, FileText, Image as ImageIcon, Search, MessageSquarePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "@/components/CodeBlock";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useChatHistory } from "@/hooks/use-chat-history";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };
type Attachment = { id: string; file: File; preview?: string; type: "image" | "document"; textContent?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isTextualFile(file: File): boolean {
  const textTypes = ["text/", "application/json", "application/xml", "application/javascript"];
  const textExt = ["txt", "md", "csv", "json", "xml", "yaml", "yml", "log", "js", "ts", "py", "html", "css"];
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return textTypes.some(t => file.type.startsWith(t)) || textExt.includes(ext);
}

function groupConversationsByDate<T extends { updated_at: string }>(items: T[]) {
  const groups: Record<string, T[]> = { Today: [], Yesterday: [], "Previous 7 days": [], "This month": [], Older: [] };
  items.forEach(item => {
    const d = new Date(item.updated_at);
    if (isToday(d)) groups.Today.push(item);
    else if (isYesterday(d)) groups.Yesterday.push(item);
    else if (isThisWeek(d)) groups["Previous 7 days"].push(item);
    else if (isThisMonth(d)) groups["This month"].push(item);
    else groups.Older.push(item);
  });
  return groups;
}

export default function Assistant() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const {
    conversations, activeConversationId, messages, setMessages,
    loadMessages, createConversation, saveMessage, deleteConversation, newChat,
  } = useChatHistory();

  const greeting = useMemo(() => getGreeting(), []);

  const filteredConversations = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => c.title.toLowerCase().includes(q));
  }, [conversations, historySearch]);

  const groupedConversations = useMemo(() => groupConversationsByDate(filteredConversations), [filteredConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach(a => a.preview && URL.revokeObjectURL(a.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_FILES - attachments.length;
    if (slots <= 0) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    const arr = Array.from(files).slice(0, slots);
    const newAttachments: Attachment[] = [];
    arr.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }
      const isImage = file.type.startsWith("image/");
      const att: Attachment = {
        id: crypto.randomUUID(),
        file,
        type: isImage ? "image" : "document",
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
      newAttachments.push(att);
      if (isTextualFile(file)) {
        file.text().then(text => {
          setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, textContent: text.slice(0, 5000) } : a));
        }).catch(() => {});
      }
    });
    setAttachments(prev => [...prev, ...newAttachments]);
  }, [attachments.length]);

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const found = prev.find(a => a.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter(a => a.id !== id);
    });
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const fileItems = Array.from(items).filter(it => it.kind === "file");
    if (fileItems.length > 0) {
      e.preventDefault();
      const dt = new DataTransfer();
      fileItems.forEach(it => { const f = it.getAsFile(); if (f) dt.items.add(f); });
      handleFiles(dt.files);
    }
  }, [handleFiles]);

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    if (isListening) stopListening();

    // Build message content with attachment context
    let fullText = text.trim();
    if (attachments.length > 0) {
      const attachmentInfo = attachments.map(a => {
        if (a.textContent) return `\n\n📎 **${a.file.name}**:\n\`\`\`\n${a.textContent}\n\`\`\``;
        return `\n\n📎 Attached: **${a.file.name}** (${a.type}, ${formatFileSize(a.file.size)})`;
      }).join("");
      fullText = (fullText || "Please review these attachments:") + attachmentInfo;
    }

    const userMsg: Msg = { role: "user", content: fullText };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    // Clear attachments
    attachments.forEach(a => a.preview && URL.revokeObjectURL(a.preview));
    setAttachments([]);
    setIsLoading(true);

    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(text.trim() || "New chat");
    }
    if (convId) await saveMessage(convId, "user", fullText);

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
  }, [isLoading, isListening, messages, activeConversationId, attachments, stopListening, setMessages, createConversation, saveMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const hasContent = input.trim().length > 0 || attachments.length > 0;
  const canSend = hasContent && !isLoading;

  return (
    <AppLayout>
      <div
        className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex-col relative"
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Paperclip size={32} />
              <p className="font-semibold">Drop files to attach</p>
              <p className="text-xs text-muted-foreground">Images & documents up to 10MB</p>
            </div>
          </div>
        )}

        {/* Chat messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
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
                    <Paperclip size={11} /> Attachments
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5">
                    <BrainCircuit size={11} /> Multi-language
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                    ) : <div className="whitespace-pre-wrap">{m.content}</div>}
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

        {/* Input bar */}
        <div className="max-w-3xl mx-auto w-full px-4 pb-3 pt-2">
          <div className={cn(
            "relative rounded-2xl border border-border bg-card shadow-sm transition-all",
            "focus-within:border-primary/40 focus-within:shadow-md"
          )}>
            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1 border-b border-border/50">
                {attachments.map(a => (
                  <div
                    key={a.id}
                    className="group relative flex items-center gap-2 rounded-lg border border-border bg-muted/40 pl-2 pr-7 py-1.5 max-w-[200px]"
                  >
                    {a.type === "image" && a.preview ? (
                      <img src={a.preview} alt={a.file.name} className="h-7 w-7 rounded object-cover shrink-0" />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                        <FileText size={14} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{a.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(a.file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeAttachment(a.id)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isListening ? "🎙️ Listening... speak now!" : "Ask anything about your business..."}
              disabled={isLoading}
              className="min-h-[52px] max-h-[160px] w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              rows={1}
            />

            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || attachments.length >= MAX_FILES}
                  title={attachments.length >= MAX_FILES ? `Max ${MAX_FILES} files` : "Attach files"}
                >
                  <Paperclip size={16} />
                </Button>
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

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={e => { handleFiles(e.target.files); if (e.target) e.target.value = ""; }}
          />
        </div>

        {/* History Drawer - Claude-style */}
        {historyOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
              onClick={() => setHistoryOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-[340px] max-w-[90vw] flex flex-col bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
                    <MessageSquare size={14} className="text-primary-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Your chats</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setHistoryOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              {/* New chat button */}
              <div className="p-3 border-b border-border">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-9 text-sm font-medium"
                  onClick={() => { newChat(); setHistoryOpen(false); }}
                >
                  <MessageSquarePlus size={15} />
                  Start new chat
                </Button>
              </div>

              {/* Search */}
              {conversations.length > 0 && (
                <div className="px-3 pt-3">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Search chats..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/30 text-xs outline-none focus:border-primary/40 focus:bg-background transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Chat list */}
              <div className="flex-1 overflow-y-auto p-3">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <MessageSquare size={20} className="text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No chats yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Start a conversation to see it here</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No chats match "{historySearch}"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedConversations).map(([label, items]) => (
                      items.length > 0 && (
                        <div key={label}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1.5">
                            {label}
                          </p>
                          <div className="space-y-0.5">
                            {items.map(c => (
                              <div
                                key={c.id}
                                className={cn(
                                  "group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all",
                                  activeConversationId === c.id
                                    ? "bg-primary/10 text-foreground"
                                    : "hover:bg-muted/60"
                                )}
                                onClick={() => { loadMessages(c.id); setHistoryOpen(false); }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm truncate",
                                    activeConversationId === c.id ? "font-medium text-foreground" : "text-foreground/80"
                                  )}>
                                    {c.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {format(new Date(c.updated_at), "h:mm a")}
                                  </p>
                                </div>
                                <button
                                  className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                                  onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                                  title="Delete chat"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border">
                <p className="text-[10px] text-muted-foreground/70 text-center">
                  {conversations.length} chat{conversations.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
