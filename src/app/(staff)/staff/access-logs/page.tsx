"use client";

import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: string;
  path: string;
  pageTitle: string | null;
  accessedAt: string;
  user: { name: string; loginId: string };
}

export default function StaffAccessLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/access-logs?page=${p}&limit=50`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 0);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        アクセスログ
      </h2>
      <p className="text-sm text-text-muted mb-6">担当顧客のアクセス履歴（{total}件）</p>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {loading ? (
          <div className="text-text-muted text-sm py-8 text-center">読み込み中...</div>
        ) : logs.length === 0 ? (
          <div className="text-text-muted text-sm py-8 text-center">アクセスログがありません</div>
        ) : (
          <>
            {/* PC版テーブル */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-[11px] text-text-muted">
                    <th className="text-left px-4 py-3 font-normal">日時</th>
                    <th className="text-left px-4 py-3 font-normal">会員名</th>
                    <th className="text-left px-4 py-3 font-normal">ページ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                        {new Date(log.accessedAt).toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{log.user.name}</td>
                      <td className="px-4 py-3 text-[11px] text-text-secondary">{log.pageTitle || log.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル版 */}
            <div className="sm:hidden divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary">{log.user.name}</span>
                    <span className="font-mono text-[10px] text-text-muted">{new Date(log.accessedAt).toLocaleString("ja-JP")}</span>
                  </div>
                  <div className="text-[11px] text-text-muted">{log.pageTitle || log.path}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-border text-text-muted rounded text-xs disabled:opacity-30 cursor-pointer">前へ</button>
          <span className="text-xs text-text-muted">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-border text-text-muted rounded text-xs disabled:opacity-30 cursor-pointer">次へ</button>
        </div>
      )}
    </div>
  );
}
