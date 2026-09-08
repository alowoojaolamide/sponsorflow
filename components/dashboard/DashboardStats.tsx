import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MailOpen, MessageSquare, Calendar } from "lucide-react";

interface StatItem {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
}

export function DashboardStats() {
  const stats: StatItem[] = [
    { title: "Emails Sent", value: "0", change: "Daily cap: 20", icon: Send },
    { title: "Open Rate", value: "0%", change: "Target: >40%", icon: MailOpen },
    { title: "Replies Received", value: "0", change: "Target: 10–20%", icon: MessageSquare },
    { title: "Interviews Booked", value: "0", change: "Goal: 5–10", icon: Calendar },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-shade-50">
                {stat.title}
              </CardTitle>
              <Icon className="w-4 h-4 text-shade-40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ink">{stat.value}</div>
              <p className="text-xs text-shade-40 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
