import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StatsBarProps {
  totalAnalyses: number;
  approvedReports: number;
  pendingReports: number;
  highRiskClients: number;
}

export function StatsBar({
  totalAnalyses,
  approvedReports,
  pendingReports,
  highRiskClients,
}: StatsBarProps) {
  const stats = [
    {
      title: "Total Analyses",
      value: totalAnalyses,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Approved Reports",
      value: approvedReports,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending Review",
      value: pendingReports,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "High Risk",
      value: highRiskClients,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}