import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import PasswordChangeForm from "../profile/PasswordChangeForm";

export default async function PasswordPage() {
  const user = await requireAuth();

  return (
    <div className="max-w-[600px]">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/settings" className="hover:text-gold transition-colors">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">パスワード変更</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        パスワード変更
      </h2>

      <PasswordChangeForm mustChange={(user as any).mustChangePassword} />
    </div>
  );
}
