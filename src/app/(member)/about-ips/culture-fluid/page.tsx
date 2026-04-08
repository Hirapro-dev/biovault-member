import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function CultureFluidKnowledgePage() {
  await requireAuth();

  return (
    <div className="max-w-[700px]">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/dashboard" className="hover:text-gold transition-colors">コンテンツ</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">iPS培養上清液に関する基礎知識</span>
      </div>

      <h1 className="font-serif-jp text-lg sm:text-xl font-normal text-text-primary tracking-[2px] mb-6">
        iPS培養上清液に関する基礎知識
      </h1>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-8">
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-8">

          <S t="1. iPS培養上清液とは何か">
            <p>iPS培養上清液とは、iPS細胞を培養した際に、その培養液中に分泌・放出される成分群を含む上澄み液のことです。</p>
            <p>中身は単一成分ではなく、成長因子、サイトカイン、ケモカイン、細胞外小胞（EVs、いわゆるエクソソームを含む）、miRNA、その他の分泌タンパク質が重なった「複合体」と捉えるのが正確です。研究の世界では、こうした総体をsecretome（セクレトーム）と呼びます。</p>
            <p>培養上清液は"1種類の完成品"ではなく、どのiPS細胞を使ったか、どの培地で、どれくらい培養し、どのように精製し、EVや可溶性因子をどこまで残したかで大きく変わります。実際には中身の設計と品質管理がかなり重要です。</p>
          </S>

          <S t="2. なぜ注目されるのか">
            <p>再生医療でiPS細胞そのものが注目される理由は、「さまざまな細胞に分化できる」ことですが、近年はそれに加えて、細胞が外へ出すシグナルそのものにも注目が集まっています。</p>
            <p>つまり、「細胞を入れる」だけでなく、「細胞が出す情報を使う」という発想です。これは、細胞移植と比べて、製造・保管・取り扱いの面で整理しやすい可能性があるため、研究開発上の魅力があります。</p>
            <p>現時点の研究では、iPSC由来の培養上清液やEVは、主に炎症の調整、細胞保護、血管新生の支援、創傷治癒の支援、線維化の抑制方向への作用といったテーマで検討されています。</p>
          </S>

          <S t="3. iPS培養上清液には何が入っているのか">
            <p className="font-medium text-text-primary mb-2">基本となる代表的な成長因子群</p>
            <p>iPS培養上清液の説明でよく挙がる代表因子としては、HGF、FGF、VEGF、IGF-1、TGF-β、PDGF、EGFなどがあります。</p>

            <div className="space-y-2 mt-3">
              <p>HGFは、細胞保護、組織修復、血管新生支援の文脈でよく語られる因子です。</p>
              <p>FGF群、特にFGF2は、線維芽細胞系や血管新生、修復環境の形成に関わる代表格です。</p>
              <p>VEGF群は、血管新生や微小循環支援の中核因子です。</p>
              <p>IGF-1は、細胞生存や代謝、組織修復の文脈で重要視されます。</p>
              <p>TGF-βは、創傷治癒や組織再構築に深く関わる一方、文脈によっては線維化にも関与するため、多くの文献等で説明されています。</p>
              <p>PDGFは、細胞増殖や修復初期のシグナルとして有名です。</p>
              <p>EGFは、上皮系の再生やターンオーバー支援の文脈で頻出します。</p>
            </div>

            <p className="font-medium text-text-primary mt-4 mb-2">iPS由来だからこそ注目される特殊な因子</p>
            <p>iPS系のsecretomeは、単に「よくある成長因子の寄せ集め」ではなく、由来細胞や分化段階によって、神経保護・免疫調整・修復誘導に関わる少し独特な分子が目立つことがあります。</p>
            <p>たとえば、ヒト多能性幹細胞由来の神経前駆細胞の培養上清では、Galectin-1、Midkine、SLIT2、Agrin、Pleiotrophin、MFGE8、VEGFBといった分子が鍵シグナルとして挙げられています。</p>
          </S>

          <S t="4. どのような働きが期待されているのか">
            <p>現時点の研究を、誇張せずに整理すると、期待されている働きは大きく5つです。</p>

            <div className="space-y-4 mt-3">
              <div>
                <p className="font-medium text-text-primary">① 炎症環境の調整</p>
                <p>修復を邪魔する過剰炎症を少し落ち着かせ、組織が回復しやすい環境をつくる方向です。</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">② 細胞保護</p>
                <p>傷ついた細胞がすぐに壊れないよう支える、いわば"保護膜"的な働きです。</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">③ 血管新生・微小循環支援</p>
                <p>修復には血流が必要なので、VEGF系などを中心に、微小血管環境を整える方向の期待があります。</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">④ 創傷治癒・再上皮化支援</p>
                <p>傷が閉じる、表皮が再形成される、瘢痕が過度にならないようにする、といった方向です。</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">⑤ 線維化の抑制</p>
                <p>組織が硬く瘢痕化して機能を落とす方向を抑える、という発想です。肺や腎などの前臨床モデルで検討されています。</p>
              </div>
            </div>
          </S>

          <S t="5. どのような研究結果があるのか">
            <p>人で確立した治療結果と、動物や細胞での研究結果は分けて見る必要があります。</p>
            <p>現時点で、iPS培養上清液そのものについて、適応や製法が標準化された大規模ヒト臨床データが十分に揃っているとは言えません。この領域は、研究・開発としては非常に面白い一方、公開されているエビデンスの多くは前臨床段階です。</p>

            <div className="space-y-3 mt-3">
              <p className="font-medium text-text-primary text-xs">前臨床で比較的一貫している領域：</p>
              <div className="space-y-2">
                <p><span className="text-gold">肺障害</span> — iPSC-CMが急性肺障害や肺線維化モデルで炎症や組織傷害を軽減したという報告があります。</p>
                <p><span className="text-gold">腎障害</span> — 虚血性急性腎障害モデルで、iPSC-CMが腎障害を軽減した報告があります。</p>
                <p><span className="text-gold">肺高血圧</span> — ラット肺高血圧モデルで、iPSCやiPSC-CMが炎症・血管リモデリングを抑える方向に働いた報告があります。</p>
                <p><span className="text-gold">創傷治癒・熱傷</span> — iPSC由来EVやiPSC由来角化細胞EVでは、熱傷創の閉鎖促進や修復支援が報告されています。</p>
                <p><span className="text-gold">脳梗塞後回復</span> — ヒト多能性幹細胞由来神経前駆細胞の培養上清で、梗塞体積や炎症の低減、機能回復支援が報告されています。</p>
              </div>
            </div>
          </S>

          <S t="6. 他の培養上清液と何が違うのか">
            <p>一般に「培養上清液」といっても、由来細胞が違えば中身は大きく変わります。脂肪由来MSC、臍帯由来MSC、真皮線維芽細胞、iPSC由来分化細胞などは、それぞれsecretomeの性格が違います。</p>
            <p>iPS由来の特徴としては、少なくとも理論上、由来細胞設計の自由度が高い（血液から作製可能）こと、神経系、血管系、角化細胞系、前駆細胞系などに機能する成長因子や有効可能性タンパク質において、その他の培養上清液よりも圧倒的な含有量が確認されていること、成長因子の豊富さ、含有量の高さから今後はその他の培養上清液の上位互換として認知、利用されていく可能性が高いことが挙げられます。</p>
          </S>

          <S t="7. プロの視点で見ると、何を重視すべきか">
            <p>本当に見るべきポイントは、「すごい成長因子が入っているか」だけではありません。むしろ以下の4点です。</p>
            <div className="space-y-2 mt-2">
              <p><span className="text-gold">① 由来の明確性</span> — どの細胞から、どの工程で作られたか。</p>
              <p><span className="text-gold">② 製造・品質管理</span> — 無菌性、エンドトキシン、マイコプラズマ、残留不純物、ロット差管理。</p>
              <p><span className="text-gold">③ 中身の再現性</span> — 毎回ほぼ同じsecretomeプロファイルが出せるか。</p>
              <p><span className="text-gold">④ 提供体制</span> — 適切に輸送・保管でき、品質が保たれるか。</p>
            </div>
          </S>

          <div className="text-[10px] text-text-muted pt-4 border-t border-border">
            <p>※ 本資料は一般的な情報提供を目的としたものであり、特定の治療効果、美容上の効果、医療上の効能を保証するものではありません。</p>
          </div>
        </article>
      </div>
    </div>
  );
}

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm text-text-primary font-medium mb-3 pb-2 border-b border-border">{t}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
