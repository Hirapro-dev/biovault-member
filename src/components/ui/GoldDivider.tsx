export default function GoldDivider({ width = 80, className = "" }: { width?: number; className?: string }) {
  return (
    <div
      className={`mx-auto ${className}`}
      style={{
        width,
        height: 1,
        background: "linear-gradient(90deg, transparent, var(--color-gold-primary), transparent)",
      }}
    />
  );
}
