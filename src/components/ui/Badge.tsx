type BadgeVariant = "gold" | "success" | "warning" | "danger" | "muted";

const variants: Record<BadgeVariant, string> = {
  gold: "bg-gold/10 text-gold border-gold/20",
  success: "bg-status-active/10 text-status-active border-status-active/20",
  warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
  danger: "bg-status-danger/10 text-status-danger border-status-danger/20",
  muted: "bg-text-muted/10 text-text-muted border-text-muted/20",
};

export default function Badge({
  children,
  variant = "gold",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span className={`inline-flex items-center text-[11px] px-3 py-1 rounded-full border ${variants[variant]}`}>
      {children}
    </span>
  );
}
