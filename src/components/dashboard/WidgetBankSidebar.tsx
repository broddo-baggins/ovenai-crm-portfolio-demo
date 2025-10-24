import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";
import { WidgetType } from "@/types/widgets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";

interface WidgetBankSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddWidget: (type: WidgetType) => void;
}

interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  category: "Core Metrics" | "CRM Analytics" | "Performance" | "Legacy";
  icon: string;
  calculation: string;
  popularity: number; // 1-5 rating for sorting
}

const widgetDefinitions: WidgetDefinition[] = [
  // Core Metrics (Most Popular)
  {
    type: "total-leads",
    name: "Total Leads",
    description: "Total number of leads in your pipeline",
    category: "Core Metrics",
    icon: "USERS",
    calculation: "Count of all leads in the system",
    popularity: 5,
  },
  {
    type: "reached-leads",
    name: "Reached Leads",
    description: "Number of leads that have been contacted",
    category: "Core Metrics",
    icon: "CALL",
    calculation: "Count of leads with at least one interaction",
    popularity: 5,
  },
  {
    type: "total-chats",
    name: "Total Chats",
    description: "Total number of chat conversations",
    category: "Core Metrics",
    icon: "CHAT",
    calculation: "Count of all chat conversations",
    popularity: 4,
  },
  {
    type: "conversations-completed",
    name: "Conversations Completed",
    description: "Number of successfully completed conversations",
    category: "Core Metrics",
    icon: "SUCCESS",
    calculation: "Count of conversations marked as completed",
    popularity: 4,
  },

  // CRM Analytics (High Value)
  {
    type: "lead-funnel",
    name: "Lead Funnel",
    description: "Visual representation of lead progression through stages",
    category: "CRM Analytics",
    icon: "DATA",
    calculation: "Lead count by stage with conversion rates",
    popularity: 5,
  },
  {
    type: "lead-temperature",
    name: "Lead Temperature",
    description: "Detailed lead temperature analysis with trends",
    category: "CRM Analytics",
    icon: "HOT",
    calculation: "Hot/warm/cold classification based on engagement levels",
    popularity: 4,
  },
  {
    type: "conversation-abandoned-with-stage",
    name: "Conversation Abandonment",
    description: "Conversations dropped without reply, tracked by stage",
    category: "CRM Analytics",
    icon: "DATA",
    calculation:
      "No reply after threshold time, categorized by conversation stage",
    popularity: 4,
  },
  {
    type: "mean-time-to-first-reply",
    name: "Mean Time to First Reply",
    description: "Average time between message sent and first reply",
    category: "CRM Analytics",
    icon: "TIMER",
    calculation: "Sum of response times / Number of responses",
    popularity: 3,
  },
  {
    type: "average-messages-per-client",
    name: "Average Messages Per Client",
    description: "Average number of messages exchanged per client",
    category: "CRM Analytics",
    icon: "DATA",
    calculation: "Total messages / Number of unique clients",
    popularity: 3,
  },

  // Performance Metrics
  {
    type: "most-efficient-response-hours",
    name: "Most Efficient Response Hours",
    description: "Hours with highest reply rates and shortest response times",
    category: "Performance",
    icon: "TARGET",
    calculation: "Efficiency score based on reply rate and response time",
    popularity: 4,
  },
  {
    type: "meetings-set-percentage",
    name: "Meetings Set Percentage",
    description: "Ratio of meetings scheduled to initial messages sent",
    category: "Performance",
    icon: "CALENDAR",
    calculation: "(Meetings scheduled / Initial outbound messages) × 100",
    popularity: 4,
  },
  {
    type: "hourly-activity",
    name: "Hourly Activity",
    description: "Message activity distribution by hour of day",
    category: "Performance",
    icon: "⏰",
    calculation: "Message count grouped by hour with peak identification",
    popularity: 3,
  },
  {
    type: "message-hourly-distribution",
    name: "Message Distribution",
    description: "Hourly message volume analysis",
    category: "Performance",
    icon: "STATS",
    calculation: "Messages sent/received per hour with trends",
    popularity: 3,
  },
  {
    type: "messages-sent",
    name: "Messages Sent",
    description: "Total outbound messages with automation breakdown",
    category: "Performance",
    icon: "📤",
    calculation: "Count of outbound messages, automated vs manual",
    popularity: 3,
  },
  {
    type: "interactions",
    name: "Interactions",
    description: "Total customer interactions including clicks and replies",
    category: "Performance",
    icon: "REFRESH",
    calculation: "Sum of all customer engagement actions",
    popularity: 3,
  },
  {
    type: "conversations-started",
    name: "Conversations Started",
    description: "New conversations initiated with customers",
    category: "Performance",
    icon: "CHAT",
    calculation: "Count of first-time customer interactions",
    popularity: 2,
  },

  // Legacy widgets (Lower priority)
  {
    type: "conversations-abandoned",
    name: "Conversations Abandoned (Legacy)",
    description: "Basic conversation abandonment tracking",
    category: "Legacy",
    icon: "📉",
    calculation: "Simple count of abandoned conversations",
    popularity: 1,
  },
  {
    type: "mean-response-time",
    name: "Mean Response Time (Legacy)",
    description: "Basic response time tracking",
    category: "Legacy",
    icon: "⏰",
    calculation: "Average response time calculation",
    popularity: 1,
  },
  {
    type: "avg-messages-per-customer",
    name: "Avg Messages Per Customer (Legacy)",
    description: "Legacy customer message tracking",
    category: "Legacy",
    icon: "USERS",
    calculation: "Basic message per customer calculation",
    popularity: 1,
  },
  {
    type: "temperature-distribution",
    name: "Temperature Distribution (Legacy)",
    description: "Basic temperature analysis",
    category: "Legacy",
    icon: "🌡️",
    calculation: "Simple temperature categorization",
    popularity: 1,
  },
  {
    type: "property-stats",
    name: "Property Stats (Legacy)",
    description: "Basic property statistics",
    category: "Legacy",
    icon: "HOME",
    calculation: "Property-related metrics",
    popularity: 1,
  },
];

const WidgetBankSidebar: React.FC<WidgetBankSidebarProps> = ({
  isOpen,
  onToggle,
  onAddWidget,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { t } = useTranslation(["widgets", "common"]);
  const { isRTL, textStart } = useLang();

  const categories = [
    { key: "All", label: t("widgets:bank.categories.all") },
    { key: "Core Metrics", label: t("widgets:bank.categories.coreMetrics") },
    { key: "CRM Analytics", label: t("widgets:bank.categories.crmAnalytics") },
    { key: "Performance", label: t("widgets:bank.categories.performance") },
    { key: "Legacy", label: t("widgets:bank.categories.legacy") },
  ];

  const filteredWidgets = widgetDefinitions
    .filter((widget) => {
      const matchesSearch =
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || widget.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by popularity first, then alphabetically
      if (a.popularity !== b.popularity) {
        return b.popularity - a.popularity;
      }
      return a.name.localeCompare(b.name);
    });

  const handleAddWidget = (type: WidgetType) => {
    onAddWidget(type);
  };

  const getPopularityBadge = (popularity: number) => {
    if (popularity >= 5)
      return {
        label: t("widgets:bank.badges.popular"),
        variant: "default" as const,
      };
    if (popularity >= 4)
      return {
        label: t("widgets:bank.badges.recommended"),
        variant: "secondary" as const,
      };
    if (popularity >= 3)
      return {
        label: t("widgets:bank.badges.useful"),
        variant: "outline" as const,
      };
    return null;
  };

  return (
    <TooltipProvider>
      <div
        className={`fixed top-0 h-full bg-white shadow-lg transition-all duration-300 z-50 ${
          isRTL
            ? "left-0 border-r border-gray-200"
            : "right-0 border-l border-gray-200"
        } ${isOpen ? "w-80" : "w-12"}`}
      >
        {/* Toggle Button */}
        <div className={`absolute top-4 ${isRTL ? "-right-6" : "-left-6"}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggle}
                className={`h-12 w-12 ${
                  isRTL
                    ? "rounded-r-lg rounded-l-none border-l-0"
                    : "rounded-l-lg rounded-r-none border-r-0"
                } bg-white shadow-md hover:bg-gray-50`}
              >
                {isOpen ? (
                  isRTL ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                ) : isRTL ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isRTL ? "right" : "left"}>
              {isOpen
                ? t("widgets:bank.tooltips.close")
                : t("widgets:bank.tooltips.open")}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Sidebar Content */}
        {isOpen && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div
                className={`flex items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <h3
                  className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  {t("widgets:bank.title")}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search
                  className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`}
                />
                <Input
                  placeholder={t("widgets:bank.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-9 ${isRTL ? "pr-10 text-right" : "pl-10 text-left"}`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <Button
                    key={category.key}
                    variant={
                      selectedCategory === category.key ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.key)}
                    className="h-7 px-2 text-xs"
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Widget List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {filteredWidgets.map((widget) => {
                  const popularityBadge = getPopularityBadge(widget.popularity);

                  return (
                    <Card
                      key={widget.type}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <CardHeader className="pb-2">
                        <div
                          className={`flex items-start justify-between ${isRTL ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`flex items-center space-x-2 flex-1 min-w-0 ${isRTL ? "flex-row-reverse space-x-reverse" : ""}`}
                          >
                            <span className="text-lg">{widget.icon}</span>
                            <div className={`min-w-0 flex-1 ${textStart()}`}>
                              <CardTitle
                                className={`text-sm font-medium truncate ${textStart()}`}
                              >
                                {widget.name}
                              </CardTitle>
                              <div
                                className={`flex items-center gap-1 mt-1 ${isRTL ? "flex-row-reverse" : ""}`}
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {widget.category}
                                </Badge>
                                {popularityBadge && (
                                  <Badge
                                    variant={popularityBadge.variant}
                                    className="text-xs"
                                  >
                                    {popularityBadge.label}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddWidget(widget.type)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p
                          className={`text-xs text-gray-600 mb-2 ${textStart()}`}
                        >
                          {widget.description}
                        </p>
                        <div
                          className={`text-xs text-gray-500 bg-gray-50 p-2 rounded ${textStart()}`}
                        >
                          <strong>{t("widgets:bank.calculation")}</strong>{" "}
                          {widget.calculation}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredWidgets.length === 0 && (
                <div
                  className={`text-center py-8 text-gray-500 ${textStart()}`}
                >
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("widgets:bank.noResults")}</p>
                  <p className="text-xs">{t("widgets:bank.adjustFilters")}</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default WidgetBankSidebar;
