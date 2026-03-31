import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import AgencyAgreeForm from "./AgencyAgreeForm";
import { redirect } from "next/navigation";

export default async function AgencyAgreePage() {
  const user = await requireAgency();

  const profile = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    select: { hasAgreedContract: true, hasAgreedPledge: true, hasAgreedNda: true },
  });

  if (!profile) redirect("/login");

  // 全て同意済みならダッシュボードへ
  if (profile.hasAgreedContract && profile.hasAgreedPledge && profile.hasAgreedNda) {
    redirect("/agency");
  }

  return <AgencyAgreeForm />;
}
