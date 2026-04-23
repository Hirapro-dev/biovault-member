"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type {
  LineMetric,
  MonthlyPoint,
  OverallTotal,
  PeriodKind,
  StaffBarPoint,
  StaffMetric,
} from "@/lib/dashboard-analytics";

type Tab = "overall" | "staff";

export default function DashboardCharts({
  monthlyData,
  overall,
}: {
  monthlyData: MonthlyPoint[];
  overall: OverallTotal;
}) {
  const [tab, setTab] = useState<Tab>("overall");

  return (
    <div className="mb-6">
      {/* タブ */}
      <div className="flex gap-1 border-b border-border mb-4">
        <TabButton active={tab === "overall"} onClick={() => setTab("overall")}>
          累計
        </TabButton>
        <TabButton active={tab === "staff"} onClick={() => setTab("staff")}>
          従業員別
        </TabButton>
      </div>

      {tab === "overall" ? (
        <OverallTab monthlyData={monthlyData} overall={overall} />
      ) : (
        <StaffTab />
      )}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm tracking-wider transition-colors border-b-2 -mb-[1px] cursor-pointer ${
        active
          ? "text-gold border-gold"
          : "text-text-muted border-transparent hover:text-text-secondary"
      }`}
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────
// 累計タブ
// ────────────────────────────────────────
function OverallTab({
  monthlyData,
  overall,
}: {
  monthlyData: MonthlyPoint[];
  overall: OverallTotal;
}) {
  const [metric, setMetric] = useState<LineMetric>("sales");

  const label =
    metric === "sales" ? "売上" : metric === "registrations" ? "登録数" : "成約数";
  const isMoney = metric === "sales";

  // 現在値
  const currentTotal =
    metric === "sales"
      ? overall.totalSales
      : metric === "registrations"
        ? overall.totalRegistrations
        : overall.totalContracts;

  const formatY = (v: number) =>
    isMoney ? `¥${(v / 10000).toLocaleString()}万` : String(v);

  const chartData = monthlyData.map((p) => ({
    ym: p.ym,
    value:
      metric === "sales"
        ? p.sales
        : metric === "registrations"
          ? p.registrations
          : p.contracts,
  }));

  return (
    <>
      {/* サマリーカード（1枚） */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] text-text-muted tracking-wider mb-1">
              全期間合計 — {label}
            </div>
            <div className="text-xl sm:text-2xl font-mono text-gold">
              {isMoney
                ? `¥${currentTotal.toLocaleString()}`
                : `${currentTotal.toLocaleString()} ${metric === "registrations" ? "名" : "件"}`}
            </div>
          </div>
          <MetricSelect value={metric} onChange={setMetric} />
        </div>
      </div>

      {/* 折れ線グラフ */}
      <div className="bg-bg-secondary border border-border rounded-md p-4">
        <div className="text-[11px] text-text-muted tracking-wider mb-3">
          月次推移（{label}）
        </div>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            データがありません
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="ym" stroke="#777" fontSize={10} />
              <YAxis stroke="#777" fontSize={10} tickFormatter={formatY} />
              <Tooltip
                contentStyle={{
                  background: "#0f0f0f",
                  border: "1px solid #3A3520",
                  borderRadius: 4,
                  fontSize: 12,
                }}
                formatter={(v) => {
                  const n = typeof v === "number" ? v : Number(v);
                  return isMoney ? `¥${n.toLocaleString()}` : `${n.toLocaleString()}`;
                }}
                labelStyle={{ color: "#BFA04B" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#BFA04B"
                strokeWidth={2}
                dot={{ fill: "#BFA04B", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

function MetricSelect({
  value,
  onChange,
}: {
  value: LineMetric;
  onChange: (v: LineMetric) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LineMetric)}
      className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold cursor-pointer"
    >
      <option value="sales">売上</option>
      <option value="registrations">メンバーシップ登録数</option>
      <option value="contracts">成約数（入金済）</option>
    </select>
  );
}

// ────────────────────────────────────────
// 従業員別タブ
// ────────────────────────────────────────
function StaffTab() {
  const [metric, setMetric] = useState<StaffMetric>("totalSales");
  const [kind, setKind] = useState<PeriodKind>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number>(
    Math.floor(new Date().getMonth() / 3) + 1,
  );
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [data, setData] = useState<StaffBarPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // 年選択肢（過去5年〜今年）
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => y - i);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({ metric, kind });
      if (kind === "year" || kind === "quarter" || kind === "month") {
        params.set("year", String(year));
      }
      if (kind === "quarter") params.set("quarter", String(quarter));
      if (kind === "month") params.set("month", String(month));
      try {
        const res = await fetch(`/api/admin/analytics/staff-bar?${params}`);
        const json = await res.json();
        setData(json.data || []);
      } catch (e) {
        console.error(e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [metric, kind, year, quarter, month]);

  const isMoney = metric === "totalSales" || metric === "staffSales" || metric === "viaAgencySales";
  const unit = isMoney ? "円" : metric === "registrations" ? "名" : "件";

  const metricLabel: Record<StaffMetric, string> = {
    totalSales: "累計売上",
    staffSales: "営業マン売上",
    viaAgencySales: "代理店経由売上",
    registrations: "メンバーシップ登録人数",
    contracts: "成約人数（入金済）",
  };

  // グラフ全体の累計値（フィルター適用後）
  const grandTotal = data.reduce((sum, d) => sum + d.value, 0);
  const grandTotalUnitLabel =
    metric === "registrations" ? "名" : metric === "contracts" ? "件" : "";

  return (
    <>
      {/* フィルター */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 mb-4 flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[10px] text-text-muted mb-1">種別</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as StaffMetric)}
            className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold cursor-pointer"
          >
            <option value="totalSales">累計売上</option>
            <option value="staffSales">営業マン売上</option>
            <option value="viaAgencySales">代理店経由売上</option>
            <option value="registrations">メンバーシップ登録人数</option>
            <option value="contracts">成約人数（入金済）</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-text-muted mb-1">年月</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as PeriodKind)}
            className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold cursor-pointer"
          >
            <option value="all">すべて</option>
            <option value="year">年ごと</option>
            <option value="quarter">四半期ごと</option>
            <option value="month">月ごと</option>
          </select>
        </div>

        {(kind === "year" || kind === "quarter" || kind === "month") && (
          <div>
            <label className="block text-[10px] text-text-muted mb-1">年</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {kind === "quarter" && (
          <div>
            <label className="block text-[10px] text-text-muted mb-1">四半期</label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
              className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold cursor-pointer"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          </div>
        )}

        {kind === "month" && (
          <div>
            <label className="block text-[10px] text-text-muted mb-1">月</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
        )}
        </div>

        {/* グラフ累計値（右端） */}
        <div className="text-right">
          <div className="text-[10px] text-text-muted tracking-wider mb-1">累計</div>
          <div className="text-lg sm:text-xl font-mono text-gold">
            {isMoney
              ? `¥${grandTotal.toLocaleString()}`
              : `${grandTotal.toLocaleString()} ${grandTotalUnitLabel}`}
          </div>
        </div>
      </div>

      {/* 棒グラフ */}
      <div className="bg-bg-secondary border border-border rounded-md p-4">
        <div className="text-[11px] text-text-muted tracking-wider mb-3">
          従業員別 — {metricLabel[metric]}
        </div>
        {loading ? (
          <div className="py-12 text-center text-text-muted text-sm">読み込み中...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            データがありません
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="name"
                stroke="#777"
                fontSize={10}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                stroke="#777"
                fontSize={10}
                tickFormatter={(v: number) =>
                  isMoney ? `¥${(v / 10000).toLocaleString()}万` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#0f0f0f",
                  border: "1px solid #3A3520",
                  borderRadius: 4,
                  fontSize: 12,
                }}
                formatter={(v) => {
                  const n = typeof v === "number" ? v : Number(v);
                  return isMoney
                    ? `¥${n.toLocaleString()}`
                    : `${n.toLocaleString()} ${unit}`;
                }}
                labelStyle={{ color: "#BFA04B" }}
              />
              <Bar dataKey="value" fill="#BFA04B">
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="#BFA04B"
                  fontSize={10}
                  formatter={(v) => {
                    const n = typeof v === "number" ? v : Number(v);
                    if (!n) return "";
                    return isMoney
                      ? `¥${n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}万` : n.toLocaleString()}`
                      : `${n.toLocaleString()}`;
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
