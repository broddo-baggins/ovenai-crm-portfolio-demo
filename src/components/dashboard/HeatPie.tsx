import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Temperature data interface for the bar chart
 */
interface TemperatureData {
  name: string;
  value: number;
  color: string;
}

/**
 * Props for the HeatPie component
 * (keeping the name for backward compatibility)
 */
interface HeatPieProps {
  data?: TemperatureData[] | null;
  title?: string;
  className?: string;
  isLoading?: boolean;
}

/**
 * Default temperature distribution data if none is provided
 */
const defaultData: TemperatureData[] = [
  { name: "Cold", value: 25, color: "#D3E4FD" },  // Light blue
  { name: "Cool", value: 35, color: "#8E9196" },  // Gray
  { name: "Warm", value: 25, color: "#FEC6A1" },  // Orange
  { name: "Hot", value: 15, color: "#ea384c" },   // Red
];

/**
 * HeatPie Component (now displaying as a bar chart)
 * 
 * Displays a bar chart showing lead temperature distribution
 * Data comes from Supabase via API service
 */
const HeatPie = ({ 
  data = defaultData, 
  title = "Lead Temperature", 
  className,
  isLoading = false
}: HeatPieProps) => {
  const [animate, setAnimate] = useState(false);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  // Ensure we have valid data to render
  const chartData = data && data.length > 0 ? data : defaultData;

  useEffect(() => {
    // Skip the animation if user prefers reduced motion
    if (!prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAnimate(true);
    }
  }, [prefersReducedMotion]);

  return (
    <Card className={`${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} 
                    transition-all duration-200 hover:elevation-3 elevation-1 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="w-full h-[250px] flex flex-col items-center justify-center">
            <div className="w-full space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-8 w-2/5" />
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={60} />
              <Tooltip
                formatter={(value) => [`${value} leads`, 'Count']}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default HeatPie;
