import type { Metadata } from "next";
import GaTag from "@/components/affiliate/GaTag";
import LeadForm from "./LeadForm";

export const metadata: Metadata = {
  title: "無料適合確認のお申込み | BioVault",
  description: "iPS細胞作製適合検査の無料適合確認のお申込みフォームです。",
  robots: { index: false },
};

export default async function LeadEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <GaTag />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-5 text-center">
          <div className="font-serif text-2xl tracking-widest">BioVault</div>
          <div className="mt-1 text-[10px] tracking-[0.3em] text-gray-500">iPS CELL BANKING</div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-center text-2xl font-bold leading-relaxed">
          無料適合確認のお申込み
        </h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-gray-600">
          iPS細胞作製の適合確認をご希望の方は、以下のフォームにご入力ください。
          <br />
          担当者よりお電話にてご連絡いたします。
        </p>
        <LeadForm refCode={ref || ""} />
        <div className="mt-8 space-y-1 text-xs leading-relaxed text-gray-500">
          <p>※現在または過去の病気歴、服用中のお薬等によっては適合しない場合があります。</p>
          <p>※ご入力いただきました情報はBioVaultが提携するiPS細胞作製ラボに送付され適合確認が行われます。</p>
        </div>
      </main>
      <footer className="mt-10 border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        ©2026 株式会社BioVault
      </footer>
    </div>
  );
}
