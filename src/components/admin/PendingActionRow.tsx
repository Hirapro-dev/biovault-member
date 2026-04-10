import Link from "next/link";
import { formatPendingSince } from "@/lib/pending-actions";

/**
 * 「対応が必要な会員」のリスト行コンポーネント
 *
 * 会員番号・氏名・アクション内容・経過日数を1行で表示する。
 * 経過日数は形式: 「本日」「1日前」「14日前」など。
 * 経過日数に応じて色が変わる（7日以上で警告、14日以上で危険）。
 */
export default function PendingActionRow({
  href,
  memberNumber,
  name,
  action,
  icon,
  actionColor,
  since,
}: {
  href: string;
  memberNumber: string | null;
  name: string;
  action: string;
  icon: string;
  actionColor: string;
  since: Date;
}) {
  const { label: sinceLabel, colorClass: sinceColor, days } = formatPendingSince(since);
  const sinceDate = new Date(since).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <Link
      href={href}
      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 border-b border-border last:border-b-0 hover:bg-bg-elevated transition-colors group"
    >
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-mono text-[13px] text-gold">{memberNumber || "---"}</span>
          <span className="text-sm text-text-primary">{name}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[11px] ${actionColor}`}>{action}</span>
          {/* 経過日数バッジ（対応待ち開始日 + N日前） */}
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border ${
              days >= 14
                ? "bg-status-danger/10 border-status-danger/30"
                : days >= 7
                ? "bg-status-warning/10 border-status-warning/30"
                : "bg-bg-elevated border-border"
            }`}
          >
            <span aria-hidden className={sinceColor}>⏱</span>
            <span className={sinceColor}>{sinceDate}</span>
            <span className="text-text-muted">／</span>
            <span className={sinceColor}>{sinceLabel}</span>
          </span>
        </div>
      </div>
      <span className="text-text-muted group-hover:text-gold transition-colors text-sm">→</span>
    </Link>
  );
}
