import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow your specific Gmail address
      const allowedEmail = process.env.ADMIN_EMAIL!;
      
      if (user.email === allowedEmail) {
        return true;
      }
      
      // Reject all other users
      return false;
    },
    
    async session({ session, token }) {
      // Add any additional session data if needed
      return session;
    },
    
    async jwt({ token, user }) {
      // Persist additional user data in the token
      if (user) {
        token.email = user.email;
      }
      return token;
    },
  },
  
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};