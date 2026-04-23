"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { MonthlyBarMetric, MonthlyBarPoint } from "@/lib/dashboard-analytics";

type MetricOption = {
  value: MonthlyBarMetric;
  label: string;
};

/**
 * 月次棒グラフ（1月〜12月固定）
 * 従業員 / 代理店 ダッシュボードで使用
 */
export default function MonthlyBarChart({
  apiPath,
  metricOptions,
  defaultMetric,
}: {
  apiPath: string;
  metricOptions: MetricOption[];
  defaultMetric: MonthlyBarMetric;
}) {
  const [metric, setMetric] = useState<MonthlyBarMetric>(defaultMetric);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<MonthlyBarPoint[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({ month: i + 1, label: `${i + 1}月`, value: 0 })),
  );
  const [loading, setLoading] = useState(false);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => y - i);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({ metric, year: String(year) });
      try {
        const res = await fetch(`${apiPath}?${params}`);
        const json = await res.json();
        setData(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [metric, year, apiPath]);

  const isMoney =
    metric === "totalSales" || metric === "staffSales" || metric === "viaAgencySales";
  const unitLabel =
    metric === "registrations" ? "名" : metric === "contracts" ? "件" : "";

  const grandTotal = data.reduce((sum, d) => sum + d.value, 0);

  const currentLabel =
    metricOptions.find((o) => o.value === metric)?.label ?? "";

  return (
    <div className="mb-6">
      {/* フィルター */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 mb-4 flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] text-text-muted mb-1">種別</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MonthlyBarMetric)}
              className="px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold cursor-pointer"
            >
              {metricOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
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
        </div>
        {/* 年間累計（右端） */}
        <div className="text-right">
          <div className="text-[10px] text-text-muted tracking-wider mb-1">
            {year}年 累計
          </div>
          <div className="text-lg sm:text-xl font-mono text-gold">
            {isMoney
              ? `¥${grandTotal.toLocaleString()}`
              : `${grandTotal.toLocaleString()} ${unitLabel}`}
          </div>
        </div>
      </div>

      {/* 棒グラフ */}
      <div className="bg-bg-secondary border border-border rounded-md p-4">
        <div className="text-[11px] text-text-muted tracking-wider mb-3">
          月別 — {currentLabel}（{year}年）
        </div>
        {loading ? (
          <div className="py-12 text-center text-text-muted text-sm">読み込み中...</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="label" stroke="#777" fontSize={10} interval={0} />
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
                    : `${n.toLocaleString()} ${unitLabel}`;
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
    </div>
  );
}
