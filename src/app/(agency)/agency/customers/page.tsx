import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { IPS_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";

export default async function CustomersPage() {
  const user = await requireAgency();
  const profile = await prisma.agencyProfile.findUnique({ where: { userId: user.id } });

  const customers = await prisma.user.findMany({
    where: { referredByAgency: profile?.agencyCode, role: "MEMBER" },
    include: { membership: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        顧客管理 <span className="text-sm text-text-muted font-normal">（{customers.length}名）</span>
      </h2>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {customers.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">紹介顧客はまだいません</div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/agency/customers/${c.id}`}
                className="block px-5 py-4 hover:bg-bg-elevated transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[13px] text-gold">{c.membership?.memberNumber || "---"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                    {c.membership ? IPS_STATUS_LABELS[c.membership.ipsStatus] : "---"}
                  </span>
                </div>
                <div className="text-sm text-text-primary group-hover:text-gold transition-colors">{c.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-text-muted">
                    {c.membership ? PAYMENT_STATUS_LABELS[c.membership.paymentStatus] : "---"}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-text-muted font-mono">
                      {new Date(c.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] tracking-wider border border-border-gold text-gold">
                      📋 カルテ
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
