import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadSourceData {
  name: string;
  value: number;
  color: string;
}

interface LeadSourceChartProps {
  isLoading?: boolean;
  className?: string;
  data?: LeadSourceData[];
}

const LeadSourceChart = ({ isLoading = false, className = "", data = [] }: LeadSourceChartProps) => {
  return (
    <Card className={`elevation-1 hover:elevation-3 transition-all duration-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500">Lead Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <Skeleton className="h-[250px] w-[250px] rounded-full" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} leads`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadSourceChart; 