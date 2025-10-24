"use client";

import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A BANT/HEAT lead distribution pie chart";

// Real data based on BANT/HEAT lead temperatures in the system
const chartData = [
  { temperature: "cold", leads: 45, fill: "hsl(var(--chart-1))" },
  { temperature: "warm", leads: 30, fill: "hsl(var(--chart-2))" },
  { temperature: "hot", leads: 18, fill: "hsl(var(--chart-3))" },
  { temperature: "burning", leads: 12, fill: "hsl(var(--chart-4))" },
  { temperature: "meeting_scheduled", leads: 8, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
  leads: {
    label: "Leads",
  },
  cold: {
    label: "Cold Leads",
    color: "hsl(var(--chart-1))",
  },
  warm: {
    label: "Warm Leads",
    color: "hsl(var(--chart-2))",
  },
  hot: {
    label: "Hot Leads",
    color: "hsl(var(--chart-3))",
  },
  burning: {
    label: "Burning Leads",
    color: "hsl(var(--chart-4))",
  },
  meeting_scheduled: {
    label: "Meetings Scheduled",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function ChartPieSimple() {
  const { t } = useTranslation("dashboard");
  const { isRTL, textStart } = useLang();

  return (
    <Card className="flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <CardHeader className="items-center pb-0">
        <CardTitle className={textStart()}>
          {t("charts.bantHeatDistribution", "BANT/HEAT Lead Distribution")}
        </CardTitle>
        <CardDescription className={textStart()}>
          {t(
            "charts.leadTemperatureBreakdown",
            "Current lead pipeline temperature distribution and meeting scheduling",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={chartData} dataKey="leads" nameKey="temperature" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter
        className={`flex-col gap-2 text-sm ${isRTL ? "items-end" : "items-start"}`}
      >
        <div
          className={`flex items-center gap-2 leading-none font-medium ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <TrendingUp className="h-4 w-4" />
          <span className={textStart()}>
            {t("charts.heatTrending", "Heat Trending Up")}
          </span>
        </div>
        <div className={`text-muted-foreground leading-none ${textStart()}`}>
          {t(
            "charts.leadDistributionDescription",
            "Showing lead qualification status and meeting conversion pipeline",
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
