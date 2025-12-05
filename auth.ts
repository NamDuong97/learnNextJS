import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 1. Helper function to get user from database
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

// 2. NextAuth configuration
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // Step 1: Validate credentials format với Zod
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6)
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          // Step 2: Fetch user from database
          const user = await getUser(email);
          if (!user) return null;  // User không tồn tại

          // Step 3: Compare password với hash
          const passwordsMatch = await bcrypt.compare(password, user.password);

          // Step 4: Return user nếu match
          if (passwordsMatch) return user;
        }

        console.log('Invalid credentials');
        return null;  // Credentials invalid
      },
    }),
  ],
});