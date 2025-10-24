import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyTypeData {
  type: string;
  count: number;
  color: string;
}

interface PropertyTypeChartProps {
  isLoading?: boolean;
  className?: string;
  data?: PropertyTypeData[];
}

const PropertyTypeChart = ({ isLoading = false, className = "", data = [] }: PropertyTypeChartProps) => {
  return (
    <Card className={`elevation-1 hover:elevation-3 transition-all duration-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500">Property Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="w-full space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-8 w-2/5" />
            </div>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} properties`, 'Count']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyTypeChart; 