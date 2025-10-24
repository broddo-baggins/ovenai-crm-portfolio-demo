import React, { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelList,
  MessageInput,
  MessageList,
  ChannelHeader,
  Thread,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

// Initialize Stream Chat client
const chatClient = StreamChat.getInstance(
  // For development, we'll use a demo API key
  // In production, you'd get this from your environment variables
  process.env.VITE_STREAM_CHAT_API_KEY || "your-stream-chat-api-key",
);

interface StreamChatProviderProps {
  children?: React.ReactNode;
  userId?: string;
  userToken?: string;
  userName?: string;
}

export const StreamChatProvider: React.FC<StreamChatProviderProps> = ({
  children,
  userId = "demo-user",
  userToken,
  userName = "Demo User",
}) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const setupClient = async () => {
      try {
        // For demo purposes, we'll create a user token
        // In production, this should come from your backend
        const user = {
          id: userId,
          name: userName,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=ffffff`,
        };

        // For development, you can use a development token
        // In production, generate this securely on your backend
        const token = userToken || chatClient.devToken(userId);

        await chatClient.connectUser(user, token);
        setClient(chatClient);
        setIsClientReady(true);
      } catch (error) {
        console.error("Failed to initialize Stream Chat:", error);
      }
    };

    setupClient();

    return () => {
      if (isClientReady) {
        chatClient.disconnectUser();
        setIsClientReady(false);
      }
    };
  }, [userId, userToken, userName, isClientReady]);

  if (!isClientReady || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Initializing Chat...</span>
      </div>
    );
  }

  return <Chat client={client}>{children}</Chat>;
};

// Enhanced Chat Interface Component
interface EnhancedChatInterfaceProps {
  channelId?: string;
  leadName?: string;
  leadPhone?: string;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  channelId = "general",
  leadName = "Lead",
  leadPhone,
}) => {
  const [activeChannel, setActiveChannel] = useState<any>(null);

  const filters = {
    type: "messaging",
    members: { $in: ["demo-user"] },
  };

  const sort = {
    last_message_at: -1 as const,
  };

  const options = {
    state: true,
    watch: true,
    presence: true,
  };

  const CustomChannelPreview = (props: any) => (
    <div className="p-3 hover:bg-gray-50 cursor-pointer border-b">
      <div className="flex justify-between items-start">
        <span className="font-medium">
          {props.channel?.data?.name || props.channel?.id || leadName}
        </span>
        <span className="text-xs text-gray-500">
          {props.lastMessage?.created_at
            ? new Date(props.lastMessage.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </span>
      </div>
      <p className="text-sm text-gray-600 truncate mt-1">
        {props.lastMessage?.text || "No messages yet"}
      </p>
      {leadPhone && <p className="text-xs text-gray-400 mt-1">{leadPhone}</p>}
    </div>
  );

  return (
    <div className="flex h-[600px] w-full border rounded-lg overflow-hidden bg-white">
      {/* Channel List Sidebar */}
      <div className="w-1/3 border-r">
        <ChannelList
          filters={filters}
          sort={sort}
          options={options}
          customActiveChannel={activeChannel}
          Preview={CustomChannelPreview}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <Channel channel={activeChannel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </div>
    </div>
  );
};

// Modern Chat Component with LlamaIndex-style UI
interface ModernChatComponentProps {
  messages?: Array<{
    id: string;
    content: string;
    sender: "user" | "assistant" | "lead";
    timestamp: string;
    type?: "text" | "media" | "system";
  }>;
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ModernChatComponent: React.FC<ModernChatComponentProps> = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
}) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border rounded-lg">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : message.sender === "assistant"
                    ? "bg-gray-100 text-gray-900 border"
                    : "bg-green-100 text-green-900 border border-green-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {message.type && message.type !== "text" && (
                  <span className="text-xs opacity-60 ml-2">
                    {message.type === "media" ? "📎" : "CONFIG"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 border">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
