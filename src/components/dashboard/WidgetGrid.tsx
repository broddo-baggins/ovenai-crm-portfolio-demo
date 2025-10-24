import { WidgetConfig } from '@/types/widgets';
import DraggableWidget from './DraggableWidget';
import LeadFunnel from './LeadFunnel';
import TotalChats from './TotalChats';
import PropertyStats from './PropertyStats';

import TemperatureDistribution from './TemperatureDistribution';
import HourlyActivity from './HourlyActivity';
import MessagesSent from './MessagesSent';
import Interactions from './Interactions';
import ConversationsStarted from './ConversationsStarted';
import ConversationsCompleted from './ConversationsCompleted';
import ConversationsAbandoned from './ConversationsAbandoned';
import MeanResponseTime from './MeanResponseTime';
import AvgMessagesPerCustomer from './AvgMessagesPerCustomer';
import MeetingsVsMessages from './MeetingsVsMessages';

interface WidgetGridProps {
  widgets: WidgetConfig[];
  onUpdateWidget: (config: WidgetConfig) => void;
  onRemoveWidget: (id: string) => void;
}

const WidgetGrid = ({ widgets, onUpdateWidget, onRemoveWidget }: WidgetGridProps) => {

  const renderWidget = (config: WidgetConfig) => {
    const commonProps = {
      config,
      onUpdate: onUpdateWidget,
      onRemove: onRemoveWidget
    };

    switch (config.type) {
      case 'lead-funnel':
        return (
          <DraggableWidget {...commonProps}>
            <LeadFunnel />
          </DraggableWidget>
        );
      case 'total-chats':
        return (
          <DraggableWidget {...commonProps}>
            <TotalChats title={config.title} />
          </DraggableWidget>
        );
      case 'property-stats':
        return (
          <DraggableWidget {...commonProps}>
            <PropertyStats title={config.title} />
          </DraggableWidget>
        );

      case 'temperature-distribution':
        return (
          <DraggableWidget {...commonProps}>
            <TemperatureDistribution />
          </DraggableWidget>
        );
      case 'hourly-activity':
        return (
          <DraggableWidget {...commonProps}>
            <HourlyActivity />
          </DraggableWidget>
        );
      case 'messages-sent':
        return (
          <DraggableWidget {...commonProps}>
            <MessagesSent />
          </DraggableWidget>
        );
      case 'interactions':
        return (
          <DraggableWidget {...commonProps}>
            <Interactions />
          </DraggableWidget>
        );
      case 'conversations-started':
        return (
          <DraggableWidget {...commonProps}>
            <ConversationsStarted />
          </DraggableWidget>
        );
      case 'conversations-completed':
        return (
          <DraggableWidget {...commonProps}>
            <ConversationsCompleted />
          </DraggableWidget>
        );
      case 'conversations-abandoned':
        return (
          <DraggableWidget {...commonProps}>
            <ConversationsAbandoned />
          </DraggableWidget>
        );
      case 'mean-response-time':
        return (
          <DraggableWidget {...commonProps}>
            <MeanResponseTime />
          </DraggableWidget>
        );
      case 'avg-messages-per-customer':
        return (
          <DraggableWidget {...commonProps}>
            <AvgMessagesPerCustomer />
          </DraggableWidget>
        );
      case 'meetings-vs-messages':
        return (
          <DraggableWidget {...commonProps}>
            <MeetingsVsMessages title={config.title} />
          </DraggableWidget>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-[800px] p-4">
      <div className="relative">
        {widgets.map(widget => (
          <div key={widget.id}>
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WidgetGrid; 