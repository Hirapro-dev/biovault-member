"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  userId: string;
  path: string;
  pageTitle: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  accessedAt: string;
  user: { name: string; loginId: string; email: string };
}

export default function AdminAccessLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/access-logs?limit=200")
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); });
  }, []);

  // デバイス判定
  const getDevice = (ua: string | null) => {
    if (!ua) return "---";
    if (/iPhone|Android.*Mobile/i.test(ua)) return "スマホ";
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) return "タブレット";
    return "PC";
  };

  return (
    <div>
      <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px] mb-7">
        アクセスログ
      </h2>

      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">読み込み中...</div>
      ) : logs.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-md p-16 text-center">
          <div className="text-3xl mb-4">📊</div>
          <p className="text-sm text-text-muted">アクセスログはまだありません</p>
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-bg-secondary border border-border rounded-md p-4 text-center">
              <div className="text-[11px] text-text-muted tracking-wider mb-1">総閲覧数</div>
              <div className="font-mono text-2xl text-gold">{logs.length}</div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-md p-4 text-center">
              <div className="text-[11px] text-text-muted tracking-wider mb-1">ユニークユーザー</div>
              <div className="font-mono text-2xl text-gold">{new Set(logs.map((l) => l.userId)).size}</div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-md p-4 text-center">
              <div className="text-[11px] text-text-muted tracking-wider mb-1">今日</div>
              <div className="font-mono text-2xl text-gold">
                {logs.filter((l) => new Date(l.accessedAt).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
          </div>

          {/* ログテーブル */}
          <div className="bg-bg-secondary border border-border rounded-md overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">日時</th>
                  <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">ユーザー</th>
                  <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">ページ</th>
                  <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal w-16">端末</th>
                  <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal w-28">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                    <td className="px-4 py-3 text-[11px] text-text-muted font-mono whitespace-nowrap">
                      {new Date(log.accessedAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-text-primary">{log.user.name}</div>
                      <div className="text-[10px] text-text-muted">{log.user.loginId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-text-primary">{log.pageTitle || "---"}</div>
                      <div className="text-[10px] text-text-muted font-mono">{log.path}</div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-text-muted">{getDevice(log.userAgent)}</td>
                    <td className="px-4 py-3 text-[10px] text-text-muted font-mono">{log.ipAddress || "---"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
