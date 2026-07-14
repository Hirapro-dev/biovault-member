import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import LeadDetailPanel from "@/components/affiliate/LeadDetailPanel";

// ご紹介協力リード詳細（admin用・staffと同一画面構成）
export default async function AdminAffiliateLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const lead = await prisma.affiliateLead.findUnique({
    where: { id },
    include: {
      affiliateProfile: {
        select: {
          affiliateCode: true,
          channel: true,
          displayName: true,
          user: { select: { name: true } },
        },
      },
    },
  });
  if (!lead) notFound();

  return (
    <LeadDetailPanel
      lead={{
        ...lead,
        calledAt: lead.calledAt?.toISOString() ?? null,
        formSentAt: lead.formSentAt?.toISOString() ?? null,
        createdAt: lead.createdAt.toISOString(),
      }}
      apiBase="/api/admin/affiliate-leads"
      backHref="/admin/affiliate-leads"
    />
  );
}
