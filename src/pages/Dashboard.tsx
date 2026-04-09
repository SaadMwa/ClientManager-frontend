import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
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

interface RevenuePoint {
  date: Date;
  label: string;
  month: string;
  revenue: number;
}

interface Insight {
  id: string;
  type: "success" | "warning" | "info";
  message: string;
  action: string | null;
}

type RangePreset = "6m" | "12m" | "all";

type DataMode = "auto" | "demo" | "real";

const DEMO_DATA: RevenuePoint[] = [
  { date: new Date(2026, 0, 1), label: "Jan 26", month: "Jan", revenue: 4500 },
  { date: new Date(2026, 1, 1), label: "Feb 26", month: "Feb", revenue: 5200 },
  { date: new Date(2026, 2, 1), label: "Mar 26", month: "Mar", revenue: 4800 },
  { date: new Date(2026, 3, 1), label: "Apr 26", month: "Apr", revenue: 6100 },
  { date: new Date(2026, 4, 1), label: "May 26", month: "May", revenue: 7300 },
  { date: new Date(2026, 5, 1), label: "Jun 26", month: "Jun", revenue: 8200 },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * index, duration: 0.45, ease: "easeOut" },
  }),
};

const formatCurrency = (value: number) =>
  `$${Math.round(value).toLocaleString()}`;

const useCountUp = (value: number, duration = 700) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = display;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const next = from + (value - from) * progress;
      setDisplay(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<RangePreset>("6m");
  const [dataMode, setDataMode] = useState<DataMode>("auto");
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("dashboard-data-mode");
    if (stored === "demo" || stored === "real" || stored === "auto") {
      setDataMode(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("dashboard-data-mode", dataMode);
  }, [dataMode]);

  const revenueQuery = useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: async () => (await API.get("/analytics/revenue")).data as RevenueRow[],
  });

  const realSeries = useMemo<RevenuePoint[]>(() => {
    const rows = revenueQuery.data ?? [];
    return rows
      .map((item) => {
        const date = new Date(item._id.year, item._id.month - 1, 1);
        return {
          date,
          month: date.toLocaleString("en-US", { month: "short" }),
          label: date.toLocaleString("en-US", { month: "short", year: "2-digit" }),
          revenue: item.revenue,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [revenueQuery.data]);

  const hasEnoughReal = realSeries.length >= 3;
  const activeMode: "demo" | "real" =
    dataMode === "demo"
      ? "demo"
      : dataMode === "real"
        ? "real"
        : hasEnoughReal
          ? "real"
          : "demo";

  const rawSeries = activeMode === "real" ? realSeries : DEMO_DATA;

  const filteredSeries = useMemo(() => {
    if (preset === "all") return rawSeries;
    const months = preset === "6m" ? 6 : 12;
    return rawSeries.slice(-months);
  }, [preset, rawSeries]);

  const totalRevenue = useMemo(
    () => filteredSeries.reduce((sum, item) => sum + item.revenue, 0),
    [filteredSeries]
  );

  const avgRevenue = useMemo(
    () => (filteredSeries.length ? totalRevenue / filteredSeries.length : 0),
    [filteredSeries, totalRevenue]
  );

  const bestMonth = useMemo(() => {
    if (!filteredSeries.length) return null;
    return filteredSeries.reduce((best, current) =>
      current.revenue > best.revenue ? current : best
    );
  }, [filteredSeries]);

  const latest = filteredSeries[filteredSeries.length - 1];
  const previous = filteredSeries[filteredSeries.length - 2];
  const delta =
    latest && previous && previous.revenue > 0
      ? (latest.revenue - previous.revenue) / previous.revenue
      : 0;

  const comparePeriod = useMemo(() => {
    if (filteredSeries.length < 2) return 0;
    const half = Math.floor(filteredSeries.length / 2);
    if (half === 0) return 0;
    const current = filteredSeries.slice(-half).reduce((sum, item) => sum + item.revenue, 0);
    const prev = filteredSeries.slice(0, half).reduce((sum, item) => sum + item.revenue, 0);
    return prev > 0 ? (current - prev) / prev : 0;
  }, [filteredSeries]);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await API.get("/projects")).data as { _id: string }[],
  });

const insightsQuery = useQuery({
    queryKey: ["insights"],
    queryFn: async () => (await API.get("/analytics/insights")).data,
});

  const totalProjects = projectsQuery.data?.length ?? 0;

  const animatedTotal = useCountUp(totalRevenue);
  const animatedAvg = useCountUp(avgRevenue);
  const animatedBest = useCountUp(bestMonth?.revenue ?? 0);
  const animatedProjects = useCountUp(totalProjects);

  const sparklineData = filteredSeries.length
    ? filteredSeries.map((item, idx) => ({ idx, value: item.revenue }))
    : DEMO_DATA.map((item, idx) => ({ idx, value: item.revenue }));

  const exportChart = () => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
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

  const kpiCards = [
    {
      id: "total",
      title: "Total revenue",
      value: formatCurrency(animatedTotal),
      change: `${(delta * 100).toFixed(1)}%`,
      icon: CurrencyDollarIcon,
    },
    {
      id: "avg",
      title: "Avg monthly",
      value: formatCurrency(animatedAvg),
      change: `${filteredSeries.length} months`,
      icon: BanknotesIcon,
    },
    {
      id: "best",
      title: "Best month",
      value: bestMonth ? formatCurrency(animatedBest) : "�",
      change: bestMonth ? bestMonth.label : "No data",
      icon: ArrowTrendingUpIcon,
    },
    {
      id: "projects",
      title: "Projects",
      value: `${Math.round(animatedProjects)}`,
      change: hasEnoughReal ? "Live" : "Demo",
      icon: ChartBarIcon,
    },
  ];

  return (
    <Layout>
      <div className="relative space-y-8">
        <motion.div
          className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-[rgba(79,70,229,0.18)] blur-3xl"
          animate={{ opacity: [0.15, 0.35, 0.15], y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-3 py-1 text-xs font-semibold text-[rgb(var(--text-2))]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {activeMode === "real" ? "Live data" : "Demo data"}
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-[rgb(var(--text-2))]">
              Revenue intelligence
            </p>
            <h1 className="text-3xl font-semibold text-[rgb(var(--text-1))]">
              Stripe-style analytics
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-2))]">
              {activeMode === "real"
                ? "Connected to real projects in your workspace."
                : "Preview the experience while you onboard projects."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] p-1 text-xs font-semibold text-[rgb(var(--text-2))]">
              {([
                { label: "Auto", value: "auto" },
                { label: "Demo", value: "demo" },
                { label: "Real", value: "real" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDataMode(option.value)}
                  className={`rounded-full px-3 py-1 transition ${
                    dataMode === option.value
                      ? "bg-[rgb(var(--brand-2))] text-white"
                      : "text-[rgb(var(--text-2))]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" className="gap-2" onClick={exportChart}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {!hasEnoughReal && activeMode === "demo" && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-2xl border border-dashed border-[rgba(79,70,229,0.4)] bg-[rgba(79,70,229,0.08)] px-5 py-4 text-sm text-[rgb(var(--text-2))]"
          >
            Add at least 3 completed projects to unlock live analytics. You can still
            explore the dashboard in demo mode.
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {revenueQuery.isLoading ? (
            <>
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </>
          ) : (
            kpiCards.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={index}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="h-full"
                >
                  <Card className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
                          {kpi.title}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-semibold text-[rgb(var(--text-1))]"
                          >
                            {kpi.value}
                          </motion.p>
                          <span className="rounded-full bg-[rgba(34,197,94,0.15)] px-2 py-1 text-xs font-semibold text-emerald-500">
                            {kpi.change}
                          </span>
                        </div>
                      </div>
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(79,70,229,0.15)] text-indigo-500">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="h-14">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--text-1))]">Revenue trend</p>
                  <p className="text-xs text-[rgb(var(--text-2))]">
                    {formatCurrency(totalRevenue)} processed
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(["6m", "12m", "all"] as const).map((range) => (
                    <Button
                      key={range}
                      size="sm"
                      variant={preset === range ? "primary" : "outline"}
                      onClick={() => setPreset(range)}
                    >
                      {range === "all" ? "All" : range.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3 text-xs text-[rgb(var(--text-2))]">
                Compare with previous period: {(comparePeriod * 100).toFixed(1)}% change
              </div>

              <div className="mt-6 h-64" ref={chartRef}>
                {revenueQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : filteredSeries.length === 0 ? (
                  <EmptyState
                    title="No revenue yet"
                    description="Complete a project to see analytics here."
                  />
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeMode}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredSeries} margin={{ left: 0, right: 16 }}>
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="10%" stopColor="#4F46E5" stopOpacity={0.35} />
                              <stop offset="90%" stopColor="#4F46E5" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 6" stroke="rgba(148,163,184,0.2)" />
                          <XAxis dataKey="month" stroke="rgba(148,163,184,0.6)" />
                          <YAxis
                            stroke="rgba(148,163,184,0.6)"
                            tickFormatter={(v) => `$${v / 1000}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(15,23,42,0.9)",
                              borderRadius: 12,
                              border: "1px solid rgba(148,163,184,0.2)",
                              color: "#E2E8F0",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#4F46E5"
                            fill="url(#revenueGradient)"
                            strokeWidth={2.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </Card>
          </motion.div>

          <div className="space-y-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--text-1))]">
                      Data coverage
                    </p>
                    <p className="text-xs text-[rgb(var(--text-2))]">
                      {hasEnoughReal ? "Live metrics enabled" : "Demo data running"}
                    </p>
                  </div>
                  <Squares2X2Icon className="h-5 w-5 text-[rgb(var(--text-2))]" />
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--text-2))]">
                      Real data points
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-1))]">
                      {realSeries.length}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-2))]">
                      Add more completed projects to unlock live trend lines.
                    </p>
                  </div>
               <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
    <Card className="p-6">
        <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgba(34,197,94,0.15)] text-emerald-500">
                <ArrowTrendingUpIcon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-1))]">
                    AI Insights
                </p>
                <p className="text-xs text-[rgb(var(--text-2))]">
                    Smart suggestions based on your data
                </p>
            </div>
        </div>

        <div className="mt-4 space-y-3">
            {insightsQuery.isLoading ? (
                <div className="rounded-xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3">
                    <p className="text-sm text-[rgb(var(--text-2))]">Loading insights...</p>
                </div>
            ) : insightsQuery.data?.length > 0 ? (
                insightsQuery.data.map((insight: Insight) => (
                    <div 
                        key={insight.id} 
                        className={`rounded-xl border px-4 py-3 ${
                            insight.type === 'warning' 
                                ? 'border-yellow-500/30 bg-yellow-500/10' 
                                : insight.type === 'success'
                                ? 'border-green-500/30 bg-green-500/10'
                                : 'border-blue-500/30 bg-blue-500/10'
                        }`}
                    >
                        <p className="text-sm font-semibold text-[rgb(var(--text-1))]">
                            {insight.message}
                        </p>
                        {insight.action && (
                            <button 
                                onClick={() => insight.action ? navigate(insight.action) : undefined}
                                className="mt-2 text-xs text-[rgb(var(--brand-2))] hover:underline"
                            >
                                View →
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <div className="rounded-xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3">
                    <p className="text-sm text-[rgb(var(--text-2))]">No insights yet. Add more data!</p>
                </div>
            )}
        </div>
    </Card>
</motion.div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3">
                    <p className="text-sm font-semibold text-[rgb(var(--text-1))]">
                      Average monthly growth
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-2))]">
                      {(comparePeriod * 100).toFixed(1)}% compared to previous period
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-2))] px-4 py-3">
                    <p className="text-sm font-semibold text-[rgb(var(--text-1))]">
                      Data status
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-2))]">
                      {hasEnoughReal
                        ? "Your data is rich enough for live dashboards."
                        : "Add more projects to unlock real analytics."}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
