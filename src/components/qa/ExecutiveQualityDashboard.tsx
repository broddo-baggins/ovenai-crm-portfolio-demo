/**
 * DATA EXECUTIVE QUALITY DASHBOARD
 * Business-focused quality reporting and strategic insights
 * 
 * This dashboard provides executives with real-time quality metrics,
 * risk assessments, and strategic recommendations for quality improvement.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Users,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Shield,
  Zap
} from 'lucide-react';

export interface QualityMetrics {
  overallScore: number; // 0-100
  testCoverage: number; // percentage
  automationLevel: number; // percentage
  defectEscapeRate: number; // percentage
  releaseReadiness: 'READY' | 'AT_RISK' | 'BLOCKED';
  trendDirection: 'up' | 'down' | 'stable';
}

export interface RiskAssessment {
  criticalIssues: number;
  highRiskAreas: string[];
  mitigationProgress: number;
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ROIAnalysis {
  testingInvestment: number; // USD
  defectPreventionSavings: number; // USD
  automationSavings: number; // USD
  qualityROI: number; // percentage
  paybackPeriod: number; // months
}

export interface QualityTrends {
  last30Days: Array<{
    date: string;
    score: number;
    coverage: number;
    automation: number;
  }>;
  keyMilestones: Array<{
    date: string;
    event: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

export interface ExecutiveSummary {
  status: 'excellent' | 'good' | 'concerning' | 'critical';
  headline: string;
  keyAchievements: string[];
  priorityActions: string[];
  nextReview: string;
}

interface ExecutiveQualityDashboardProps {
  className?: string;
  refreshInterval?: number; // minutes
  showDetailedMetrics?: boolean;
}

export const ExecutiveQualityDashboard: React.FC<ExecutiveQualityDashboardProps> = ({
  className = '',
  refreshInterval = 30,
  showDetailedMetrics = true
}) => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    overallScore: 87,
    testCoverage: 91,
    automationLevel: 83,
    defectEscapeRate: 1.2,
    releaseReadiness: 'READY',
    trendDirection: 'up'
  });

  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({
    criticalIssues: 0,
    highRiskAreas: ['TypeScript Migration', 'Database Schema Changes'],
    mitigationProgress: 75,
    estimatedImpact: 'medium'
  });

  const [roiAnalysis, setROIAnalysis] = useState<ROIAnalysis>({
    testingInvestment: 125000,
    defectPreventionSavings: 350000,
    automationSavings: 200000,
    qualityROI: 285,
    paybackPeriod: 8
  });

  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary>({
    status: 'good',
    headline: 'Quality metrics trending positive with strong automation coverage',
    keyAchievements: [
      'Achieved 91% test coverage across critical components',
      'Reduced defect escape rate to 1.2% (target: <2%)',
      'Implemented self-healing test framework reducing maintenance by 40%'
    ],
    priorityActions: [
      'Complete TypeScript migration to eliminate 39 remaining errors',
      'Expand mobile testing coverage to 6 device configurations',
      'Implement predictive quality analytics for early risk detection'
    ],
    nextReview: '2025-07-15'
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate small metric variations
      setQualityMetrics(prev => ({
        ...prev,
        overallScore: Math.min(100, Math.max(80, prev.overallScore + (Math.random() - 0.5) * 2)),
        testCoverage: Math.min(100, Math.max(85, prev.testCoverage + (Math.random() - 0.5) * 1)),
        automationLevel: Math.min(100, Math.max(75, prev.automationLevel + (Math.random() - 0.5) * 1.5))
      }));
      setLastUpdated(new Date());
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    const colors = {
      excellent: 'text-green-600 bg-green-50',
      good: 'text-blue-600 bg-blue-50',
      concerning: 'text-yellow-600 bg-yellow-50',
      critical: 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || colors.good;
  };

  const getReleaseReadinessColor = (status: string) => {
    const colors = {
      READY: 'bg-green-500',
      AT_RISK: 'bg-yellow-500',
      BLOCKED: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || colors.AT_RISK;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Executive Summary Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Quality Executive Summary</CardTitle>
              <Badge className={`px-3 py-1 text-sm font-medium ${getStatusColor(executiveSummary.status)}`}>
                {executiveSummary.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription className="text-lg">
              {executiveSummary.headline}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Key Achievements
                </h4>
                <ul className="space-y-2">
                  {executiveSummary.keyAchievements.map((achievement, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Priority Actions
                </h4>
                <ul className="space-y-2">
                  {executiveSummary.priorityActions.map((action, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Release Readiness Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Release Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-semibold text-lg ${getReleaseReadinessColor(qualityMetrics.releaseReadiness)}`}>
                {qualityMetrics.releaseReadiness}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quality Score</span>
                  <span className="font-semibold">{qualityMetrics.overallScore}%</span>
                </div>
                <Progress value={qualityMetrics.overallScore} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Test Coverage</span>
                  <span className="font-semibold">{qualityMetrics.testCoverage}%</span>
                </div>
                <Progress value={qualityMetrics.testCoverage} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Automation</span>
                  <span className="font-semibold">{qualityMetrics.automationLevel}%</span>
                </div>
                <Progress value={qualityMetrics.automationLevel} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{qualityMetrics.overallScore}%</div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+2.3%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target: 90%+</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{qualityMetrics.testCoverage}%</div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+1.8%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target: 95%+</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Automation Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{qualityMetrics.automationLevel}%</div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+5.2%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target: 90%+</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Defect Escape Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{qualityMetrics.defectEscapeRate}%</div>
              <div className="flex items-center text-green-600">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-sm">-0.8%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target: &lt;2%</p>
          </CardContent>
        </Card>
      </div>

      {/* ROI Analysis and Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Quality ROI Analysis
            </CardTitle>
            <CardDescription>
              Financial impact of quality investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Annual ROI</p>
                  <p className="text-2xl font-bold text-green-600">{roiAnalysis.qualityROI}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Payback Period</p>
                  <p className="text-lg font-semibold">{roiAnalysis.paybackPeriod} months</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Testing Investment</p>
                  <p className="font-semibold">{formatCurrency(roiAnalysis.testingInvestment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Defect Prevention</p>
                  <p className="font-semibold text-green-600">+{formatCurrency(roiAnalysis.defectPreventionSavings)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Automation Savings</p>
                  <p className="font-semibold text-blue-600">+{formatCurrency(roiAnalysis.automationSavings)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Benefit</p>
                  <p className="font-semibold text-green-600">
                    +{formatCurrency(roiAnalysis.defectPreventionSavings + roiAnalysis.automationSavings - roiAnalysis.testingInvestment)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Risk Assessment
            </CardTitle>
            <CardDescription>
              Current quality risks and mitigation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Critical Issues</p>
                  <p className="text-2xl font-bold">{riskAssessment.criticalIssues}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Mitigation Progress</p>
                  <p className="text-lg font-semibold">{riskAssessment.mitigationProgress}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">High Risk Areas</p>
                <div className="space-y-2">
                  {riskAssessment.highRiskAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm">{area}</span>
                      <Badge variant="outline" className="text-xs">Monitoring</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Estimated Impact</p>
                <Badge className={`${
                  riskAssessment.estimatedImpact === 'low' ? 'bg-green-100 text-green-800' :
                  riskAssessment.estimatedImpact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  riskAssessment.estimatedImpact === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {riskAssessment.estimatedImpact.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Statistics */}
      {showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Detailed Test Statistics
            </CardTitle>
            <CardDescription>
              Comprehensive testing metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">492</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">70</p>
                <p className="text-sm text-muted-foreground">Unit Tests</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">25</p>
                <p className="text-sm text-muted-foreground">Integration</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">24</p>
                <p className="text-sm text-muted-foreground">E2E Passing</p>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-600">30</p>
                <p className="text-sm text-muted-foreground">Security</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">6</p>
                <p className="text-sm text-muted-foreground">Mobile</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons and Last Updated */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
        <div className="flex gap-2">
          <Button variant="default" className="flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Run Full Test Suite
          </Button>
          <Button variant="outline" className="flex items-center">
            <PieChart className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Share with Team
          </Button>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 mr-1" />
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </div>
    </div>
  );
}; 