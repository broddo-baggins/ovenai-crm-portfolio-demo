import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  Info,
} from "lucide-react";

interface PromptSuggestion {
  id: string;
  text: string;
  category:
    | "greeting"
    | "scheduling"
    | "qualification"
    | "closing"
    | "information";
  icon?: React.ReactNode;
  shortcut?: string;
}

interface ChatPromptSuggestionsProps {
  onSuggestionClick: (suggestion: PromptSuggestion) => void;
  leadStatus?: string;
  className?: string;
}

export const ChatPromptSuggestions: React.FC<ChatPromptSuggestionsProps> = ({
  onSuggestionClick,
  leadStatus,
  className,
}) => {
  // Dynamic suggestions based on lead status and context
  const getContextualSuggestions = (): PromptSuggestion[] => {
    const baseSuggestions: PromptSuggestion[] = [
      {
        id: "greeting",
        text: "Hi! Thanks for your interest. How can I help you today?",
        category: "greeting",
        icon: <MessageCircle className="h-3 w-3" />,
        shortcut: "Ctrl+1",
      },
      {
        id: "schedule",
        text: "Would you like to schedule a call to discuss this further?",
        category: "scheduling",
        icon: <Calendar className="h-3 w-3" />,
        shortcut: "Ctrl+2",
      },
      {
        id: "phone",
        text: "Can I get your phone number for follow-up?",
        category: "qualification",
        icon: <Phone className="h-3 w-3" />,
        shortcut: "Ctrl+3",
      },
      {
        id: "info",
        text: "Let me send you more information about our services.",
        category: "information",
        icon: <Info className="h-3 w-3" />,
        shortcut: "Ctrl+4",
      },
    ];

    // Add status-specific suggestions
    switch (leadStatus?.toLowerCase()) {
      case "new":
      case "cold":
        return [
          ...baseSuggestions,
          {
            id: "qualification",
            text: "What specific challenges are you looking to solve?",
            category: "qualification",
            icon: <MessageCircle className="h-3 w-3" />,
          },
          {
            id: "budget",
            text: "Do you have a budget range in mind for this project?",
            category: "qualification",
            icon: <MessageCircle className="h-3 w-3" />,
          },
        ];

      case "warm":
      case "engaged":
        return [
          ...baseSuggestions,
          {
            id: "proposal",
            text: "I'd like to prepare a custom proposal for you.",
            category: "closing",
            icon: <CheckCircle className="h-3 w-3" />,
          },
          {
            id: "timeline",
            text: "What's your preferred timeline for moving forward?",
            category: "qualification",
            icon: <Clock className="h-3 w-3" />,
          },
        ];

      case "qualified":
        return [
          ...baseSuggestions,
          {
            id: "next_steps",
            text: "What would you like to know to move to the next step?",
            category: "closing",
            icon: <CheckCircle className="h-3 w-3" />,
          },
          {
            id: "demo",
            text: "Would you like to see a demo of our solution?",
            category: "closing",
            icon: <MessageCircle className="h-3 w-3" />,
          },
        ];

      default:
        return baseSuggestions;
    }
  };

  const suggestions = getContextualSuggestions();

  const getCategoryColor = (category: PromptSuggestion["category"]) => {
    switch (category) {
      case "greeting":
        return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
      case "scheduling":
        return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
      case "qualification":
        return "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700";
      case "closing":
        return "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700";
      case "information":
        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
      default:
        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          Quick Responses
        </span>
        {leadStatus && (
          <Badge variant="secondary" className="text-xs">
            {leadStatus}
          </Badge>
        )}
      </div>

      <div className="grid gap-2">
        {suggestions.slice(0, 6).map((suggestion) => (
          <Button
            key={suggestion.id}
            variant="outline"
            className={`h-auto p-3 text-left justify-start ${getCategoryColor(suggestion.category)} transition-all duration-200`}
            onClick={() => onSuggestionClick(suggestion)}
          >
            <div className="flex items-start gap-2 w-full">
              {suggestion.icon && (
                <div className="flex-shrink-0 mt-0.5">{suggestion.icon}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {suggestion.text}
                </p>
                {suggestion.shortcut && (
                  <p className="text-xs opacity-60 mt-1">
                    {suggestion.shortcut}
                  </p>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>

      <div className="text-xs text-gray-500 text-center pt-2 border-t">
        Click a suggestion to use it or press Ctrl+1-4 for quick access
      </div>
    </div>
  );
};

export default ChatPromptSuggestions;
