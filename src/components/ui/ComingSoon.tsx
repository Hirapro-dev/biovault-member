import GoldDivider from "./GoldDivider";

export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
      <h2 className="font-serif text-3xl font-light tracking-[2px] text-gold mb-6">
        Coming Soon
      </h2>
      <GoldDivider width={60} className="mx-auto mb-6" />
      <h3 className="font-serif-jp text-lg font-normal text-text-primary mb-3">
        {title}
      </h3>
      {/* <p className="text-[16px] text-text-secondary leading-relaxed max-w-[400px]">
        {description}
      </p> */}
      <p className="text-[14px] text-text-muted mt-6">
        サービス開始までしばらくお待ちください
      </p>
    </div>
  );
}
