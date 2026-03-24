import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 管理者アカウント
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@biovault.jp" },
    update: {},
    create: {
      loginId: "admin0001",
      email: "admin@biovault.jp",
      passwordHash: adminHash,
      name: "管理者",
      role: "SUPER_ADMIN",
      mustChangePassword: false,
    },
  });
  console.log("✅ Admin created:", admin.email, "/ Login ID: admin0001");

  // テスト会員データ
  const memberPassword = await bcrypt.hash("member123", 12);

  const membersData = [
    {
      loginId: "tanaka0001",
      email: "tanaka@example.com",
      name: "田中 太郎",
      nameKana: "タナカ タロウ",
      nameRomaji: "Taro TANAKA",
      phone: "090-1234-5678",
      memberNumber: "BV-0001",
      ipsStatus: "IPS_CREATING" as const,
      paymentStatus: "COMPLETED" as const,
      paidAmount: 8800000,
    },
    {
      loginId: "sato0001",
      email: "sato@example.com",
      name: "佐藤 花子",
      nameKana: "サトウ ハナコ",
      nameRomaji: "Hanako SATO",
      phone: "090-2345-6789",
      memberNumber: "BV-0002",
      ipsStatus: "BLOOD_COLLECTED" as const,
      paymentStatus: "COMPLETED" as const,
      paidAmount: 8800000,
    },
    {
      loginId: "suzuki0001",
      email: "suzuki@example.com",
      name: "鈴木 一郎",
      nameKana: "スズキ イチロウ",
      nameRomaji: "Ichiro SUZUKI",
      phone: "090-3456-7890",
      memberNumber: "BV-0003",
      ipsStatus: "CONTRACT_SIGNED" as const,
      paymentStatus: "PARTIAL" as const,
      paidAmount: 4400000,
    },
    {
      loginId: "yamada0001",
      email: "yamada@example.com",
      name: "山田 美咲",
      nameKana: "ヤマダ ミサキ",
      nameRomaji: "Misaki YAMADA",
      phone: "090-4567-8901",
      memberNumber: "BV-0004",
      ipsStatus: "CLINIC_RESERVED" as const,
      paymentStatus: "COMPLETED" as const,
      paidAmount: 8800000,
      clinicDate: new Date("2025-06-02"),
    },
    {
      loginId: "takahashi0001",
      email: "takahashi@example.com",
      name: "高橋 健太",
      nameKana: "タカハシ ケンタ",
      nameRomaji: "Kenta TAKAHASHI",
      phone: "090-5678-9012",
      memberNumber: "BV-0005",
      ipsStatus: "APPLICATION" as const,
      paymentStatus: "PENDING" as const,
      paidAmount: 0,
    },
  ];

  // 書類テンプレート
  const documentTypes = [
    { type: "CONTRACT" as const, title: "会員契約書（細胞保管委託契約書）" },
    { type: "CONSENT_CELL_STORAGE" as const, title: "細胞保管同意書" },
    { type: "INFORMED_CONSENT" as const, title: "インフォームドコンセント" },
    { type: "PRIVACY_POLICY" as const, title: "個人情報取扱同意書" },
    { type: "SIMPLE_AGREEMENT" as const, title: "簡易規約" },
  ];

  for (const data of membersData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        loginId: data.loginId,
        email: data.email,
        passwordHash: memberPassword,
        name: data.name,
        nameKana: data.nameKana,
        nameRomaji: data.nameRomaji,
        phone: data.phone,
        role: "MEMBER",
        mustChangePassword: false, // デモ用
        membership: {
          create: {
            memberNumber: data.memberNumber,
            plan: "STANDARD",
            contractDate: new Date("2025-04-15"),
            totalAmount: 8800000,
            paymentStatus: data.paymentStatus,
            paidAmount: data.paidAmount,
            ipsStatus: data.ipsStatus,
            clinicDate: data.clinicDate || null,
            storageYears: 10,
          },
        },
      },
    });

    // 書類作成（各会員ごと）
    const existingDocs = await prisma.document.count({ where: { userId: user.id } });
    if (existingDocs === 0) {
      // ステータスに応じて書類のステータスを設定
      const ipsIndex = [
        "APPLICATION",
        "CONTRACT_SIGNED",
        "CLINIC_RESERVED",
        "BLOOD_COLLECTED",
        "IPS_CREATING",
        "IPS_COMPLETED",
        "STORAGE_ACTIVE",
      ].indexOf(data.ipsStatus);

      await prisma.document.createMany({
        data: documentTypes.map((d, i) => ({
          userId: user.id,
          type: d.type,
          title: d.title,
          status: ipsIndex >= 1 && i < 4 ? ("SIGNED" as const) : ipsIndex >= 1 && i === 4 ? ("SENT" as const) : ("PENDING" as const),
          signedAt: ipsIndex >= 1 && i < 4 ? new Date("2025-04-15") : null,
        })),
      });
    }

    console.log(`✅ Member created: ${data.name} (${data.memberNumber})`);
  }

  // 田中太郎に醸成器投与記録を追加
  const tanaka = await prisma.user.findUnique({
    where: { email: "tanaka@example.com" },
    include: { membership: true },
  });
  if (tanaka?.membership) {
    const existingTreatments = await prisma.treatment.count({
      where: { membershipId: tanaka.membership.id },
    });
    if (existingTreatments === 0) {
      await prisma.treatment.create({
        data: {
          membershipId: tanaka.membership.id,
          type: "IV_DRIP",
          volume: 10,
          amount: 800000,
          completedAt: new Date("2025-09-20"),
          clinicName: "ビオリスクリニック",
          note: "初回投与（基本パッケージ含む）",
        },
      });
      console.log("✅ Treatment record added for 田中 太郎");
    }
  }

  // ステータス変更履歴サンプル
  const statusHistoryCount = await prisma.statusHistory.count();
  if (statusHistoryCount === 0) {
    const tanakaUser = await prisma.user.findUnique({ where: { email: "tanaka@example.com" } });
    const satoUser = await prisma.user.findUnique({ where: { email: "sato@example.com" } });
    const yamadaUser = await prisma.user.findUnique({ where: { email: "yamada@example.com" } });

    if (tanakaUser) {
      await prisma.statusHistory.create({
        data: {
          userId: tanakaUser.id,
          fromStatus: "BLOOD_COLLECTED",
          toStatus: "IPS_CREATING",
          note: "採血サンプル確認完了、iPS作製を開始",
          changedBy: "管理者",
          changedAt: new Date("2025-05-20"),
        },
      });
    }

    if (satoUser) {
      await prisma.statusHistory.create({
        data: {
          userId: satoUser.id,
          fromStatus: "CLINIC_RESERVED",
          toStatus: "BLOOD_COLLECTED",
          note: "採血完了",
          changedBy: "管理者",
          changedAt: new Date("2025-05-18"),
        },
      });
    }

    if (yamadaUser) {
      await prisma.statusHistory.create({
        data: {
          userId: yamadaUser.id,
          fromStatus: "CONTRACT_SIGNED",
          toStatus: "CLINIC_RESERVED",
          note: "6月2日（月）に予約確定",
          changedBy: "管理者",
          changedAt: new Date("2025-05-15"),
        },
      });
    }

    console.log("✅ Status history records created");
  }

  // 管理者メモサンプル
  if (tanaka) {
    const noteCount = await prisma.adminNote.count({ where: { userId: tanaka.id } });
    if (noteCount === 0) {
      await prisma.adminNote.create({
        data: {
          userId: tanaka.id,
          content: "初回面談完了。iPS細胞に対する理解が高く、保管期間延長の可能性あり。",
          author: "管理者",
        },
      });
      console.log("✅ Admin note added for 田中 太郎");
    }
  }

  // iPS ニュース記事サンプル
  const articleCount = await prisma.ipsArticle.count();
  if (articleCount === 0) {
    await prisma.ipsArticle.createMany({
      data: [
        {
          slug: "2026-03-ips-first-approval",
          title: "世界初のiPS細胞由来再生医療製品が承認 — 研究から社会実装への歴史的転換点",
          summary: "住友ファーマのパーキンソン病治療製品とクオリプスの重症心不全治療用心筋シートが、iPS細胞を用いた再生医療等製品として世界で初めて承認されました。",
          content: "2026年、iPS細胞研究は歴史的なマイルストーンを迎えました。住友ファーマが開発したパーキンソン病治療製品「アムシェプリ」と、クオリプスが開発した重症心不全治療用心筋シート「リハート」が、iPS細胞を用いた再生医療等製品として世界で初めて承認されたのです。\n\n2006年の山中伸弥教授によるiPS細胞の発見から20年。基礎研究から臨床応用、そして製品承認へと至るこの道のりは、まさに「研究を希望に変える」プロセスそのものでした。\n\nこの承認は、iPS細胞技術が研究室の成果から実際の医療現場で使われる治療法へと進化したことを意味します。今後、より多くの疾患に対するiPS細胞由来治療法の開発が加速することが期待されます。",
          category: "NEWS",
          sourceName: "厚生労働省",
          isPublished: true,
          publishedAt: new Date("2026-03-01"),
          author: "管理者",
        },
        {
          slug: "2025-12-ips-stock-expansion",
          title: "CiRA Foundation、再生医療用iPS細胞ストックの対象HLA型を拡充",
          summary: "京都大学iPS細胞研究財団が、日本人の約80%をカバーするHLA型のiPS細胞ストックの整備完了を発表しました。",
          content: "CiRA Foundation（京都大学iPS細胞研究財団）は、再生医療用iPS細胞ストックの対象HLA型を大幅に拡充し、日本人の約80%をカバーできる体制が整ったことを発表しました。\n\nこのiPS細胞ストックは、免疫拒絶反応が起こりにくい特殊なHLA型を持つドナーから作製されており、多くの患者さんに適合する「既製品」のiPS細胞として利用できます。\n\n他家移植（自分以外の人の細胞を移植すること）が可能になることで、治療のコスト削減と迅速な提供が実現します。従来、患者自身の細胞からiPS細胞を作製するには数ヶ月の時間と高額な費用が必要でしたが、ストックの活用により、この課題が大幅に改善されます。",
          category: "RESEARCH",
          sourceName: "CiRA Foundation",
          isPublished: true,
          publishedAt: new Date("2025-12-15"),
          author: "管理者",
        },
        {
          slug: "2025-10-ips-aging-research",
          title: "iPS細胞を用いた老化メカニズム研究に新たな進展",
          summary: "東京大学の研究チームが、iPS細胞技術を活用して老化の分子メカニズムの一端を解明する研究成果を発表しました。",
          content: "東京大学の研究チームは、高齢者の体細胞から作製したiPS細胞と若年者の体細胞から作製したiPS細胞を比較分析することで、老化に伴う遺伝子発現の変化パターンを新たに特定しました。\n\nこの研究により、特定の遺伝子群の発現変化が細胞老化の進行に深く関わっていることが明らかになりました。研究チームは、この知見がアンチエイジング医療の開発や、加齢関連疾患の予防法の確立に貢献する可能性があるとしています。\n\nBioVaultが提供する「今の健康な状態での細胞保管」の意義が、こうした研究成果によってさらに裏付けられています。",
          category: "RESEARCH",
          sourceName: "東京大学",
          isPublished: true,
          publishedAt: new Date("2025-10-20"),
          author: "管理者",
        },
      ],
    });
    console.log("✅ iPS articles created");
  }

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
