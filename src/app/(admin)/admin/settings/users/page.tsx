import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import UserManagement from "./UserManagement";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATOR", "VIEWER"] as const;

export default async function UsersSettingsPage() {
  const currentUser = await requireAdmin();
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const users = await prisma.user.findMany({
    where: { role: { in: [...ADMIN_ROLES] } },
    select: {
      id: true,
      name: true,
      email: true,
      loginId: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/admin/settings" className="hover:text-gold transition-colors">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">ユーザー管理</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        ユーザー管理
      </h2>

      <UserManagement
        users={users.map(u => ({
          ...u,
          lastLoginAt: u.lastLoginAt?.toISOString() || null,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={currentUser.id}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
