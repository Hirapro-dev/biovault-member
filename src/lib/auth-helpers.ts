import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types";

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAgency(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "AGENCY") {
    redirect("/login");
  }
  return user;
}

export async function requireStaff(): Promise<SessionUser & { staffCode: string }> {
  const user = await requireAuth();
  if (user.role !== "STAFF") {
    redirect("/login");
  }
  const session = await getSession();
  const staffCode = (session?.user as any)?.staffCode;
  if (!staffCode) {
    redirect("/login");
  }
  return { ...user, staffCode };
}
