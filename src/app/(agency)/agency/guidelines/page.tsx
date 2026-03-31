import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import ComingSoon from "@/components/ui/ComingSoon";
import Badge from "@/components/ui/Badge";

export default async function GuidelinesPage() {
  const user = await requireAgency();
  const profile = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    select: { hasAgreedContract: true, hasAgreedPledge: true, hasAgreedNda: true, agreedAt: true },
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">ガイドライン</h2>

      {/* 同意書類一覧 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden mb-6">
        <DocRow label="代理店契約書" agreed={profile?.hasAgreedContract || false} />
        <DocRow label="遵守誓約書" agreed={profile?.hasAgreedPledge || false} />
        <DocRow label="秘密保持契約書（NDA）" agreed={profile?.hasAgreedNda || false} last />
      </div>
      {profile?.agreedAt && (
        <p className="text-[11px] text-text-muted mb-6">全同意日: {new Date(profile.agreedAt).toLocaleDateString("ja-JP")}</p>
      )}

      {/* Coming Soon */}
      <ComingSoon title="営業ガイドライン" description="販売ルール、表現規制、FAQ等のガイドライン資料を順次公開予定です。" />
    </div>
  );
}

function DocRow({ label, agreed, last = false }: { label: string; agreed: boolean; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 ${!last ? "border-b border-border" : ""}`}>
      <span className="text-sm text-text-primary">{label}</span>
      <Badge variant={agreed ? "success" : "muted"}>{agreed ? "同意済" : "未同意"}</Badge>
    </div>
  );
}
