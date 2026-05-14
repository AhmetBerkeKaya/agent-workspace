import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  // Adaptörü ekleyerek NextAuth'un Prisma üzerinden DB ile konuşmasını sağlıyoruz
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly",
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  // Adaptör kullanıldığında session stratejisini "jwt" olarak belirtmek önemlidir
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // İlk girişte account ve user nesneleri dolu gelir
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Session nesnesine hem accessToken'ı hem de kullanıcı ID'sini ekliyoruz
      if (session.user) {
        session.user.id = token.id;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Debug modunu aktif ederek olası veritabanı hatalarını terminalde görebiliriz
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };