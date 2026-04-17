import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    company?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      company: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    company: string;
  }
}
