
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X } from "lucide-react";

interface ChatMessage {
  id: number;
  name: string;
  message: string;
  time: string;
  unread: boolean;
  temperature: "cold" | "cool" | "warm" | "hot";
}

const mockChats: ChatMessage[] = [
  {
    id: 1,
    name: "John Doe",
    message: "When can I see the property?",
    time: "10m ago",
    unread: true,
    temperature: "hot"
  },
  {
    id: 2,
    name: "Maria Garcia",
    message: "Thanks for the information.",
    time: "25m ago",
    unread: true,
    temperature: "warm"
  },
  {
    id: 3,
    name: "Alex Smith",
    message: "I'll think about it and get back to you.",
    time: "2h ago",
    unread: false,
    temperature: "cool"
  },
  {
    id: 4,
    name: "Sarah Johnson",
    message: "Can you send me more details?",
    time: "4h ago",
    unread: false,
    temperature: "cool"
  },
  {
    id: 5,
    name: "Michael Brown",
    message: "Not interested at this time.",
    time: "6h ago",
    unread: false,
    temperature: "cold"
  }
];

const ChatDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Count unread messages
  const unreadCount = mockChats.filter(chat => chat.unread).length;
  
  return (
    <>
      <Button 
        variant="outline" 
        className={`fixed bottom-4 right-4 shadow-lg z-10 ${isOpen ? 'hidden' : 'flex'}`}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Recent Chats
        {unreadCount > 0 && (
          <Badge className="ml-2 bg-temperature-hot">{unreadCount}</Badge>
        )}
      </Button>
      
      <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-20 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium">Recent WhatsApp Chats</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-60px)] p-3">
          {mockChats.map((chat) => (
            <Card key={chat.id} className={`mb-3 cursor-pointer hover:bg-gray-50 transition-colors ${chat.unread ? 'border-l-4 border-primary' : ''}`}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{chat.name}</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 bg-temperature-${chat.temperature}`}></div>
                    <span className="text-xs text-gray-500">{chat.time}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">{chat.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;
