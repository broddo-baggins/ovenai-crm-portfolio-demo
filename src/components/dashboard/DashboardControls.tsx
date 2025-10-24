import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WidgetType } from '@/types/widgets';
import { useGenerateReport } from "@/hooks/useReports";
import { toast } from "sonner";

interface DashboardControlsProps {
  onAddWidget: (type: WidgetType) => void;
  showOnDashboard?: boolean;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  onAddWidget,
  showOnDashboard = false,
}) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const generateReport = useGenerateReport();

  const handleGenerateReport = () => {
    toast.info("Connecting to AWS for report generation...");
    generateReport.mutate({ type: 'daily' });
  };

  const handleAddWidget = (type: WidgetType) => {
    onAddWidget(type);
    setIsAddingWidget(false);
  };

  // Only show on dashboard page
  if (!showOnDashboard) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleGenerateReport}
        disabled={generateReport.isPending}
        variant="outline"
        size="sm"
      >
        {generateReport.isPending ? "Generating..." : "Generate Report"}
      </Button>
      <DropdownMenu open={isAddingWidget} onOpenChange={setIsAddingWidget}>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard:controls.addWidget', 'Add Widget')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-80 overflow-y-auto">
          <DropdownMenuItem onClick={() => handleAddWidget('lead-funnel')}>
            {t('dashboard:widgets.leadFunnel', 'Lead Funnel')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('total-chats')}>
            {t('dashboard:widgets.totalChats', 'Total Chats')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('messages-sent')}>
            {t('dashboard:widgets.messagesSent', 'Messages Sent')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('interactions')}>
            {t('dashboard:widgets.interactions', 'Interactions')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('conversations-started')}>
            {t('dashboard:widgets.conversationsStarted', 'Conversations Started')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('conversations-completed')}>
            {t('dashboard:widgets.conversationsCompleted', 'Conversations Completed')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('conversations-abandoned')}>
            {t('dashboard:widgets.conversationsAbandoned', 'Conversations Abandoned')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('mean-response-time')}>
            {t('dashboard:widgets.meanResponseTime', 'Mean Response Time')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('avg-messages-per-customer')}>
            {t('dashboard:widgets.avgMessagesPerCustomer', 'Avg Messages Per Customer')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('meetings-vs-messages')}>
            {t('dashboard:widgets.meetingsVsMessages', 'Meetings vs Messages')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('property-stats')}>
            {t('dashboard:widgets.propertyStats', 'Property Stats')}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleAddWidget('temperature-distribution')}>
            Temperature Distribution
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('hourly-activity')}>
            Hourly Activity
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddWidget('message-hourly-distribution')}>
            Message Hourly Distribution
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DashboardControls; 