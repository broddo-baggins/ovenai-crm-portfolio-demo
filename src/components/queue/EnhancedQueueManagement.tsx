/**
 * Enhanced Queue Management Component
 * Implements HubSpot-style queue management with capacity-first design
 * Based on comprehensive system design analysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon,
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Search,
  ChevronDown,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import QueueServiceSimple from '@/services/QueueServiceSimple';

// Enhanced Types
interface CapacityInfo {
  dailyLimit: number;
  currentUsage: number;
  remainingCapacity: number;
  utilizationPercentage: number;
}

interface QueueDay {
  date: Date;
  leadCount: number;
  capacity: number;
  utilizationPercentage: number;
  status: 'available' | 'near-full' | 'full' | 'over-capacity';
}

interface ConflictInfo {
  leadId: string;
  leadName: string;
  conflictType: 'already_queued' | 'cooldown_period' | 'invalid_contact' | 'opted_out';
  details: string;
}

interface SelectionSummary {
  selectedCount: number;
  eligibleCount: number;
  conflictCount: number;
  estimatedDays: number;
  conflicts: ConflictInfo[];
}

const EnhancedQueueManagement: React.FC = () => {
  const { t } = useTranslation();
  
  // Core State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Queue State
  const [queueCalendar, setQueueCalendar] = useState<QueueDay[]>([]);
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo>({
    dailyLimit: 100,
    currentUsage: 0,
    remainingCapacity: 100,
    utilizationPercentage: 0
  });
  
  // Selection State
  const [selectionSummary, setSelectionSummary] = useState<SelectionSummary>({
    selectedCount: 0,
    eligibleCount: 0,
    conflictCount: 0,
    estimatedDays: 0,
    conflicts: []
  });
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize queue calendar (next 14 days)
  const initializeQueueCalendar = useCallback(() => {
    const calendar: QueueDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for business calendar
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const leadCount = Math.floor(Math.random() * 120); // Mock data
      const capacity = capacityInfo.dailyLimit;
      const utilizationPercentage = (leadCount / capacity) * 100;
      
      let status: QueueDay['status'] = 'available';
      if (utilizationPercentage >= 100) status = 'over-capacity';
      else if (utilizationPercentage >= 90) status = 'full';
      else if (utilizationPercentage >= 75) status = 'near-full';
      
      calendar.push({
        date,
        leadCount,
        capacity,
        utilizationPercentage,
        status
      });
    }
    
    setQueueCalendar(calendar);
  }, [capacityInfo.dailyLimit]);

  // Load queue metrics
  const loadQueueMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const metrics = await QueueServiceSimple.getQueueMetrics();
      
      setCapacityInfo({
        dailyLimit: metrics.dailyTarget * 2, // Assume 2x target as capacity
        currentUsage: metrics.processedToday,
        remainingCapacity: metrics.remainingCapacity,
        utilizationPercentage: (metrics.processedToday / (metrics.dailyTarget * 2)) * 100
      });
      
    } catch (error) {
      console.error('Error loading queue metrics:', error);
      toast.error('Failed to load queue metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update selection summary when selection changes
  useEffect(() => {
    const updateSelectionSummary = () => {
      const eligibleCount = selectedLeadIds.length;
      const conflictCount = Math.floor(eligibleCount * 0.1); // Mock 10% conflict rate
      const estimatedDays = Math.ceil(eligibleCount / capacityInfo.dailyLimit);
      
      // Mock conflicts
      const conflicts: ConflictInfo[] = selectedLeadIds.slice(0, conflictCount).map(id => ({
        leadId: id,
        leadName: `Lead ${id.slice(-4)}`,
        conflictType: ['already_queued', 'cooldown_period', 'invalid_contact'][Math.floor(Math.random() * 3)] as ConflictInfo['conflictType'],
        details: 'Mock conflict details'
      }));
      
      setSelectionSummary({
        selectedCount: selectedLeadIds.length,
        eligibleCount: eligibleCount - conflictCount,
        conflictCount,
        estimatedDays,
        conflicts
      });
    };
    
    updateSelectionSummary();
  }, [selectedLeadIds, capacityInfo.dailyLimit]);

  // Initialize component
  useEffect(() => {
    loadQueueMetrics();
  }, [loadQueueMetrics]);

  useEffect(() => {
    initializeQueueCalendar();
  }, [initializeQueueCalendar]);

  // Handle bulk operations
  const handleAutoDistribute = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error('Please select leads to queue');
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await QueueServiceSimple.prepareQueue();
      if (result.success) {
        toast.success(`Successfully distributed ${selectedLeadIds.length} leads across ${selectionSummary.estimatedDays} days`);
        setSelectedLeadIds([]);
        await loadQueueMetrics();
        initializeQueueCalendar();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to distribute leads');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQueueToDate = async (date: Date) => {
    if (selectedLeadIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Mock queueing to specific date
      toast.success(`Queued ${selectedLeadIds.length} leads for ${date.toLocaleDateString()}`);
      setSelectedLeadIds([]);
    } catch (error) {
      toast.error('Failed to queue leads to date');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartProcessing = async () => {
    try {
      const result = await QueueServiceSimple.startProcessing();
      if (result.success) {
        toast.success('Queue processing started');
        setIsProcessing(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to start processing');
    }
  };

  const handlePauseProcessing = async () => {
    try {
      const result = await QueueServiceSimple.pauseProcessing();
      if (result.success) {
        toast.success('Queue processing paused');
        setIsProcessing(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to pause processing');
    }
  };

  // Color helpers for capacity visualization
  const getCapacityColor = (utilizationPercentage: number) => {
    if (utilizationPercentage >= 100) return 'text-red-600 bg-red-50';
    if (utilizationPercentage >= 90) return 'text-orange-600 bg-orange-50';
    if (utilizationPercentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Capacity Counter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Queue Management</h1>
          <p className="text-muted-foreground mt-1">
            Capacity-first lead queue management with visual feedback
          </p>
        </div>
        
        {/* Live Capacity Counter */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Today's Capacity</div>
            <div className={`text-lg font-bold ${getCapacityColor(capacityInfo.utilizationPercentage)}`}>
              {capacityInfo.currentUsage}/{capacityInfo.dailyLimit}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Selection Impact</div>
            <div className="text-lg font-bold">
              {selectionSummary.selectedCount > 0 ? `+${selectionSummary.selectedCount}` : '—'}
            </div>
          </div>
          
          <Badge variant={isProcessing ? 'default' : 'secondary'} className="px-3 py-1">
            <Activity className="w-3 h-3 mr-1" />
            {isProcessing ? 'Processing' : 'Paused'}
          </Badge>
        </div>
      </div>

      {/* Meta Rate Limit Notice */}
      <Alert className="border-indigo-200 bg-indigo-50">
        <AlertTriangle className="h-4 w-4 text-indigo-600" />
        <AlertDescription>
          WhatsApp conversations are subject to Meta Business rate limits. OvenAI automatically throttles new conversations to remain compliant and prevent abuse. Daily capacity numbers reflect these limits.
        </AlertDescription>
      </Alert>

      {/* Instant Feedback Bar */}
      {selectionSummary.selectedCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Users className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <span>
                <strong>{selectionSummary.selectedCount}</strong> selected
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>
                <strong>{selectionSummary.eligibleCount}</strong> eligible
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-orange-600">
                <strong>{selectionSummary.conflictCount}</strong> conflicts
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>
                <strong>{selectionSummary.estimatedDays}</strong> days needed @{capacityInfo.dailyLimit}/day
              </span>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleAutoDistribute} disabled={isProcessing} size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Auto-Distribute
              </Button>
              <Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm">
                {showPreview ? 'Hide' : 'Preview'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Conflict Resolution Panel */}
      {selectionSummary.conflictCount > 0 && showPreview && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Resolve {selectionSummary.conflictCount} Conflicts
            </CardTitle>
            <CardDescription>
              These leads cannot be queued and need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectionSummary.conflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <div>
                    <span className="font-medium">{conflict.leadName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {conflict.conflictType.replace('_', ' ')}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">Resolve</Button>
                </div>
              ))}
              {selectionSummary.conflicts.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  +{selectionSummary.conflicts.length - 3} more conflicts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Queue Calendar & Capacity
          </CardTitle>
          <CardDescription>
            Drag leads to specific days or use auto-distribution. Colors show capacity utilization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {queueCalendar.map((day, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  day.status === 'over-capacity' ? 'bg-red-50 border-red-200' :
                  day.status === 'full' ? 'bg-orange-50 border-orange-200' :
                  day.status === 'near-full' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                } hover:shadow-sm`}
                onClick={() => handleQueueToDate(day.date)}
              >
                <div className="text-sm font-medium">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                
                <div className="mt-2">
                  <div className="text-lg font-bold">
                    {day.leadCount}/{day.capacity}
                  </div>
                  <Progress 
                    value={day.utilizationPercentage} 
                    className="h-1 mt-1"
                  />
                </div>
                
                {day.status === 'over-capacity' && (
                  <div className="text-xs text-red-600 mt-1">
                    +{day.leadCount - day.capacity} overflow
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Calendar Legend */}
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
              Available
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-200 rounded mr-2"></div>
              Near Full (75%+)
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-200 rounded mr-2"></div>
              Full (90%+)
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-200 rounded mr-2"></div>
              Over Capacity
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queue Controls</CardTitle>
            <CardDescription>Manage queue processing and automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={handleStartProcessing}
                disabled={isProcessing}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Processing
              </Button>
              <Button 
                onClick={handlePauseProcessing}
                disabled={!isProcessing}
                variant="outline"
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={loadQueueMetrics}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh Metrics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Rules</CardTitle>
            <CardDescription>Current processing limits and business hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Daily Limit:</span>
              <Badge variant="outline">{capacityInfo.dailyLimit} leads</Badge>
            </div>
            <div className="flex justify-between">
              <span>Business Hours:</span>
              <Badge variant="outline">09:00 - 17:00 IST</Badge>
            </div>
            <div className="flex justify-between">
              <span>Work Days:</span>
              <Badge variant="outline">Sun - Thu</Badge>
            </div>
            <div className="flex justify-between">
              <span>Auto-Processing:</span>
              <Badge variant={isProcessing ? 'default' : 'secondary'}>
                {isProcessing ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mock Lead Selection Area */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Selection & Management</CardTitle>
          <CardDescription>
            Search, filter, and select leads for queue operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          
          {/* Mock Selection Interface */}
          <div className="border rounded p-4 bg-muted/50">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Lead data table would be integrated here
              </p>
              <div className="flex justify-center space-x-2">
                <Button 
                  onClick={() => setSelectedLeadIds(['lead1', 'lead2', 'lead3'])}
                  variant="outline"
                  size="sm"
                >
                  Mock: Select 3 Leads
                </Button>
                <Button 
                  onClick={() => setSelectedLeadIds([])}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedQueueManagement; 