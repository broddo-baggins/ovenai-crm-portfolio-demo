import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WidgetType } from "@/types/widgets";

interface WidgetLibraryProps {
  onAddWidget: (type: WidgetType) => void;
  onClose: () => void;
}

interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  category: "Core Metrics" | "CRM Analytics" | "Performance" | "Legacy";
  icon: string;
  calculation: string;
}

const widgetDefinitions: WidgetDefinition[] = [
  // Core Metrics
  {
    type: "total-leads",
    name: "Total Leads",
    description: "Total number of leads in your pipeline",
    category: "Core Metrics",
    icon: "USERS",
    calculation: "Count of all leads in the system",
  },
  {
    type: "reached-leads",
    name: "Reached Leads",
    description: "Number of leads that have been contacted",
    category: "Core Metrics",
    icon: "CALL",
    calculation: "Count of leads with at least one interaction",
  },
  {
    type: "total-chats",
    name: "Total Chats",
    description: "Total number of chat conversations",
    category: "Core Metrics",
    icon: "CHAT",
    calculation: "Count of all chat conversations",
  },
  {
    type: "conversations-completed",
    name: "Conversations Completed",
    description: "Number of successfully completed conversations",
    category: "Core Metrics",
    icon: "SUCCESS",
    calculation: "Count of conversations marked as completed",
  },

  // CRM Analytics (New widgets)
  {
    type: "conversation-abandoned-with-stage",
    name: "Conversation Abandonment",
    description: "Conversations dropped without reply, tracked by stage",
    category: "CRM Analytics",
    icon: "DATA",
    calculation:
      "No reply after threshold time, categorized by conversation stage",
  },
  {
    type: "mean-time-to-first-reply",
    name: "Mean Time to First Reply",
    description: "Average time between message sent and first reply",
    category: "CRM Analytics",
    icon: "TIMER",
    calculation: "Sum of response times / Number of responses",
  },
  {
    type: "average-messages-per-client",
    name: "Average Messages Per Client",
    description: "Average number of messages exchanged per client",
    category: "CRM Analytics",
    icon: "DATA",
    calculation: "Total messages / Number of unique clients",
  },
  {
    type: "most-efficient-response-hours",
    name: "Most Efficient Response Hours",
    description: "Hours with highest reply rates and shortest response times",
    category: "Performance",
    icon: "TARGET",
    calculation: "Efficiency score based on reply rate and response time",
  },
  {
    type: "meetings-set-percentage",
    name: "Meetings Set Percentage",
    description: "Ratio of meetings scheduled to initial messages sent",
    category: "Performance",
    icon: "CALENDAR",
    calculation: "(Meetings scheduled / Initial outbound messages) × 100",
  },

  // Additional widgets
  {
    type: "lead-temperature",
    name: "Lead Temperature",
    description: "Detailed lead temperature analysis with trends",
    category: "CRM Analytics",
    icon: "HOT",
    calculation: "Hot/warm/cold classification based on engagement levels",
  },
  {
    type: "lead-funnel",
    name: "Lead Funnel",
    description: "Visual representation of lead progression through stages",
    category: "CRM Analytics",
    icon: "DATA",
    calculation: "Lead count by stage with conversion rates",
  },
  {
    type: "hourly-activity",
    name: "Hourly Activity",
    description: "Message activity distribution by hour of day",
    category: "Performance",
    icon: "⏰",
    calculation: "Message count grouped by hour with peak identification",
  },
  {
    type: "message-hourly-distribution",
    name: "Message Distribution",
    description: "Hourly message volume analysis",
    category: "Performance",
    icon: "STATS",
    calculation: "Messages sent/received per hour with trends",
  },
  {
    type: "messages-sent",
    name: "Messages Sent",
    description: "Total outbound messages with automation breakdown",
    category: "Performance",
    icon: "📤",
    calculation: "Count of outbound messages, automated vs manual",
  },
  {
    type: "interactions",
    name: "Interactions",
    description: "Total customer interactions including clicks and replies",
    category: "Performance",
    icon: "REFRESH",
    calculation: "Sum of all customer engagement actions",
  },
  {
    type: "conversations-started",
    name: "Conversations Started",
    description: "New conversations initiated with customers",
    category: "Performance",
    icon: "CHAT",
    calculation: "Count of first-time customer interactions",
  },

  // Legacy widgets
  {
    type: "conversations-abandoned",
    name: "Conversations Abandoned (Legacy)",
    description: "Basic conversation abandonment tracking",
    category: "Legacy",
    icon: "📉",
    calculation: "Simple count of abandoned conversations",
  },
  {
    type: "mean-response-time",
    name: "Mean Response Time (Legacy)",
    description: "Basic response time tracking",
    category: "Legacy",
    icon: "⏰",
    calculation: "Average response time calculation",
  },
  {
    type: "avg-messages-per-customer",
    name: "Avg Messages Per Customer (Legacy)",
    description: "Legacy customer message tracking",
    category: "Legacy",
    icon: "USERS",
    calculation: "Basic message per customer calculation",
  },
  {
    type: "temperature-distribution",
    name: "Temperature Distribution (Legacy)",
    description: "Basic temperature analysis",
    category: "Legacy",
    icon: "🌡️",
    calculation: "Simple temperature categorization",
  },
  {
    type: "property-stats",
    name: "Property Stats (Legacy)",
    description: "Basic property statistics",
    category: "Legacy",
    icon: "HOME",
    calculation: "Property-related metrics",
  },
];

const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onAddWidget,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Core Metrics",
    "CRM Analytics",
    "Performance",
    "Legacy",
  ];

  const filteredWidgets = widgetDefinitions.filter((widget) => {
    const matchesSearch =
      widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddWidget = (type: WidgetType) => {
    onAddWidget(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Widget Library</h2>
            <p className="text-sm text-muted-foreground">
              Add widgets to your dashboard
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Widget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
            {filteredWidgets.map((widget) => (
              <Card
                key={widget.type}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{widget.icon}</span>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {widget.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {widget.category}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddWidget(widget.type)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    {widget.description}
                  </p>
                  <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    <strong>Calculation:</strong> {widget.calculation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWidgets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No widgets found matching your criteria.</p>
              <p className="text-sm">
                Try adjusting your search or category filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetLibrary;
