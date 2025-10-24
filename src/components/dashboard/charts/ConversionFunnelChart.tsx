"use client";

import React from "react";
import {
  TrendingDown,
  TrendingUp,
  Target,
  Users,
  CheckCircle,
} from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

interface ConversionFunnelData {
  leads: number;
  qualified: number;
  proposals: number;
  closed: number;
}

interface ConversionFunnelChartProps {
  data?: ConversionFunnelData;
  isLoading?: boolean;
  className?: string;
}

const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({
  data,
  isLoading = false,
  className = "",
}) => {
  // Use real data or empty state
  const funnelData = data || {
    leads: 0,
    qualified: 0,
    proposals: 0,
    closed: 0,
  };

  const stages = [
    {
      name: "Total Leads",
      value: funnelData.leads,
      icon: Target,
      color: "bg-blue-500",
    },
    {
      name: "Qualified",
      value: funnelData.qualified,
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      name: "Proposals",
      value: funnelData.proposals,
      icon: TrendingUp,
      color: "bg-yellow-500",
    },
    {
      name: "Closed Deals",
      value: funnelData.closed,
      icon: TrendingDown,
      color: "bg-purple-500",
    },
  ];

  const calculatePercentage = (current: number, total: number) => {
    return total > 0 ? (current / total) * 100 : 0;
  };

  const calculateConversionRate = (current: number, previous: number) => {
    return previous > 0 ? ((current / previous) * 100).toFixed(1) : "0";
  };

  const conversionRate =
    funnelData.leads > 0 ? (funnelData.closed / funnelData.leads) * 100 : 0;
  const qualificationRate =
    funnelData.leads > 0 ? (funnelData.qualified / funnelData.leads) * 100 : 0;
  const proposalRate =
    funnelData.qualified > 0
      ? (funnelData.proposals / funnelData.qualified) * 100
      : 0;
  const closeRate =
    funnelData.proposals > 0
      ? (funnelData.closed / funnelData.proposals) * 100
      : 0;

  const chartData = [
    {
      stage: "conversion",
      rate: conversionRate,
      fill: "var(--color-conversion)",
      count: funnelData.closed,
      total: funnelData.leads,
    },
  ];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-chart-2" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>
          Track lead progression through your sales pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {funnelData.leads > 0 ? (
          <div className="space-y-6">
            {stages.map((stage, index) => {
              const IconComponent = stage.icon;
              const percentage = calculatePercentage(
                stage.value,
                funnelData.leads,
              );
              const conversionRate =
                index > 0
                  ? calculateConversionRate(
                      stage.value,
                      stages[index - 1].value,
                    )
                  : "100";

              return (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <span className="font-medium">{stage.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {stage.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {index > 0 && `${conversionRate}% conversion`}
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total leads
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Overall Conversion Rate</div>
                  <div className="text-lg font-bold text-green-600">
                    {calculateConversionRate(
                      funnelData.closed,
                      funnelData.leads,
                    )}
                    %
                  </div>
                </div>
                <div>
                  <div className="font-medium">Pipeline Health</div>
                  <div className="text-lg font-bold text-blue-600">
                    {funnelData.proposals > 0 ? "Active" : "Needs Attention"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="font-medium mb-2">No funnel data available</div>
              <div className="text-sm">
                Start adding leads to see your conversion funnel
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Users className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-medium">
              {funnelData.leads.toLocaleString()}
            </div>
            <div className="text-muted-foreground">Total Leads</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Target className="h-4 w-4 text-orange-500" />
          <div>
            <div className="font-medium">
              {funnelData.qualified.toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              Qualified ({qualificationRate.toFixed(1)}%)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <TrendingUp className="h-4 w-4 text-purple-500" />
          <div>
            <div className="font-medium">
              {funnelData.proposals.toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              Proposals ({proposalRate.toFixed(1)}%)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div>
            <div className="font-medium">
              {funnelData.closed.toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              Closed ({closeRate.toFixed(1)}%)
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {conversionRate > 15 ? (
            <>
              Performing above industry average
              <TrendingUp className="h-4 w-4 text-green-500" />
            </>
          ) : (
            <>
              Room for improvement in conversion
              <Target className="h-4 w-4 text-orange-500" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none text-center">
          Industry average conversion rate is typically 10-15%
        </div>
      </CardFooter>
    </Card>
  );
};

export default ConversionFunnelChart;
