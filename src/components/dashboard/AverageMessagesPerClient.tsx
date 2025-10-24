import React from 'react';
import { MessageSquare, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { WidgetSettings } from '@/types/widgets';

interface AverageMessagesPerClientProps {
  settings?: WidgetSettings;
  data?: {
    average: number;
    trend: number;
    timeRange: string;
    totalMessages: number;
    totalClients: number;
    distribution: {
      low: number; // 1-5 messages
      medium: number; // 6-15 messages
      high: number; // 16+ messages
    };
    topClients: Array<{
      name: string;
      messageCount: number;
    }>;
  };
}

const mockData = {
  average: 8.4,
  trend: 15.2,
  timeRange: 'This Week',
  totalMessages: 2847,
  totalClients: 339,
  distribution: {
    low: 156,
    medium: 142,
    high: 41
  },
  topClients: [
    { name: 'Client A', messageCount: 47 },
    { name: 'Client B', messageCount: 38 },
    { name: 'Client C', messageCount: 32 }
  ]
};

/**
 * Calculation Logic:
 * - Average: Total messages exchanged / Number of unique clients
 * - Includes both sent and received messages per conversation
 * - Distribution: Low (1-5), Medium (6-15), High (16+) messages
 * - Can be filtered by project, user, date range
 * - Excludes system messages and automated responses
 */
const AverageMessagesPerClient: React.FC<AverageMessagesPerClientProps> = ({ 
  settings, 
  data = mockData 
}) => {
  const isPositive = data.trend >= 0;
  const calculationMethod = settings?.calculationMethod || 'average';

  // Calculate percentages for distribution
  const totalInDistribution = data.distribution.low + data.distribution.medium + data.distribution.high;
  const lowPercentage = ((data.distribution.low / totalInDistribution) * 100).toFixed(1);
  const mediumPercentage = ((data.distribution.medium / totalInDistribution) * 100).toFixed(1);
  const highPercentage = ((data.distribution.high / totalInDistribution) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Avg Messages Per Client</p>
          <h2 className="text-3xl font-bold">{data.average.toFixed(1)}</h2>
          <p className="text-sm text-muted-foreground">
            {calculationMethod === 'median' ? 'Median' : 'Average'} per conversation
          </p>
        </div>
        <MessageSquare className="h-8 w-8 text-purple-500" />
      </div>
      
      <div className="flex items-center space-x-2">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {Math.abs(data.trend)}% {isPositive ? 'increase' : 'decrease'}
        </span>
        <span className="text-sm text-muted-foreground">vs {data.timeRange}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{data.totalMessages.toLocaleString()}</p>
            <p className="text-muted-foreground">Total Messages</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{data.totalClients.toLocaleString()}</p>
            <p className="text-muted-foreground">Unique Clients</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Message Distribution</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Low (1-5):</span>
            <span className="font-medium">{data.distribution.low} ({lowPercentage}%)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Medium (6-15):</span>
            <span className="font-medium">{data.distribution.medium} ({mediumPercentage}%)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">High (16+):</span>
            <span className="font-medium">{data.distribution.high} ({highPercentage}%)</span>
          </div>
        </div>
      </div>

      {data.topClients.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium text-muted-foreground">Most Active Clients</p>
          <div className="space-y-1">
            {data.topClients.slice(0, 3).map((client, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate">{client.name}</span>
                <span className="font-medium">{client.messageCount} msgs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AverageMessagesPerClient; 