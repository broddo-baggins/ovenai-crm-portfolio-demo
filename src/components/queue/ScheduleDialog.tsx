import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLang';

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduleData: ScheduleData) => void;
  selectedLeadsCount: number;
  loading?: boolean;
}

export interface ScheduleData {
  scheduledDate: Date;
  priority: 'low' | 'normal' | 'high' | 'immediate';
  timeOption: 'specific' | 'business_hours' | 'optimal';
  specificTime?: string;
  message?: string;
  respectBusinessHours: boolean;
  notes?: string;
}

export const ScheduleDialog: React.FC<ScheduleDialogProps> = ({
  isOpen,
  onClose,
  onSchedule,
  selectedLeadsCount,
  loading = false
}) => {
  const { isRTL, textStart } = useLang();
  
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    priority: 'normal',
    timeOption: 'business_hours',
    respectBusinessHours: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate date
    if (scheduleData.scheduledDate < new Date()) {
      newErrors.scheduledDate = 'Cannot schedule in the past';
    }

    // Validate specific time if selected
    if (scheduleData.timeOption === 'specific' && !scheduleData.specificTime) {
      newErrors.specificTime = 'Please specify a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSchedule = () => {
    if (validateForm()) {
      onSchedule(scheduleData);
    }
  };

  const handleDateChange = (dateString: string) => {
    setScheduleData(prev => ({
      ...prev,
      scheduledDate: new Date(dateString)
    }));
  };

  const updateScheduleData = (updates: Partial<ScheduleData>) => {
    setScheduleData(prev => ({ ...prev, ...updates }));
  };

  const getTimeDescription = () => {
    switch (scheduleData.timeOption) {
      case 'specific':
        return 'Messages will be sent at the exact time you specify';
      case 'business_hours':
        return 'Messages will be sent during business hours (9:00 AM - 5:00 PM)';
      case 'optimal':
        return 'System will choose the optimal time based on lead engagement patterns';
      default:
        return '';
    }
  };

  const getPriorityDescription = () => {
    switch (scheduleData.priority) {
      case 'immediate':
        return 'Send as soon as possible (within 5 minutes)';
      case 'high':
        return 'Send within 1 hour during business hours';
      case 'normal':
        return 'Send according to normal queue processing';
      case 'low':
        return 'Send when queue capacity allows';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Calendar className="h-5 w-5" />
            Schedule {selectedLeadsCount} Lead{selectedLeadsCount !== 1 ? 's' : ''} for Processing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Date */}
          <div className="space-y-2">
            <Label htmlFor="schedule-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              When do you want to send messages?
            </Label>
            <Input
              id="schedule-date"
              type="date"
              value={scheduleData.scheduledDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={errors.scheduledDate ? 'border-red-500' : ''}
            />
            {errors.scheduledDate && (
              <p className="text-sm text-red-500">{errors.scheduledDate}</p>
            )}
          </div>

          {/* Time Options */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              What time should messages be sent?
            </Label>
            <Select
              value={scheduleData.timeOption}
              onValueChange={(value: 'specific' | 'business_hours' | 'optimal') => 
                updateScheduleData({ timeOption: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business_hours">During Business Hours (9:00 AM - 5:00 PM)</SelectItem>
                <SelectItem value="optimal">Optimal Time (AI-chosen)</SelectItem>
                <SelectItem value="specific">Specific Time</SelectItem>
              </SelectContent>
            </Select>
            
            <p className="text-sm text-muted-foreground">{getTimeDescription()}</p>

            {/* Specific Time Input */}
            {scheduleData.timeOption === 'specific' && (
              <div className="mt-2">
                <Input
                  type="time"
                  value={scheduleData.specificTime || ''}
                  onChange={(e) => updateScheduleData({ specificTime: e.target.value })}
                  className={errors.specificTime ? 'border-red-500' : ''}
                />
                {errors.specificTime && (
                  <p className="text-sm text-red-500">{errors.specificTime}</p>
                )}
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label>What's the priority of these leads?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
                { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
                { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
                { value: 'immediate', label: 'Immediate', color: 'bg-red-100 text-red-800' },
              ].map((priority) => (
                <Button
                  key={priority.value}
                  variant={scheduleData.priority === priority.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateScheduleData({ priority: priority.value as any })}
                  className={cn(
                    "justify-start",
                    scheduleData.priority === priority.value && priority.color
                  )}
                >
                  {priority.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{getPriorityDescription()}</p>
          </div>

          {/* Business Hours Respect */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Business Rules
            </Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="respect-business-hours"
                checked={scheduleData.respectBusinessHours}
                onChange={(e) => updateScheduleData({ respectBusinessHours: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="respect-business-hours" className="text-sm">
                Respect business hours and holidays
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Messages will only be sent during configured business hours and not on holidays
            </p>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom message template (optional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Override the default message template for these leads..."
              value={scheduleData.message || ''}
              onChange={(e) => updateScheduleData({ message: e.target.value })}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this scheduled batch..."
              value={scheduleData.notes || ''}
              onChange={(e) => updateScheduleData({ notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Summary Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Summary:</strong> {selectedLeadsCount} lead{selectedLeadsCount !== 1 ? 's' : ''} will be scheduled for{' '}
              <Badge variant="outline">{scheduleData.priority}</Badge> priority processing on{' '}
              <strong>{scheduleData.scheduledDate.toLocaleDateString()}</strong>
              {scheduleData.timeOption === 'specific' && scheduleData.specificTime && (
                <span> at <strong>{scheduleData.specificTime}</strong></span>
              )}
              {scheduleData.timeOption === 'business_hours' && (
                <span> during <strong>business hours</strong></span>
              )}
              {scheduleData.timeOption === 'optimal' && (
                <span> at the <strong>optimal time</strong></span>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? 'Scheduling...' : `Schedule ${selectedLeadsCount} Lead${selectedLeadsCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 