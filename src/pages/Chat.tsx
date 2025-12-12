import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, LogOut, Plus, Share2, Trash2, Brain, User, Menu, X } from "lucide-react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  share_id: string;
  is_public: boolean;
}

const Chat = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, share_id, is_public")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }

    setConversations(data || []);
    if (data && data.length > 0 && !currentConversation) {
      setCurrentConversation(data[0].id);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data as Message[] || []);
  };

  const createNewConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating chat",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConversations([data, ...conversations]);
    setCurrentConversation(data.id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting chat",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConversations(conversations.filter((c) => c.id !== id));
    if (currentConversation === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setCurrentConversation(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]);
    }
  };

  const toggleShare = async (conversation: Conversation) => {
    const { error } = await supabase
      .from("conversations")
      .update({ is_public: !conversation.is_public })
      .eq("id", conversation.id);

    if (error) {
      toast({
        title: "Error updating share settings",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (!conversation.is_public) {
      const shareUrl = `${window.location.origin}/share/${conversation.share_id}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied! 🔗",
        description: "Share this conversation with anyone.",
      });
    }

    setConversations(
      conversations.map((c) =>
        c.id === conversation.id ? { ...c, is_public: !c.is_public } : c
      )
    );
  };

  const selectConversation = (id: string) => {
    setCurrentConversation(id);
    setSidebarOpen(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentConversation || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Save user message to DB
      const { data: savedUserMsg } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversation,
          role: "user",
          content: userMessage,
        })
        .select()
        .single();

      // Update messages with real ID
      if (savedUserMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMsg.id ? { ...savedUserMsg, role: "user" as const } : m))
        );
      }

      // Get AI response with streaming
      const allMessages = [...messages, tempUserMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mememind-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("AI credits depleted. Please try again later.");
        }
        throw new Error("Failed to get AI response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      // Add placeholder assistant message
      const tempAssistantId = `temp-assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: tempAssistantId, role: "assistant", content: "" },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message to DB
      if (assistantContent) {
        const { data: savedAssistantMsg } = await supabase
          .from("messages")
          .insert({
            conversation_id: currentConversation,
            role: "assistant",
            content: assistantContent,
          })
          .select()
          .single();

        if (savedAssistantMsg) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? { ...savedAssistantMsg, role: "assistant" as const }
                : m
            )
          );
        }

        // Update conversation title if first message
        if (messages.length === 0) {
          const title =
            userMessage.length > 30
              ? userMessage.substring(0, 30) + "..."
              : userMessage;
          await supabase
            .from("conversations")
            .update({ title })
            .eq("id", currentConversation);
          loadConversations();
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error 💀",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      // Remove temp messages on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp")));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="h-screen flex bg-background relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-64 bg-card border-r border-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="font-display text-2xl text-gradient">MemeMind</h1>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-2">
          <Button
            onClick={createNewConversation}
            className="w-full justify-start gap-2"
            variant="ghost"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                currentConversation === conv.id
                  ? "bg-primary/20 text-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => selectConversation(conv.id)}
            >
              <span className="flex-1 truncate text-sm">{conv.title}</span>
              <div className="flex gap-1 md:hidden md:group-hover:flex">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleShare(conv);
                  }}
                  className={`p-1 rounded hover:bg-background ${
                    conv.is_public ? "text-neon-cyan" : ""
                  }`}
                >
                  <Share2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="p-1 rounded hover:bg-background text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border bg-card/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-xl text-gradient">MemeMind</h1>
        </div>

        {currentConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <Brain className="w-12 h-12 md:w-16 md:h-16 text-primary mb-4 animate-pulse-glow" />
                  <h2 className="font-display text-2xl md:text-3xl text-gradient mb-2">
                    What's on your mind?
                  </h2>
                  <p className="text-muted-foreground max-w-md text-sm md:text-base">
                    Ask me about meme lore, TikTok trends, Gen Z slang, or
                    literally anything chaotic. No cap, I'm built different. 🧠
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 md:gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-card border border-border p-3 md:p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="p-3 md:p-4 border-t border-border bg-card/50"
            >
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything, fr fr..."
                  className="flex-1 bg-background text-sm md:text-base"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90 glow-pink"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <Brain className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4" />
              <h2 className="font-display text-xl md:text-2xl text-gradient mb-2">
                No Chat Selected
              </h2>
              <Button onClick={createNewConversation}>Start a New Chat</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
