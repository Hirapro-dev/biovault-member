import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Badge from "@/components/ui/Badge";
import { DOCUMENT_TYPE_LABELS } from "@/types";

export default async function DocumentsPage() {
  const user = await requireAuth();

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  const statusConfig = {
    SIGNED: { label: "署名済", variant: "success" as const },
    SENT: { label: "送付済", variant: "warning" as const },
    PENDING: { label: "未署名", variant: "muted" as const },
    ARCHIVED: { label: "アーカイブ", variant: "muted" as const },
  };

  return (
    <div>
      <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px] mb-7">
        契約書類
      </h2>

      <div className="flex flex-col gap-3">
        {documents.map((doc) => {
          const st = statusConfig[doc.status];
          return (
            <div
              key={doc.id}
              className="bg-bg-secondary border border-border rounded-md px-7 py-5 flex items-center justify-between transition-colors duration-300 hover:border-border-gold"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded bg-bg-elevated flex items-center justify-center text-base text-gold">
                  ◇
                </div>
                <div>
                  <div className="text-sm text-text-primary">
                    {DOCUMENT_TYPE_LABELS[doc.type] || doc.title}
                  </div>
                  {doc.signedAt && (
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {new Date(doc.signedAt).toLocaleDateString("ja-JP")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={st.variant}>{st.label}</Badge>
                {doc.status === "SIGNED" && doc.fileUrl && (
                  <button className="px-3.5 py-1.5 bg-transparent border border-border text-text-secondary rounded-sm cursor-pointer text-[11px] hover:border-border-gold hover:text-gold transition-all duration-300">
                    PDF
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {documents.length === 0 && (
          <div className="text-center py-16 text-text-muted text-sm">
            書類が登録されていません
          </div>
        )}
      </div>
    </div>
  );
}
