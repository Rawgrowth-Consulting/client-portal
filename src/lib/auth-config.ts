import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "./supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        email: { type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        const { data: client } = await supabase
          .from("clients")
          .select("id, email, name, role, company")
          .eq("email", email)
          .single();

        if (!client) return null;

        return {
          id: client.id,
          email: client.email,
          name: client.name,
          role: client.role,
          company: client.company,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.company = (user as any).company;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role;
      (session.user as any).company = token.company;
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname, origin } = request.nextUrl;
      const publicRoutes = ["/login", "/api/auth/", "/api/webhooks/", "/api/rawclaw/"];
      const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
      if (isPublic) return true;

      const isAdminArea = pathname.startsWith("/admin");
      const isClientArea =
        pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
      const isProtected = isAdminArea || isClientArea;
      if (!isProtected) return true;

      if (!auth) {
        return Response.redirect(new URL("/login", origin));
      }

      const role = auth.user?.role;

      if (isAdminArea && role !== "admin") {
        return Response.redirect(new URL("/dashboard", origin));
      }

      if (isClientArea && role === "admin") {
        return Response.redirect(new URL("/admin", origin));
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
