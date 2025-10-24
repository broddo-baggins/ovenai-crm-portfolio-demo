import React from "react";
import { UserCheck } from "lucide-react";
import { DashboardWidget } from "@/components/shared";

const ReachedLeads: React.FC = () => {
  // Return zeros instead of mock data - real data should come from API
  const reachedLeads = 0;
  const totalLeads = 0;
  const previousReached = 0;
  const reachRate =
    totalLeads > 0 ? ((reachedLeads / totalLeads) * 100).toFixed(1) : "0.0";
  const percentageChange =
    previousReached > 0
      ? (((reachedLeads - previousReached) / previousReached) * 100).toFixed(1)
      : "0.0";
  const isPositive = reachedLeads >= previousReached;

  return (
    <DashboardWidget
      title="Reached Leads"
      titleKey="reachedLeads.title"
      subtitle="Leads successfully reached"
      subtitleKey="reachedLeads.subtitle"
      value={reachedLeads}
      icon={<UserCheck />}
      iconColor="text-green-600"
      trend={{
        value: `${percentageChange}%`,
        positive: isPositive,
        label: isPositive ? "Increase" : "Decrease",
      }}
      badge={{
        value: `${reachRate}%`,
        color: "bg-green-100 text-green-600",
      }}
      stats={[
        {
          label: "Reach rate",
          value: `${reachRate}%`,
          color: "font-medium text-green-600",
        },
        {
          label: "Previous period",
          value: previousReached,
        },
        {
          label: "This week",
          value: reachedLeads,
          highlighted: true,
        },
      ]}
    />
  );
};

export default ReachedLeads;
