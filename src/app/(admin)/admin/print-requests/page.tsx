import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import PrintRequestCard from "./PrintRequestCard";

export default async function AdminPrintRequestsPage() {
  await requireAdmin();
  const requests = await prisma.printRequest.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">パンフレット申請管理</h2>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-md py-12 text-center text-text-muted text-sm">申請はありません</div>
        ) : (
          requests.map((r) => (
            <PrintRequestCard key={r.id} request={{
              id: r.id, agencyCode: r.agencyCode, companyName: r.companyName,
              representativeName: r.representativeName, quantity: r.quantity,
              postalCode: r.postalCode, shippingAddress: r.shippingAddress,
              paymentMethod: r.paymentMethod, note: r.note,
              status: r.status, bankInfo: r.bankInfo, adminNote: r.adminNote,
              confirmedAt: r.confirmedAt?.toISOString() || null,
              paidAt: r.paidAt?.toISOString() || null,
              orderedAt: r.orderedAt?.toISOString() || null,
              createdAt: r.createdAt.toISOString(),
            }} />
          ))
        )}
      </div>
    </div>
  );
}
