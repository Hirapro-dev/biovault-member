import { redirect } from "next/navigation";

// 旧iPS Portalトップは/dashboardに統合されたためリダイレクト
export default function AboutIpsPage() {
  redirect("/dashboard");
}
