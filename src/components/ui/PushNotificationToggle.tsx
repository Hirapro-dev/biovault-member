"use client";

import { useState, useEffect } from "react";

/**
 * プッシュ通知のON/OFF切替コンポーネント
 * - ブラウザの通知許可状態を検知
 * - ON: Service Workerを登録してPush Subscriptionをサーバーに保存
 * - OFF: サーバーからサブスクリプションを削除
 */
export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ブラウザ対応チェック
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);

    // 既存のサブスクリプションを確認
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      }
    } catch {
      // 無視
    }
  };

  // 通知をONにする
  const handleEnable = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setLoading(false);
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      await fetch("/api/member/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setSubscribed(true);
    } catch {
      // 登録失敗
    }
    setLoading(false);
  };

  // 通知をOFFにする
  const handleDisable = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // サーバーから削除
          await fetch("/api/member/push-subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          // ブラウザ側も解除
          await sub.unsubscribe();
        }
      }
      setSubscribed(false);
    } catch {
      // 解除失敗
    }
    setLoading(false);
  };

  // 非対応ブラウザ
  if (!supported) {
    return (
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-sm text-text-primary">プッシュ通知</div>
          <div className="text-[11px] text-text-muted mt-0.5">お使いのブラウザでは利用できません</div>
        </div>
        <div className="text-[11px] text-text-muted">非対応</div>
      </div>
    );
  }

  // ブラウザ設定でブロックされている場合
  if (permission === "denied") {
    return (
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-sm text-text-primary">プッシュ通知</div>
          <div className="text-[11px] text-text-muted mt-0.5">ブラウザの設定で通知がブロックされています</div>
        </div>
        <div className="text-[11px] text-status-danger">ブロック中</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <div className="text-sm text-text-primary">プッシュ通知</div>
        <div className="text-[11px] text-text-muted mt-0.5">
          {subscribed ? "コンテンツ更新時に通知を受け取ります" : "通知をONにすると更新情報が届きます"}
        </div>
      </div>
      <button
        onClick={subscribed ? handleDisable : handleEnable}
        disabled={loading}
        className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer disabled:opacity-50 ${
          subscribed ? "bg-gold" : "bg-bg-elevated border border-border"
        }`}
      >
        <div
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
            subscribed ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
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
