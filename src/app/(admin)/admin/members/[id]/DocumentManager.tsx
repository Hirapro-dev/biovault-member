"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from "@/types";

interface Doc {
  id: string;
  type: string;
  title: string;
  status: string;
  fileUrl: string | null;
  signedAt: string | null;
}

export default function DocumentManager({
  userId,
  documents,
}: {
  userId: string;
  documents: Doc[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetDocId, setTargetDocId] = useState<string | null>(null);

  const handleUploadClick = (docId: string) => {
    setTargetDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetDocId) return;

    if (file.type !== "application/pdf") {
      setError("PDFファイルのみアップロードできます");
      return;
    }

    setUploading(targetDocId);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", targetDocId);

      const res = await fetch(`/api/admin/members/${userId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("アップロードしました");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "アップロードに失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setUploading(null);
      setTargetDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const statusVariant = (status: string) => {
    if (status === "SIGNED") return "bg-status-active/10 text-status-active border-status-active/20";
    if (status === "SENT") return "bg-status-warning/10 text-status-warning border-status-warning/20";
    return "bg-text-muted/10 text-text-muted border-text-muted/20";
  };

  return (
    <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        書類管理
      </h3>

      {message && (
        <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">
          {error}
        </div>
      )}

      {/* 隠しファイルインプット */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-b-0 gap-2"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-text-primary">
              {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.title}
            </div>
            {doc.signedAt && (
              <div className="text-[11px] text-text-muted mt-0.5">
                署名日: {new Date(doc.signedAt).toLocaleDateString("ja-JP")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* ステータスバッジ */}
            <span className={`text-[11px] px-2.5 py-1 rounded-full border ${statusVariant(doc.status)}`}>
              {DOCUMENT_STATUS_LABELS[doc.status as keyof typeof DOCUMENT_STATUS_LABELS]}
            </span>

            {/* PDF閲覧ボタン */}
            {doc.fileUrl && (
              <a
                href={`/api/member/documents/${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all cursor-pointer"
              >
                PDF
              </a>
            )}

            {/* アップロードボタン */}
            <button
              onClick={() => handleUploadClick(doc.id)}
              disabled={uploading === doc.id}
              className="px-3 py-1.5 bg-transparent border border-border text-text-muted rounded-sm text-[11px] hover:border-gold hover:text-gold transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading === doc.id ? "..." : doc.fileUrl ? "再UP" : "UP"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
