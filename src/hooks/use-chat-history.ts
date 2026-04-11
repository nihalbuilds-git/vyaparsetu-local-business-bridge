import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; content: string };

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setLoading(true);
    const { data } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    setLoading(false);
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "..." : "");
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error || !data) return null;
    setActiveConversationId(data.id);
    loadConversations();
    return data.id;
  }, [user, loadConversations]);

  // Save a message
  const saveMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("ai_messages").insert({ conversation_id: conversationId, role, content });
    // Touch conversation updated_at
    await supabase.from("ai_conversations").update({ title: conversations.find(c => c.id === conversationId)?.title || "Chat" }).eq("id", conversationId);
  }, [conversations]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("ai_conversations").delete().eq("id", id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    loadConversations();
  }, [activeConversationId, loadConversations]);

  // New chat
  const newChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  return {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    loading,
    loadMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    newChat,
    loadConversations,
  };
}
