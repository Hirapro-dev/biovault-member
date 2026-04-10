import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// メールアドレスの重複チェック（フォームのリアルタイムバリデーション用）
//
// 重複扱いとするケース:
//   1) User テーブルにメールアドレスが存在する（実際に登録済みの会員）
//   2) Application テーブルに「進行中（PENDING / REVIEWING）」かつ「未会員化」の
//      申込が存在する（同じ人がフォームを2回送信するのを防ぐ）
//
// 重複扱いとしないケース:
//   - 過去に削除された会員のメールアドレス（User からは消えているが、何らかの理由で
//     Application レコードが残っている場合）
//   - 既に会員化済み（convertedUserId が設定されている）の Application
//   - 却下／承認済みなど、もう新規申込として扱う必要がないもの
export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ available: false, error: "メールアドレスを入力してください" });
  }

  // 1) 既存の User と一致するメール → 重複
  //    role に応じてメッセージを具体化（会員 / 代理店 / 従業員 / 管理者）
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  if (existingUser) {
    let error: string;
    switch (existingUser.role) {
      case "MEMBER":
        error = "このメールアドレスは既に会員として登録されています";
        break;
      case "AGENCY":
        error = "このメールアドレスは既に代理店として登録されています";
        break;
      case "STAFF":
        error = "このメールアドレスは既に従業員として登録されています";
        break;
      case "ADMIN":
      case "SUPER_ADMIN":
        error = "このメールアドレスは既に管理者として登録されています";
        break;
      default:
        error = "このメールアドレスは既に登録されています";
    }
    return NextResponse.json({ available: false, error });
  }

  // 2) 進行中の申込と一致するメール → 重複（二重送信防止）
  //    convertedUserId が null の場合のみ「進行中」とみなす
  const pendingApp = await prisma.application.findFirst({
    where: {
      email,
      convertedUserId: null,
      status: { in: ["PENDING", "REVIEWING"] },
    },
  });
  if (pendingApp) {
    return NextResponse.json({ available: false, error: "このメールアドレスは既に申込受付中です" });
  }

  return NextResponse.json({ available: true });
}
