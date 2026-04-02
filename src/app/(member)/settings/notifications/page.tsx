import Link from "next/link";
import PushNotificationToggle from "@/components/ui/PushNotificationToggle";

export default function NotificationsPage() {
  return (
    <div className="max-w-[600px]">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/settings" className="hover:text-gold transition-colors">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">通知設定</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        通知設定
      </h2>

      <div className="bg-bg-secondary border border-border rounded-md px-5 sm:px-6">
        <PushNotificationToggle />
      </div>
    </div>
  );
}
