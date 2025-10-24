
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const ChartCard = ({ title, children, className }: ChartCardProps) => {
  return (
    <Card className={`animate-fade-in-up elevation-1 elevation-hover ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
};

export default ChartCard;
