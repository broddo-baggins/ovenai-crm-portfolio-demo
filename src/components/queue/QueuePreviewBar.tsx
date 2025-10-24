import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  MessageSquare,
  Zap,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/contexts/RTLContext';

interface QueuePreview {
  selectedCount: number;
  estimatedSendTime: Date;
  messagePreview: string;
  conflicts: Array<{
    leadId: string;
    leadName: string;
    conflict: 'already_queued' | 'invalid_phone' | 'opted_out';
    details: string;
  }>;
  capacityWarning?: {
    dailyLimit: number;
    currentUsage: number;
    willExceed: boolean;
  };
}

interface QueuePreviewBarProps {
  preview: QueuePreview;
  onQueue: () => void;
  onSchedule: () => void;
  onRemove: () => void;
  onCancel: () => void;
  loading: boolean;
  className?: string;
}

export const QueuePreviewBar: React.FC<QueuePreviewBarProps> = ({
  preview,
  onQueue,
  onSchedule,
  onRemove,
  onCancel,
  loading,
  className = ""
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const { isRTL } = useRTL();

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(isRTL ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const getConflictIcon = (conflict: string) => {
    switch (conflict) {
      case 'already_queued':
        return <Clock className="h-3 w-3" />;
      case 'invalid_phone':
        return <AlertTriangle className="h-3 w-3" />;
      case 'opted_out':
        return <X className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getConflictColor = (conflict: string) => {
    switch (conflict) {
      case 'already_queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'invalid_phone':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'opted_out':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const estimatedDuration = Math.ceil(preview.selectedCount * 2.5); // 2.5 minutes per lead on average

  return (
    <Card className={`sticky bottom-4 shadow-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Preview Information */}
          <div className="flex items-center gap-4">
            {/* Selected Count */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-blue-700">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{preview.selectedCount}</span>
              </div>
              <span className="text-sm text-gray-600">
                {t('queue.preview.leadsSelected', 'leads selected')}
              </span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Send Time */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-green-700">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{formatTime(preview.estimatedSendTime)}</span>
              </div>
              <span className="text-sm text-gray-600">
                {t('queue.preview.sendTime', 'send time')}
              </span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Duration Estimate */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-purple-700">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">{estimatedDuration}min</span>
              </div>
              <span className="text-sm text-gray-600">
                {t('queue.preview.duration', 'duration')}
              </span>
            </div>

            {/* Conflicts */}
            {preview.conflicts.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="destructive" 
                    className="flex items-center gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {preview.conflicts.length} {t('queue.preview.conflicts', 'conflicts')}
                  </Badge>
                </div>
              </>
            )}

            {/* Capacity Warning */}
            {preview.capacityWarning?.willExceed && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {t('queue.preview.capacityWarning', 'Capacity Warning')}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSchedule}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              {t('queue.actions.schedule', 'Schedule')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              {t('queue.actions.remove', 'Remove')}
            </Button>

            <Button
              onClick={onQueue}
              disabled={loading}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <MessageSquare className="h-4 w-4" />
              {loading ? 
                t('queue.actions.queueing', 'Queueing...') : 
                t('queue.actions.queueNow', 'Queue Now')
              }
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {t('queue.preview.messagePreview', 'Message Preview')}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {preview.messagePreview}
          </p>
        </div>

        {/* Conflicts Details */}
        {preview.conflicts.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {t('queue.preview.conflictsFound', 'Conflicts Found')}
              </span>
            </div>
            <div className="space-y-1">
              {preview.conflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getConflictColor(conflict.conflict)}`}>
                    {getConflictIcon(conflict.conflict)}
                    <span>{conflict.leadName}</span>
                  </div>
                  <span className="text-gray-600">{conflict.details}</span>
                </div>
              ))}
              {preview.conflicts.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{preview.conflicts.length - 3} {t('queue.preview.moreConflicts', 'more conflicts')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Capacity Warning Details */}
        {preview.capacityWarning?.willExceed && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {t('queue.preview.capacityWarning', 'Daily Capacity Warning')}
              </span>
            </div>
            <div className="text-sm text-orange-700">
              {t('queue.preview.capacityDetails', 'This will exceed your daily limit of {{limit}} leads. Current usage: {{usage}}', {
                limit: preview.capacityWarning.dailyLimit,
                usage: preview.capacityWarning.currentUsage
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 