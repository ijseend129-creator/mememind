import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, MessageCircle, Sparkles, Zap, Share2, Users } from "lucide-react";
import skullImage from "@/assets/skull.png";

const FloatingEmoji = ({ emoji, className }: { emoji: string; className: string }) => (
  <span className={`absolute text-2xl sm:text-4xl md:text-6xl select-none pointer-events-none hidden sm:block ${className}`}>
    {emoji}
  </span>
);

const FloatingImage = ({ src, className }: { src: string; className: string }) => (
  <img src={src} alt="" className={`absolute w-12 sm:w-16 md:w-24 select-none pointer-events-none hidden sm:block ${className}`} />
);

const Index = () => {
  const navigate = useNavigate();

  const trendingTopics = [
    "Skibidi Toilet Lore Explained",
    "Why everyone's obsessed with NPC streams",
    "Sigma edits: cringe or peak?",
    "Rizz tier lists (yes, including you)",
    "Who would win: Shrek vs. anyone",
    "2025's wildest memes so far",
  ];

  const testimonials = [
    { quote: "Bro I lost braincells and gained enlightenment.", author: "literally someone on Discord" },
    { quote: "MemeMind knows too much.", author: "paranoid TikTok user" },
    { quote: "Peak NPC energy.", author: "you, probably" },
  ];

  const features = [
    { icon: Brain, title: "Decode meme trends", color: "text-neon-pink" },
    { icon: MessageCircle, title: "Survive Gen Z slang", color: "text-neon-cyan" },
    { icon: Sparkles, title: "Start convos with ✨delulu✨ confidence", color: "text-neon-yellow" },
    { icon: Zap, title: "Sound like you live on TikTok", color: "text-neon-green" },
  ];

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-chaos animate-gradient opacity-50" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Floating emojis */}
      <FloatingEmoji emoji="🧠" className="top-20 left-[10%] animate-float" />
      <FloatingImage src={skullImage} className="top-40 right-[15%] animate-float-delayed" />
      <FloatingEmoji emoji="🔥" className="top-[60%] left-[5%] animate-bounce-slow" />
      <FloatingEmoji emoji="✨" className="top-[30%] right-[8%] animate-pulse-glow" />
      <FloatingEmoji emoji="🗿" className="bottom-40 left-[20%] animate-float" />
      <FloatingEmoji emoji="💅" className="bottom-20 right-[25%] animate-float-delayed" />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur border border-border">
              <span className="animate-pulse-glow">🌐</span>
              <span className="text-sm text-muted-foreground">Your Daily Dose of Delulu, Rizz & Lore</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-gradient mb-4 md:mb-6 tracking-wide">
              MemeMind
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-foreground/90 mb-3 md:mb-4 max-w-2xl mx-auto leading-relaxed">
              The AI chatbot that speaks fluent TikTok, knows the entire internet's lore, and drops{" "}
              <span className="text-neon-cyan font-bold">W takes</span> only.
            </p>
            
            <p className="text-sm sm:text-lg text-muted-foreground mb-6 md:mb-8">
              Talk to MemeMind. Get smarter? Maybe. Get unhinged? <span className="text-neon-pink">For sure.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-bold glow-pink transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Chatting <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </Button>
            </div>

            <p className="text-muted-foreground italic">
              "What's the backstory of Grimace Shake?"
            </p>
          </div>
        </section>

        {/* Trending Topics */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-center mb-8 md:mb-12 text-gradient">
              🔥 Trending Topics MemeMind Can Break Down
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingTopics.map((topic, index) => (
                <div
                  key={topic}
                  className="group p-6 rounded-xl bg-card/60 backdrop-blur border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <p className="text-lg font-medium group-hover:text-primary transition-colors">
                    {topic}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-center mb-8 md:mb-12 text-gradient">
              🗨️ What People Are Saying
            </h2>
            
            <div className="space-y-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.quote}
                  className="p-6 rounded-xl bg-card/60 backdrop-blur border border-border"
                >
                  <p className="text-xl italic mb-2">"{testimonial.quote}"</p>
                  <p className="text-muted-foreground">– {testimonial.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-center mb-8 md:mb-12 text-gradient">
              📱 Use MemeMind to:
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-6 rounded-xl bg-card/60 backdrop-blur border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  <p className="text-lg font-medium">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl mb-4 md:mb-6 text-gradient">
              👾 Wanna try?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8">
              Tap to chat with MemeMind now.<br />
              <span className="text-neon-yellow">No cringe, all chaos.</span>
            </p>

            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-6 text-lg font-bold glow-cyan transition-all duration-300 hover:scale-105"
            >
              Start Chatting Now →
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-muted-foreground">
              Built with 🧠 by the internet, for the internet
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
