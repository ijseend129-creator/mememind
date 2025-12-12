import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, User, ArrowLeft, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const Share = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Shared Conversation");

  useEffect(() => {
    loadSharedConversation();
  }, [shareId]);

  const loadSharedConversation = async () => {
    if (!shareId) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    try {
      // Find conversation by share_id
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id, title, is_public")
        .eq("share_id", shareId)
        .maybeSingle();

      if (convError) throw convError;

      if (!conversation) {
        setError("Conversation not found");
        setLoading(false);
        return;
      }

      if (!conversation.is_public) {
        setError("This conversation is private");
        setLoading(false);
        return;
      }

      setTitle(conversation.title);

      // Load messages
      const { data: msgs, error: msgsError } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (msgsError) throw msgsError;

      setMessages(msgs as Message[] || []);
    } catch (err: any) {
      console.error("Error loading conversation:", err);
      setError("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied! 🔗",
      description: "Share this conversation with anyone.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">{error}</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <div>
              <h1 className="font-display text-xl text-gradient">{title}</h1>
              <p className="text-xs text-muted-foreground">Shared MemeMind conversation</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            <Share2 className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[70%] p-4 rounded-2xl ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-secondary" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto p-4 border-t border-border mt-8">
        <div className="text-center py-8">
          <h2 className="font-display text-2xl text-gradient mb-2">
            Want to chat with MemeMind?
          </h2>
          <p className="text-muted-foreground mb-4">
            Create your own unhinged conversations
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary/90 glow-pink"
          >
            Start Chatting →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Share;
