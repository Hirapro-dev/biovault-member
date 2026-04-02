"use client";

import { useEffect } from "react";

/**
 * プッシュ通知の自動登録コンポーネント
 * - 初回のみ実行（sessionStorageでフラグ管理）
 * - 5秒遅延してから実行（ページ表示を阻害しない）
 */
export default function PushRegistrar() {
  useEffect(() => {
    // セッション中に既に実行済みならスキップ
    if (sessionStorage.getItem("push-registered")) return;

    // 5秒後に遅延実行（ページ表示を優先）
    const timer = setTimeout(() => {
      registerServiceWorker();
      sessionStorage.setItem("push-registered", "1");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");

    // 既に許可済みの場合のみサブスクリプション登録（初回はダイアログを出さない）
    if (Notification.permission === "granted") {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      await fetch("/api/member/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
    }
  } catch {
    // 登録失敗は無視
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
