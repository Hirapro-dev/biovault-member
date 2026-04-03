import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function HealthPage() {
  const user = await requireAuth();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      currentIllness: true,
      currentIllnessDetail: true,
      pastIllness: true,
      pastIllnessDetail: true,
      currentMedication: true,
      currentMedicationDetail: true,
      chronicDisease: true,
      chronicDiseaseDetail: true,
      infectiousDisease: true,
      infectiousDiseaseDetail: true,
      pregnancy: true,
      allergy: true,
      allergyDetail: true,
      otherHealth: true,
      otherHealthDetail: true,
    },
  });

  if (!fullUser) return null;

  return (
    <div>
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/mypage" className="hover:text-gold transition-colors">マイページ</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">健康状態確認</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        健康状態確認
      </h2>

      <div className="max-w-[600px]">
        <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6">
          <div className="space-y-3">
            <HealthItem label="現在治療中の病気" active={fullUser.currentIllness} detail={fullUser.currentIllnessDetail} />
            <HealthItem label="過去の病気・手術歴" active={fullUser.pastIllness} detail={fullUser.pastIllnessDetail} />
            <HealthItem label="現在使用中の薬" active={fullUser.currentMedication} detail={fullUser.currentMedicationDetail} />
            <HealthItem label="持病" active={fullUser.chronicDisease} detail={fullUser.chronicDiseaseDetail} />
            <HealthItem label="感染症の罹患歴" active={fullUser.infectiousDisease} detail={fullUser.infectiousDiseaseDetail} />
            <HealthItem label="妊娠中・妊娠の可能性" active={fullUser.pregnancy} />
            <HealthItem label="アレルギー" active={fullUser.allergy} detail={fullUser.allergyDetail} />
            <HealthItem label="その他の健康上の事項" active={fullUser.otherHealth} detail={fullUser.otherHealthDetail} />
          </div>
          {!fullUser.currentIllness && !fullUser.pastIllness && !fullUser.currentMedication &&
           !fullUser.chronicDisease && !fullUser.infectiousDisease && !fullUser.pregnancy &&
           !fullUser.allergy && !fullUser.otherHealth && (
            <div className="text-center text-sm text-text-muted py-4">特記事項なし</div>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, active, detail }: { label: string; active: boolean; detail?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
      <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
        active
          ? "bg-status-warning/20 text-status-warning border border-status-warning/30"
          : "bg-bg-elevated text-text-muted border border-border"
      }`}>
        {active ? "!" : "✓"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-primary">{label}</div>
        {active ? (
          <div className="text-[12px] text-text-secondary mt-0.5">{detail || "あり"}</div>
        ) : (
          <div className="text-[12px] text-text-muted mt-0.5">なし</div>
        )}
      </div>
    </div>
  );
}
