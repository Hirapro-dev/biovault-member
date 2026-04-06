import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

export default async function CellConsentViewPage() {
  const sessionUser = await requireAuth();

  const doc = await prisma.document.findFirst({
    where: { userId: sessionUser.id, type: "CELL_STORAGE_CONSENT" },
  });

  const isSigned = doc?.status === "SIGNED";

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/documents" className="hover:text-gold transition-colors">契約書類</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">細胞提供・保管同意書</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-serif-jp text-lg text-text-primary tracking-[2px]">BioVault 細胞提供・保管同意書</h2>
        {isSigned && <Badge variant="success">同意済</Badge>}
      </div>
      {doc?.signedAt && (
        <div className="text-xs text-text-muted mb-5">
          同意日: {new Date(doc.signedAt).toLocaleDateString("ja-JP")}
        </div>
      )}

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7">
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5">
          <p>株式会社SCPP（以下「甲」という。）は、BioVaultメンバーシップ制サービスに関連して、メンバーシップ登録者本人（以下「乙」という。）より提供された細胞の取扱いについて、以下のとおり説明します。</p>
          <p>乙は、本書の内容を確認し、理解したうえで、これに同意するものとします。</p>

          <S t="第1条（目的）">
            <p>本同意書は、乙から提供される血液その他の生体由来試料および当該試料から作製される細胞等の提供、保管、管理に関する条件を定めることを目的とします。</p>
          </S>
          <S t="第2条（提供する試料）">
            <p>乙は、iPS細胞作製のために必要な血液その他の生体由来試料（以下「本試料」という。）を、提携医療機関を通じて提供することに同意します。</p>
          </S>
          <S t="第3条（試料の利用目的）">
            <p>本試料は、乙本人のiPS細胞作製および保管の目的にのみ利用されます。その他の目的での利用は、別途乙の同意を得た場合を除き、行われません。</p>
          </S>
          <S t="第4条（保管条件）">
            <p>作製された細胞は、提携保管施設において、適切な温度管理および品質管理のもと保管されます。保管期間は、乙が加入するプランに定める期間とします。</p>
          </S>
          <S t="第5条（品質に関する説明）">
            <p>生体由来試料および細胞には個体差があり、採取条件、作製条件、保存環境その他の影響を受けるため、品質、増殖性、分化能その他の性状が常に一定であるとは限りません。</p>
          </S>
          <S t="第6条（保管終了時の取扱い）">
            <p>保管期間満了後、更新がなされない場合、または乙の退会等により保管契約が終了した場合、保管細胞は適切に廃棄されます。</p>
          </S>
          <S t="第7条（死亡時の取扱い）">
            <p>乙が死亡した場合における保管細胞の取扱いについては、メンバーシップ契約書第17条の定めに従うものとします。</p>
          </S>
          <S t="第8条（同意の撤回）">
            <p>乙は、既に不可逆的な処理が実施済みの部分を除き、将来に向かって本同意を撤回することができます。</p>
          </S>
          <S t="第9条（免責）">
            <p>甲は、天災地変、感染症、設備故障その他甲の合理的支配を超える事由により生じた試料または細胞の損失について責任を負いません。</p>
          </S>
        </article>
      </div>
    </div>
  );
}

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm text-text-primary font-medium mb-2">{t}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
