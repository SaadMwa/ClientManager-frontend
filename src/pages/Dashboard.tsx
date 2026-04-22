import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import API from "../api/axios";
import Layout from "../components/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

interface RevenueRow {
  _id: { year: number; month: number };
  revenue: number;
}

interface Stats {
  totalClients: number;
  totalNotes: number;
  recentClients: number;
}

const formatCurrency = (value: number) => `$${Math.round(value).toLocaleString()}`;

const Dashboard = () => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const revenueQuery = useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: async () => (await API.get("/analytics/revenue")).data as RevenueRow[],
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await API.get("/projects")).data as { _id: string }[],
  });

  const statsQuery = useQuery({
    queryKey: ["clients", "stats"],
    queryFn: async () => (await API.get("/clients/stats")).data as Stats,
  });

  const series = useMemo(() => {
    const rows = revenueQuery.data ?? [];
    return rows
      .map((item) => {
        const date = new Date(item._id.year, item._id.month - 1, 1);
        return {
          sortKey: date.getTime(),
          month: date.toLocaleString("en-US", { month: "short" }),
          label: date.toLocaleString("en-US", { month: "short", year: "2-digit" }),
          revenue: item.revenue,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [revenueQuery.data]);

  const totalRevenue = series.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = series.length ? totalRevenue / series.length : 0;

  const exportChart = () => {
    const svg = document.querySelector("#dashboard-revenue svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revenue-chart.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = revenueQuery.isLoading || projectsQuery.isLoading || statsQuery.isLoading;

  useEffect(() => {
    if (!isLoading) {
      setLastUpdated((current) => current ?? new Date());
    }
  }, [isLoading]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--text-2))]">Overview</p>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-2))]">
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Not refreshed yet"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                await Promise.all([revenueQuery.refetch(), projectsQuery.refetch(), statsQuery.refetch()]);
                setLastUpdated(new Date());
              }}
            >
              Refresh
            </Button>
            <Button variant="outline" onClick={exportChart}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export chart
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-28 w-full" />)
          ) : (
            <>
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">Total revenue</p>
                <p className="mt-3 text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
                <BanknotesIcon className="mt-3 h-5 w-5 text-[rgb(var(--brand-2))]" />
              </Card>
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">Average month</p>
                <p className="mt-3 text-2xl font-semibold">{formatCurrency(averageRevenue)}</p>
                <ChartBarIcon className="mt-3 h-5 w-5 text-[rgb(var(--brand-2))]" />
              </Card>
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">Projects</p>
                <p className="mt-3 text-2xl font-semibold">{projectsQuery.data?.length ?? 0}</p>
                <ChartBarIcon className="mt-3 h-5 w-5 text-[rgb(var(--brand-2))]" />
              </Card>
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">Clients</p>
                <p className="mt-3 text-2xl font-semibold">{statsQuery.data?.totalClients ?? 0}</p>
                <UserGroupIcon className="mt-3 h-5 w-5 text-[rgb(var(--brand-2))]" />
              </Card>
            </>
          )}
        </div>

        <Card className="p-6">
          <p className="text-sm font-semibold text-[rgb(var(--text-1))]">Revenue trend</p>
          <p className="text-xs text-[rgb(var(--text-2))]">Simple month-by-month performance for freelancer billing.</p>

          <div id="dashboard-revenue" className="mt-5 h-72">
            {revenueQuery.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : !series.length ? (
              <EmptyState title="No revenue yet" description="Mark a few projects complete to populate this chart." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Month: ${label}`} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
