"use client";

import { useEffect } from "react";

/**
 * プッシュ通知の自動登録コンポーネント
 * ページ読み込み時にService Workerを登録し、通知許可を求める
 */
export default function PushRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}

async function registerServiceWorker() {
  // Service Worker非対応ブラウザはスキップ
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    // Service Worker登録
    const registration = await navigator.serviceWorker.register("/sw.js");

    // 通知許可の確認
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // VAPID公開鍵の取得
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    // Push Subscription取得（既存がなければ新規作成）
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    // サーバーに登録
    await fetch("/api/member/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
  } catch {
    // プッシュ通知の登録失敗は無視（オプション機能のため）
  }
}

// VAPID鍵をUint8Arrayに変換
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
