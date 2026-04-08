import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        loginId: { label: "Login ID", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) return null;

        // loginId でユーザー検索
        const user = await prisma.user.findUnique({
          where: { loginId: credentials.loginId },
        });

        if (!user || !user.isActive || !user.isIdIssued) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        // 最終ログイン日時を更新
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // 代理店の場合はプロフィールの同意状態を取得
        let agencyAgreed = false;
        if (user.role === "AGENCY") {
          const profile = await prisma.agencyProfile.findUnique({
            where: { userId: user.id },
            select: { hasAgreedContract: true, hasAgreedPledge: true, hasAgreedNda: true },
          });
          agencyAgreed = !!(profile?.hasAgreedContract && profile?.hasAgreedPledge && profile?.hasAgreedNda);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          hasAgreedTerms: user.hasAgreedTerms,
          agencyAgreed,
          rememberMe: credentials.rememberMe === "true",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.hasAgreedTerms = (user as any).hasAgreedTerms;
        token.agencyAgreed = (user as any).agencyAgreed;
      }
      // セッション更新時にDBから最新の同意状態を取得
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { hasAgreedTerms: true, mustChangePassword: true, role: true },
        });
        if (dbUser) {
          token.hasAgreedTerms = dbUser.hasAgreedTerms;
          token.mustChangePassword = dbUser.mustChangePassword;
          // 代理店の同意状態も更新
          if (dbUser.role === "AGENCY") {
            const profile = await prisma.agencyProfile.findUnique({
              where: { userId: token.id as string },
              select: { hasAgreedContract: true, hasAgreedPledge: true, hasAgreedNda: true },
            });
            token.agencyAgreed = !!(profile?.hasAgreedContract && profile?.hasAgreedPledge && profile?.hasAgreedNda);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).mustChangePassword = token.mustChangePassword;
        (session.user as any).hasAgreedTerms = token.hasAgreedTerms;
        (session.user as any).agencyAgreed = token.agencyAgreed;
      }
      return session;
    },
  },
};
