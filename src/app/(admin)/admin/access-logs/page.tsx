"use client";

import { useState, useEffect, useCallback } from "react";

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

interface ApiResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// パスから日本語ページ名を返すヘルパー
const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "トップページ",
  "/mypage": "マイページ",
  "/info": "サービス詳細",
  "/favorites": "お気に入り",
  "/apply-service": "iPSサービス利用申込",
  "/documents": "契約書類",
  "/status": "ステータス詳細",
  "/pamphlet": "パンフレット",
  "/settings": "設定",
  "/settings/profile": "プロフィール",
  "/settings/terms": "利用規約",
  "/settings/legal": "特商法",
  "/settings/privacy": "プライバシーポリシー",
  "/concierge": "コンシェルジュ",
  "/important-notice": "重要事項説明",
  "/treatment": "投与記録",
  "/glossary": "用語集",
  "/about-ips": "コンテンツ",
  "/about-ips/news": "ニュース一覧",
  "/about-ips/history": "iPS細胞の歴史",
  "/about-ips/what-is-ips": "iPS細胞とは",
  "/about-ips/glossary": "用語集",
};

// フィルタ用のページ選択肢
const PAGE_FILTER_OPTIONS = [
  { value: "", label: "すべてのページ" },
  { value: "/dashboard", label: "トップページ" },
  { value: "/mypage", label: "マイページ" },
  { value: "/info", label: "サービス詳細" },
  { value: "/favorites", label: "お気に入り" },
  { value: "/apply-service", label: "iPSサービス利用申込" },
  { value: "/documents", label: "契約書類" },
  { value: "/status", label: "ステータス詳細" },
  { value: "/pamphlet", label: "パンフレット" },
  { value: "/settings", label: "設定" },
  { value: "/concierge", label: "コンシェルジュ" },
  { value: "/important-notice", label: "重要事項説明" },
  { value: "/treatment", label: "投与記録" },
  { value: "/about-ips", label: "コンテンツ（記事・動画）" },
];

// 日付をinput[type=date]用のフォーマットに
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function AdminAccessLogsPage() {
  // デフォルト: 直近7日間
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  // フィルタ
  const [dateFrom, setDateFrom] = useState(toDateStr(weekAgo));
  const [dateTo, setDateTo] = useState(toDateStr(now));
  const [pathFilter, setPathFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // ユーザー名でのクライアント側フィルタ用（APIにはpath/dateのみ送信）
  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(limit));

    // 日付範囲
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      params.set("from", from.toISOString());
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      params.set("to", to.toISOString());
    }
    if (pathFilter) params.set("path", pathFilter);

    const res = await fetch(`/api/admin/access-logs?${params.toString()}`);
    const data: ApiResponse = await res.json();
    setLogs(data.logs);
    setTotal(data.total);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [dateFrom, dateTo, pathFilter]);

  // 初回 + フィルタ変更時
  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // ユーザー名でクライアント側フィルタ
  const filteredLogs = userSearch
    ? logs.filter(
        (l) =>
          l.user.name.includes(userSearch) ||
          l.user.loginId.includes(userSearch) ||
          l.user.email.includes(userSearch)
      )
    : logs;

  // デバイス判定
  const getDevice = (ua: string | null) => {
    if (!ua) return "---";
    if (/iPhone|Android.*Mobile/i.test(ua)) return "スマホ";
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) return "タブレット";
    return "PC";
  };

  // ページ名取得
  const getPageLabel = (path: string, title: string | null) => {
    if (title) return title;
    for (const [key, label] of Object.entries(PAGE_LABELS)) {
      if (path === key || path.startsWith(key + "/")) return label;
    }
    return path;
  };

  // 日付プリセット
  const setPreset = (days: number) => {
    const n = new Date();
    const from = new Date(n);
    from.setDate(from.getDate() - days);
    setDateFrom(toDateStr(from));
    setDateTo(toDateStr(n));
  };

  return (
    <div>
      <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px] mb-7">
        アクセスログ
      </h2>

      {/* フィルタパネル */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-text-muted tracking-wider">フィルタ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {/* 開始日 */}
          <div>
            <label className="block text-[11px] text-text-muted mb-1">開始日</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded px-3 py-2 text-sm text-text-primary"
            />
          </div>
          {/* 終了日 */}
          <div>
            <label className="block text-[11px] text-text-muted mb-1">終了日</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded px-3 py-2 text-sm text-text-primary"
            />
          </div>
          {/* ページフィルタ */}
          <div>
            <label className="block text-[11px] text-text-muted mb-1">ページ</label>
            <select
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded px-3 py-2 text-sm text-text-primary"
            >
              {PAGE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* ユーザー検索 */}
          <div>
            <label className="block text-[11px] text-text-muted mb-1">ユーザー</label>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="名前・ID・メールで検索"
              className="w-full bg-bg-primary border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50"
            />
          </div>
        </div>

        {/* 日付プリセットボタン */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "今日", days: 0 },
            { label: "直近3日", days: 3 },
            { label: "直近7日", days: 7 },
            { label: "直近14日", days: 14 },
            { label: "直近30日", days: 30 },
          ].map((p) => (
            <button
              key={p.days}
              onClick={() => {
                if (p.days === 0) {
                  const today = toDateStr(new Date());
                  setDateFrom(today);
                  setDateTo(today);
                } else {
                  setPreset(p.days);
                }
              }}
              className="px-3 py-1 text-[11px] border border-border rounded hover:border-gold hover:text-gold transition-colors text-text-muted"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">読み込み中...</div>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-bg-secondary border border-border rounded-md p-4 text-center">
              <div className="text-[11px] text-text-muted tracking-wider mb-1">表示件数</div>
              <div className="font-mono text-2xl text-gold">{filteredLogs.length}</div>
              <div className="text-[10px] text-text-muted mt-1">/ 全{total}件</div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-md p-4 text-center">
              <div className="text-[11px] text-text-muted tracking-wider mb-1">ユニークユーザー</div>
              <div className="font-mono text-2xl text-gold">
                {new Set(filteredLogs.map((l) => l.userId)).size}
              </div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-md p-4 text-center">
              <div className="text-[11px] text-text-muted tracking-wider mb-1">今日のアクセス</div>
              <div className="font-mono text-2xl text-gold">
                {filteredLogs.filter(
                  (l) => new Date(l.accessedAt).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-md p-16 text-center">
              <div className="text-3xl mb-4">📊</div>
              <p className="text-sm text-text-muted">
                該当するアクセスログはありません
              </p>
              <p className="text-[11px] text-text-muted mt-1">フィルタ条件を変更してください</p>
            </div>
          ) : (
            <>
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
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                        <td className="px-4 py-3 text-[11px] text-text-muted font-mono whitespace-nowrap">
                          {new Date(log.accessedAt).toLocaleString("ja-JP", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-text-primary">{log.user.name}</div>
                          <div className="text-[10px] text-text-muted">{log.user.loginId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-text-primary">
                            {getPageLabel(log.path, log.pageTitle)}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono">{log.path}</div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-text-muted">{getDevice(log.userAgent)}</td>
                        <td className="px-4 py-3 text-[10px] text-text-muted font-mono">{log.ipAddress || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => fetchLogs(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-[12px] border border-border rounded disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold hover:text-gold transition-colors text-text-muted"
                  >
                    前へ
                  </button>
                  <span className="text-[12px] text-text-muted font-mono">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => fetchLogs(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-[12px] border border-border rounded disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold hover:text-gold transition-colors text-text-muted"
                  >
                    次へ
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
