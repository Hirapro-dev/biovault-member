import { redirect } from "next/navigation";

// 旧 /glossary は /about-ips/glossary にリダイレクト
export default function GlossaryRedirect() {
  redirect("/about-ips/glossary");
}
