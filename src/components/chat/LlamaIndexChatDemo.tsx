import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface LlamaIndexChatDemoProps {
  className?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const LlamaIndexChatDemo: React.FC<LlamaIndexChatDemoProps> = ({
  className,
}) => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. How can I help you with your leads today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = React.useState("");

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you're asking about: "${input}". This is a demo of the LlamaIndex chat UI integration. In a real implementation, this would connect to your AI model for intelligent lead assistance.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">
          LlamaIndex Chat UI Integration
        </CardTitle>
        <CardDescription>
          AI-powered chat interface for lead assistance (Demo)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] flex flex-col space-y-4">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900 border"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleMessageSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your leads..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default LlamaIndexChatDemo;
