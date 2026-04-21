/**
 * 現在のステップ表示バッジ
 *
 * ダッシュボード（TimelineView）のスタイルに合わせ、
 * ステップラベル + actor（管理者対応/会員待ち）バッジを表示する。
 */

type StateKind = "active" | "storage" | "storage_expired" | "completed";

type Props = {
  icon?: string;
  label: string;                       // ステップのラベル
  actor?: "admin" | "member";          // 対応主体
  state?: StateKind;                   // "storage"=保管中 / "storage_expired"=保管切れ / "completed"=完了
  sub?: string | null;                 // サブラベル（例: 培養上清液のステップ名）
  subActor?: "admin" | "member";       // サブのactor
  subState?: StateKind;                // サブのstate
};

type BadgeKind = "admin" | "member" | "storage" | "storage_expired" | "completed" | "empty";

function StateBadge({ kind }: { kind: BadgeKind }) {
  if (kind === "empty") {
    // バッジ未表示時も幅を確保してラベル位置を揃える
    return <span className="inline-block w-[68px] shrink-0" />;
  }
  const styles: Record<Exclude<BadgeKind, "empty">, string> = {
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
    member: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    storage: "bg-gray-500/10 text-text-muted border-border",
    storage_expired: "bg-gray-500/15 text-text-muted border-border",
    completed: "bg-gray-500/10 text-text-muted border-border",
  };
  const labels: Record<Exclude<BadgeKind, "empty">, string> = {
    admin: "要対応",
    member: "会員待ち",
    storage: "保管中",
    storage_expired: "保管切れ",
    completed: "完了",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-[68px] text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${styles[kind]}`}
    >
      {labels[kind]}
    </span>
  );
}

function resolveKind(actor?: "admin" | "member", state?: StateKind): BadgeKind {
  if (state === "storage_expired") return "storage_expired";
  if (state === "storage") return "storage";
  if (state === "completed") return "completed";
  if (actor) return actor;
  return "empty";
}

export default function StepBadge({ icon, label, actor, state, sub, subActor, subState }: Props) {
  const mainKind = resolveKind(actor, state);
  const subKind = resolveKind(subActor, subState);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <StateBadge kind={mainKind} />
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <span className="text-xs">{icon}</span>}
          <span className="text-[11px] text-text-primary">{label}</span>
        </div>
      </div>
      {sub && (
        <div className="flex items-center gap-2">
          <StateBadge kind={subKind} />
          <span className="text-[10px] text-text-muted">培養上清液: {sub}</span>
        </div>
      )}
    </div>
  );
}
