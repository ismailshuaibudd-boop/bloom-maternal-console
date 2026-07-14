"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Baby,
  Heart,
  Phone,
  MessageSquare,
  Activity,
  Clock,
  Users,
  Calendar,
  Plus,
  Play,
  Volume2,
  Globe,
  ChevronDown,
  ChartNoAxesColumnIncreasing,
  AudioWaveform,
} from "lucide-react";
import {
  type Mother,
  type ActivityLog,
  type HealthTip,
  loadMothers,
  loadLogs,
  saveLogs,
  loadTips,
  getTrimester,
  getDispatchCount,
  incrementDispatchCount,
  formatPhone,
  buildDispatchPayload,
  generateGatewaySnippet,
  generateId,
} from "@/utils/maternalData";
import { toast } from "sonner";

interface Props {
  mothers: Mother[];
  onMothersChange: (m: Mother[]) => void;
}

function countUp(end: number, duration = 1500): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(end / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setVal(end);
        clearInterval(timer);
      } else {
        setVal(start);
      }
    }, duration / 30);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration]);
  return val;
}

function CountUp({ value }: { value: number }) {
  const display = countUp(value);
  return <span>{display.toLocaleString()}</span>;
}

export default function DashboardMetrics({ mothers, onMothersChange }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tips] = useState<HealthTip[]>(() => loadTips());
  const [simulating, setSimulating] = useState(false);
  const [simLog, setSimLog] = useState<string[]>([]);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  const activeMothers = mothers.filter((m) => m.pregnancyWeek <= 40);
  const highRisk = mothers.filter((m) => m.pregnancyWeek >= 35 || m.pregnancyWeek <= 12);
  const voicePref = mothers.filter((m) => m.preference === "Voice").length;
  const smsPref = mothers.filter((m) => m.preference === "SMS").length;

  const trimesterCounts = useMemo(() => {
    const t1 = mothers.filter((m) => getTrimester(m.pregnancyWeek) === 1).length;
    const t2 = mothers.filter((m) => getTrimester(m.pregnancyWeek) === 2).length;
    const t3 = mothers.filter((m) => getTrimester(m.pregnancyWeek) === 3).length;
    return { t1, t2, t3 };
  }, [mothers]);

  const totalMothers = mothers.length;
  const dispatchCount = getDispatchCount();

  const kpiCards = [
    {
      title: "Total Mothers",
      value: totalMothers,
      icon: Users,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Active Enrolments",
      value: activeMothers.length,
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "High Risk",
      value: highRisk.length,
      icon: Activity,
      color: "text-orange-600",
      bg: "bg-orange-50",
      detail: "Weeks 1-12 or 35+",
    },
    {
      title: "Voice Preferred",
      value: voicePref,
      icon: Phone,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "SMS Preferred",
      value: smsPref,
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Dispatches",
      value: dispatchCount,
      icon: AudioWaveform,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const maxTrimester = Math.max(trimesterCounts.t1, trimesterCounts.t2, trimesterCounts.t3, 1);

  // Simulate dispatch
  const handleSimulateDispatch = async () => {
    setSimulating(true);
    setSimLog([]);
    const logsCopy: ActivityLog[] = [];

    for (const mother of activeMothers.slice(0, 5)) {
      const tip = tips.find((t) => t.week === mother.pregnancyWeek);
      const msg = tip
        ? tip[mother.language.toLowerCase() as keyof HealthTip] || tip.en
        : `Week ${mother.pregnancyWeek}: Stay healthy and attend your antenatal visits.`;

      const payload = buildDispatchPayload(mother, msg);
      incrementDispatchCount();

      logsCopy.push({
        id: generateId(),
        type: mother.preference === "Voice" ? "voice" : "sms",
        motherId: mother.id,
        motherName: mother.name,
        message: msg.slice(0, 60) + "...",
        timestamp: new Date().toISOString(),
        status: "delivered",
      });

      setSimLog((prev) => [
        ...prev,
        `📤 ${mother.preference} → ${mother.name} (Week ${mother.pregnancyWeek})`,
      ]);

      // Simulate delay
      await new Promise((r) => setTimeout(r, 400));
    }

    const allLogs = [...logsCopy, ...loadLogs()];
    saveLogs(allLogs);
    setLogs(allLogs);
    setSimulating(false);
    toast.success(`Dispatched ${logsCopy.length} messages`);
  };

  const recentLogs = logs.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-t-2 border-t-current hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {kpi.title}
                </CardTitle>
                <div className={`${kpi.bg} p-1.5 rounded-full`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">
                  <CountUp value={kpi.value} />
                </div>
                {kpi.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.detail}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Second Row: Trimester + Dispatch Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trimester Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              Trimester Distribution
            </CardTitle>
            <CardDescription>Breakdown of mothers by pregnancy stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "First Trimester (Weeks 1-13)",
                  count: trimesterCounts.t1,
                  color: "bg-teal-500",
                },
                {
                  label: "Second Trimester (Weeks 14-27)",
                  count: trimesterCounts.t2,
                  color: "bg-amber-500",
                },
                {
                  label: "Third Trimester (Weeks 28-40)",
                  count: trimesterCounts.t3,
                  color: "bg-rose-500",
                },
              ].map((t) => (
                <div key={t.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground font-mono">{t.count}</span>
                  </div>
                  <Progress
                    value={(t.count / maxTrimester) * 100}
                    className="h-2.5 bg-muted/50"
                    // Custom indicator color via the style prop
                    style={
                      {
                        "--progress-background": t.color,
                        backgroundColor: "var(--progress-background, hsl(var(--muted)))",
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-1">
                {totalMothers} total mothers enrolled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Simulator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-600" />
              Dispatch Simulator
            </CardTitle>
            <CardDescription>Simulate SMS/Voice dispatch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <span>Africa's Talking Gateway</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Simulated
              </Badge>
            </div>
            <Button
              onClick={handleSimulateDispatch}
              disabled={simulating || activeMothers.length === 0}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {simulating ? (
                <>
                  <span className="animate-pulse">●</span> Dispatching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Run Dispatch (5 mothers)
                </>
              )}
            </Button>
            <ScrollArea className="h-32 rounded-md border bg-muted/30 p-2">
              {simLog.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center pt-8">
                  Click "Run Dispatch" to simulate
                </p>
              ) : (
                simLog.map((line, i) => (
                  <p key={i} className="text-xs font-mono leading-5 text-foreground/80">
                    {line}
                  </p>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest dispatch and registration events</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {logs.length} total
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet. Register mothers or run a dispatch simulation.
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-6 py-3 text-sm hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`p-1.5 rounded-full ${
                      log.type === "sms"
                        ? "bg-blue-50 text-blue-600"
                        : log.type === "voice"
                          ? "bg-violet-50 text-violet-600"
                          : log.type === "registration"
                            ? "bg-teal-50 text-teal-600"
                            : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {log.type === "sms" ? (
                      <MessageSquare className="h-3.5 w-3.5" />
                    ) : log.type === "voice" ? (
                      <Phone className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{log.motherName}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        log.status === "delivered"
                          ? "default"
                          : log.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {log.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}