import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 会員一覧取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    include: { membership: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(members);
}

// アカウント発行
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { name, nameKana, nameRomaji, email, phone, dateOfBirth, address, referrerName, loginId: requestedLoginId, password: requestedPassword } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "氏名とメールアドレスは必須です" }, { status: 400 });
  }

  if (!nameKana) {
    return NextResponse.json({ error: "フリガナは必須です" }, { status: 400 });
  }

  // メールアドレスの重複チェック
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
  }

  // ログインID: フロントから指定があればそれを使用、なければ自動生成
  const loginId = requestedLoginId || await generateLoginIdFromKana(nameKana);

  // ログインIDの重複チェック
  const loginIdExists = await prisma.user.findUnique({ where: { loginId } });
  if (loginIdExists) {
    return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
  }

  // パスワード: フロントから指定があればそれを使用、なければ自動生成
  const tempPassword = requestedPassword || generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // 会員番号の自動採番
  const lastMembership = await prisma.membership.findFirst({
    orderBy: { memberNumber: "desc" },
  });
  const nextNumber = lastMembership
    ? parseInt(lastMembership.memberNumber.replace("BV-", "")) + 1
    : 1;
  const memberNumber = `BV-${String(nextNumber).padStart(4, "0")}`;

  // トランザクションでユーザーと会員権を同時作成
  const user = await prisma.user.create({
    data: {
      loginId,
      email,
      passwordHash,
      name,
      nameKana,
      nameRomaji: nameRomaji || null,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address: address || null,
      role: "MEMBER",
      mustChangePassword: true,
      membership: {
        create: {
          memberNumber,
          plan: "STANDARD",
          contractDate: new Date(),
          totalAmount: 8800000,
          referrerName,
        },
      },
    },
    include: { membership: true },
  });

  // デフォルト書類を作成
  const documentTypes = [
    { type: "CONTRACT" as const, title: "会員契約書（細胞保管委託契約書）" },
    { type: "CONSENT_CELL_STORAGE" as const, title: "iPSサービス利用契約書" },
    { type: "CELL_STORAGE_CONSENT" as const, title: "細胞提供・保管同意書" },
    { type: "INFORMED_CONSENT" as const, title: "iPS細胞作製における事前説明・同意" },
    { type: "PRIVACY_POLICY" as const, title: "個人情報取扱同意書" },
    { type: "SIMPLE_AGREEMENT" as const, title: "簡易規約" },
  ];

  await prisma.document.createMany({
    data: documentTypes.map((d) => ({
      userId: user.id,
      type: d.type,
      title: d.title,
      status: "PENDING" as const,
    })),
  });

  return NextResponse.json({
    user,
    loginId,
    tempPassword,
    memberNumber,
  });
}

// カタカナ → ローマ字変換テーブル
const KANA_MAP: Record<string, string> = {
  "ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o",
  "カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko",
  "サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so",
  "タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to",
  "ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no",
  "ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho",
  "マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo",
  "ヤ":"ya","ユ":"yu","ヨ":"yo",
  "ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro",
  "ワ":"wa","ヲ":"wo","ン":"n",
  "ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go",
  "ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo",
  "ダ":"da","ヂ":"di","ヅ":"du","デ":"de","ド":"do",
  "バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo",
  "パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po",
  "キャ":"kya","キュ":"kyu","キョ":"kyo",
  "シャ":"sha","シュ":"shu","ショ":"sho",
  "チャ":"cha","チュ":"chu","チョ":"cho",
  "ニャ":"nya","ニュ":"nyu","ニョ":"nyo",
  "ヒャ":"hya","ヒュ":"hyu","ヒョ":"hyo",
  "ミャ":"mya","ミュ":"myu","ミョ":"myo",
  "リャ":"rya","リュ":"ryu","リョ":"ryo",
  "ギャ":"gya","ギュ":"gyu","ギョ":"gyo",
  "ジャ":"ja","ジュ":"ju","ジョ":"jo",
  "ビャ":"bya","ビュ":"byu","ビョ":"byo",
  "ピャ":"pya","ピュ":"pyu","ピョ":"pyo",
  "ッ":"tt", // 促音は次の子音を重ねる（簡易対応）
  "ー":"",
};

function kataToRomaji(kana: string): string {
  let result = "";
  let i = 0;
  while (i < kana.length) {
    // 2文字の拗音を先にチェック
    if (i + 1 < kana.length) {
      const two = kana.substring(i, i + 2);
      if (KANA_MAP[two]) {
        result += KANA_MAP[two];
        i += 2;
        continue;
      }
    }
    // 促音の処理
    if (kana[i] === "ッ" && i + 1 < kana.length) {
      const nextChar = kana[i + 1];
      const nextRomaji = KANA_MAP[nextChar];
      if (nextRomaji) {
        result += nextRomaji[0]; // 次の子音を重ねる
      }
      i++;
      continue;
    }
    // 1文字
    const one = kana[i];
    if (KANA_MAP[one] !== undefined) {
      result += KANA_MAP[one];
    }
    i++;
  }
  return result;
}

// フリガナから苗字のローマ字を抽出
function extractLastNameRomaji(nameKana: string): string {
  // スペースで区切って苗字（最初の部分）を取得
  const lastName = nameKana.trim().split(/[\s　]+/)[0];
  const romaji = kataToRomaji(lastName).toLowerCase();
  // ローマ字が取れなかった場合のフォールバック
  return romaji || "user";
}

// 苗字ローマ字 + 4桁数字のログインIDを生成（重複チェック付き）
async function generateLoginIdFromKana(nameKana: string): Promise<string> {
  const base = extractLastNameRomaji(nameKana);

  for (let attempt = 0; attempt < 100; attempt++) {
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const loginId = `${base}${num}`;
    const exists = await prisma.user.findUnique({ where: { loginId } });
    if (!exists) return loginId;
  }
  throw new Error("ログインIDの生成に失敗しました");
}

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
