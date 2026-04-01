import { redirect } from "next/navigation";

/**
 * 旧公開申込フォーム
 * サイト内のサービス申込ページに移行したため、ログインページにリダイレクト
 */
export default function FormAppPage() {
  redirect("/login");
}
