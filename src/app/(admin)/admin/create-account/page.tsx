"use client";

import { useState, useEffect, useCallback } from "react";

// カタカナ→ローマ字変換（クライアント側）
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
  "ッ":"tt","ー":"",
};

function kataToRomaji(kana: string): string {
  let result = "";
  let i = 0;
  while (i < kana.length) {
    if (i + 1 < kana.length) {
      const two = kana.substring(i, i + 2);
      if (KANA_MAP[two]) { result += KANA_MAP[two]; i += 2; continue; }
    }
    if (kana[i] === "ッ" && i + 1 < kana.length) {
      const next = KANA_MAP[kana[i + 1]];
      if (next) result += next[0];
      i++; continue;
    }
    const one = kana[i];
    if (KANA_MAP[one] !== undefined) result += KANA_MAP[one];
    i++;
  }
  return result;
}

function generateRandomNum(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export default function CreateAccountPage() {
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    nameRomaji: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    referrerName: "",
  });
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [loginIdEdited, setLoginIdEdited] = useState(false);

  const [result, setResult] = useState<{
    loginId: string;
    memberNumber: string;
    password: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // フリガナからログインIDを自動生成（手動編集されていない場合のみ）
  const generateLoginId = useCallback((nameKana: string) => {
    const lastName = nameKana.trim().split(/[\s　]+/)[0];
    const romaji = kataToRomaji(lastName).toLowerCase();
    if (romaji) {
      return `${romaji}${generateRandomNum()}`;
    }
    return "";
  }, []);

  // フリガナからローマ字氏名を自動生成
  const generateRomajiName = useCallback((nameKana: string) => {
    const parts = nameKana.trim().split(/[\s　]+/);
    if (parts.length >= 2) {
      const last = kataToRomaji(parts[0]).toUpperCase();
      const first = kataToRomaji(parts[1]);
      if (last && first) {
        return `${first.charAt(0).toUpperCase()}${first.slice(1)} ${last}`;
      }
    }
    const single = kataToRomaji(parts[0]);
    return single ? single.charAt(0).toUpperCase() + single.slice(1) : "";
  }, []);

  useEffect(() => {
    if (!loginIdEdited && form.nameKana) {
      setLoginId(generateLoginId(form.nameKana));
    }
    // ローマ字氏名も自動生成（手動入力がなければ）
    if (form.nameKana && !form.nameRomaji) {
      const romaji = generateRomajiName(form.nameKana);
      if (romaji) {
        setForm((prev) => ({ ...prev, nameRomaji: romaji }));
      }
    }
  }, [form.nameKana, loginIdEdited, generateLoginId, generateRomajiName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoginIdChange = (value: string) => {
    setLoginId(value.toLowerCase());
    setLoginIdEdited(true);
  };

  const regenerateLoginId = () => {
    if (form.nameKana) {
      setLoginId(generateLoginId(form.nameKana));
      setLoginIdEdited(false);
    }
  };

  const regeneratePassword = () => {
    setPassword(generatePassword());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          loginId,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "アカウント発行に失敗しました");
      } else {
        setResult({
          loginId: data.loginId,
          memberNumber: data.memberNumber,
          password: data.tempPassword,
        });
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", nameKana: "", nameRomaji: "", email: "", phone: "", dateOfBirth: "", address: "", referrerName: "" });
    setLoginId("");
    setPassword(generatePassword());
    setLoginIdEdited(false);
    setResult(null);
    setError("");
  };

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        アカウント発行
      </h2>

      {result ? (
        <div className="bg-bg-secondary border border-border-gold rounded-md p-6 sm:p-10 text-center max-w-[560px]">
          <div className="text-[40px] mb-4">✓</div>
          <h3 className="font-serif-jp text-xl text-gold mb-2">
            アカウントを発行しました
          </h3>
          <p className="text-[13px] text-text-secondary mb-6">
            会員番号{" "}
            <span className="font-mono text-gold">{result.memberNumber}</span>{" "}
            で登録しました
          </p>

          <div className="bg-bg-elevated border border-border rounded-md p-4 mb-4 text-left">
            <div className="text-[11px] text-text-muted mb-2">ログインID</div>
            <div className="font-mono text-lg text-gold tracking-wider">
              {result.loginId}
            </div>
          </div>

          <div className="bg-bg-elevated border border-border rounded-md p-4 mb-6 text-left">
            <div className="text-[11px] text-text-muted mb-2">パスワード</div>
            <div className="font-mono text-sm text-gold tracking-wider">
              {result.password}
            </div>
          </div>

          <p className="text-[11px] text-text-muted mb-6 leading-relaxed">
            上記のログインIDとパスワードを会員様へお伝えください
          </p>

          <button
            onClick={resetForm}
            className="px-7 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90"
          >
            続けて発行
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border rounded-md p-5 sm:p-8 max-w-[560px]"
        >
          {error && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs">
              {error}
            </div>
          )}

          {/* 氏名 */}
          <FormField label="氏名" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="田中 太郎"
              required
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          {/* フリガナ */}
          <FormField label="フリガナ" required>
            <input
              value={form.nameKana}
              onChange={(e) => setForm({ ...form, nameKana: e.target.value })}
              placeholder="タナカ タロウ"
              required
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          {/* ローマ字氏名（カード表示用） */}
          <FormField label="ローマ字氏名（カード表示用）">
            <input
              value={form.nameRomaji}
              onChange={(e) => setForm({ ...form, nameRomaji: e.target.value })}
              placeholder="Taro TANAKA"
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold tracking-wider"
            />
            <div className="text-[10px] text-text-muted mt-1">フリガナから自動生成されます。手動で変更も可能です</div>
          </FormField>

          {/* ログインID（自動生成 / 編集可能） */}
          <FormField label="ログインID（自動生成）">
            <div className="flex gap-2">
              <input
                value={loginId}
                onChange={(e) => handleLoginIdChange(e.target.value)}
                placeholder="フリガナ入力で自動生成"
                className="flex-1 px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={regenerateLoginId}
                className="px-3 py-3 bg-transparent border border-border text-text-muted rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all shrink-0"
                title="再生成"
              >
                ↻
              </button>
            </div>
            {loginIdEdited && (
              <div className="text-[10px] text-status-warning mt-1">手動で編集されています</div>
            )}
          </FormField>

          {/* パスワード（自動生成 / 表示・非表示） */}
          <FormField label="パスワード（自動生成・8桁）">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? "隠す" : "表示"}
                </button>
              </div>
              <button
                type="button"
                onClick={regeneratePassword}
                className="px-3 py-3 bg-transparent border border-border text-text-muted rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all shrink-0"
                title="再生成"
              >
                ↻
              </button>
            </div>
          </FormField>

          {/* メールアドレス */}
          <FormField label="メールアドレス" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tanaka@example.com"
              required
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          {/* 電話番号 */}
          <FormField label="電話番号">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="090-0000-0000"
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          {/* 生年月日 */}
          <FormField label="生年月日">
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          {/* 住所 */}
          <FormField label="住所">
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="東京都港区..."
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          {/* 契約プラン */}
          <FormField label="契約プラン">
            <div className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm">
              基本パッケージ（880万円）
            </div>
          </FormField>

          {/* 紹介者名 */}
          <FormField label="紹介者名（任意）">
            <input
              value={form.referrerName}
              onChange={(e) => setForm({ ...form, referrerName: e.target.value })}
              placeholder=""
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          <button
            type="submit"
            disabled={loading || !loginId || !password}
            className="w-full mt-2 py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "発行中..." : "アカウントを発行"}
          </button>
        </form>
      )}
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
        {label}
        {required && <span className="text-status-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
