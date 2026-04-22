import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, agencyApplicationReceivedEmail } from "@/lib/mail";
import { notifyAgencyApplied } from "@/lib/status-notification";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.representativeName || !body.nameKana || !body.email || !body.phone || !body.address) {
      return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 });
    }

    // メール重複チェック
    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 400 });
    }

    // 申込データ保存
    const application = await prisma.agencyApplication.create({
      data: {
        companyName: body.companyName || null,
        representativeName: body.representativeName,
        nameKana: body.nameKana,
        email: body.email,
        phone: body.phone,
        postalCode: body.postalCode || null,
        address: body.address,
        occupation: body.occupation || null,
        motivation: body.motivation || null,
        experience: body.experience || null,
      },
    });

    // ログインID生成
    const loginId = await generateUniqueLoginId(body.nameKana);
    const tempPassword = generatePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // エージェントコード自動採番
    const lastAgency = await prisma.agencyProfile.findFirst({ orderBy: { agencyCode: "desc" } });
    const nextNum = lastAgency ? parseInt(lastAgency.agencyCode.replace("AG-", "")) + 1 : 1;
    const agencyCode = `AG-${String(nextNum).padStart(4, "0")}`;

    // ユーザー + エージェントプロフィール作成
    const user = await prisma.user.create({
      data: {
        loginId,
        email: body.email,
        passwordHash,
        name: body.representativeName,
        nameKana: body.nameKana,
        phone: body.phone,
        postalCode: body.postalCode || null,
        address: body.address,
        occupation: body.occupation || null,
        role: "AGENCY",
        isIdIssued: false,
        mustChangePassword: true,
        referredByStaff: body.staffCode || null,
        agencyProfile: {
          create: {
            agencyCode,
            companyName: body.companyName || null,
            representativeName: body.representativeName,
          },
        },
      },
    });

    await prisma.agencyApplication.update({
      where: { id: application.id },
      data: { status: "REGISTERED", convertedUserId: user.id },
    });

    // 申込者本人への自動返信メール送信
    try {
      const emailContent = agencyApplicationReceivedEmail(body.representativeName);
      await sendEmail({ to: body.email, ...emailContent });
    } catch (e) {
      console.error("Agency apply auto-reply email failed:", e);
    }

    // 新規エージェント申込の通知メール送信
    try {
      let staffName: string | null = null;
      if (body.staffCode) {
        const staff = await prisma.staff.findUnique({
          where: { staffCode: body.staffCode },
          select: { name: true, staffCode: true },
        });
        staffName = staff ? `${staff.name}（${staff.staffCode}）` : null;
      }
      await notifyAgencyApplied({
        userId: user.id,
        agencyName: body.representativeName,
        agencyCode,
        companyName: body.companyName || null,
        email: body.email,
        phone: body.phone,
        address: body.address,
        occupation: body.occupation || null,
        motivation: body.motivation || null,
        experience: body.experience || null,
        staffName,
      });
    } catch (e) {
      console.error("Agency application notification failed:", e);
    }

    return NextResponse.json({ id: application.id, userId: user.id, agencyCode, loginId, tempPassword, success: true });
  } catch (error: unknown) {
    console.error("Agency application error:", error);
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ユーティリティ（既存と同じパターン）
const KANA_MAP: Record<string, string> = {"ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko","サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to","ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho","マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo","ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n","ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo","ダ":"da","ヂ":"di","ヅ":"du","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo","パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","ッ":"tt","ー":""};
function kataToRomaji(kana: string) { let r="",i=0; while(i<kana.length){if(i+1<kana.length&&KANA_MAP[kana.substring(i,i+2)]){r+=KANA_MAP[kana.substring(i,i+2)];i+=2;continue;}if(kana[i]==="ッ"&&i+1<kana.length){const n=KANA_MAP[kana[i+1]];if(n)r+=n[0];i++;continue;}if(KANA_MAP[kana[i]]!==undefined)r+=KANA_MAP[kana[i]];i++;}return r;}
async function generateUniqueLoginId(nameKana: string) { const base=kataToRomaji(nameKana.trim().split(/[\s　]+/)[0]).toLowerCase()||"agent"; for(let a=0;a<100;a++){const num=String(Math.floor(Math.random()*10000)).padStart(4,"0");const id=`${base}${num}`;const exists=await prisma.user.findUnique({where:{loginId:id}});if(!exists)return id;}throw new Error("ID生成失敗");}
function generatePassword() { const c="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";let p="";for(let i=0;i<8;i++)p+=c[Math.floor(Math.random()*c.length)];return p;}
