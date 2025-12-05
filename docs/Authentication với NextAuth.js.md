# Authentication với NextAuth.js

## 📌 Mục tiêu chương này
Học cách implement **authentication** vào Next.js app sử dụng **NextAuth.js**, protect routes, và manage user sessions.

---

## 🔐 1. Authentication vs Authorization

### Authentication (Xác thực)

**Định nghĩa:**
> Xác minh **WHO** you are - Bạn là ai?

**Ví dụ:**
- Username + Password
- Fingerprint scan
- Face ID
- 2FA (Two-Factor Authentication)

**Mục đích:**
- Chứng minh identity
- "Tôi là John Doe"

---

### Authorization (Phân quyền)

**Định nghĩa:**
> Xác định **WHAT** you can access - Bạn được làm gì?

**Ví dụ:**
- Admin có thể xóa users
- User thường chỉ đọc content
- Guest không thể edit

**Mục đích:**
- Quyết định permissions
- "John Doe có quyền edit posts"

---

### So sánh

| Aspect | Authentication | Authorization |
|--------|----------------|---------------|
| **Question** | Who are you? | What can you do? |
| **Process** | Verify identity | Check permissions |
| **Happens** | First | After authentication |
| **Example** | Login với password | Access admin panel |
| **Result** | User session created | Allow/Deny access |

---

### Flow hoàn chỉnh

```
┌─────────────────────────────────────────────────────────┐
│ 1. User enters username + password                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. AUTHENTICATION                                        │
│    - Verify credentials                                  │
│    - Check password hash                                 │
│    - Validate identity                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
                   Valid? ────No──→ [Access Denied]
                        ↓ Yes
┌─────────────────────────────────────────────────────────┐
│ 3. Session Created                                       │
│    - User is logged in                                   │
│    - Session cookie stored                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. User tries to access /admin                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. AUTHORIZATION                                         │
│    - Check user role                                     │
│    - Check permissions                                   │
│    - Is user allowed?                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
              Allowed? ────No──→ [403 Forbidden]
                        ↓ Yes
┌─────────────────────────────────────────────────────────┐
│ 6. Grant Access                                          │
│    - Render admin panel                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ 2. Two-Factor Authentication (2FA)

### Định nghĩa

**2FA** = 2 layers of verification

**Layer 1:** Something you **know**
- Password
- PIN code

**Layer 2:** Something you **have**
- Verification code trên điện thoại
- Google Authenticator
- SMS code
- Hardware token (YubiKey)

---

### Tại sao cần 2FA?

```
❌ Without 2FA:
Hacker có password → Truy cập tài khoản

✅ With 2FA:
Hacker có password → Cần thêm phone code → Không truy cập được!
```

**Benefits:**
- ✅ Tăng security dramatically
- ✅ Bảo vệ khi password bị leak
- ✅ Thêm layer of protection

---

## 📦 3. Setup NextAuth.js

### NextAuth.js là gì?

**Authentication library** cho Next.js:
- Abstracts complexity của session management
- Handles sign-in, sign-out
- Supports multiple providers (Google, GitHub, Credentials, etc.)
- Built-in security features

**Tại sao dùng NextAuth.js?**
- ✅ Tiết kiệm thời gian (không phải implement từ đầu)
- ✅ Battle-tested và secure
- ✅ Unified solution cho Next.js
- ✅ Tích hợp sẵn nhiều providers

---

### Installation

```bash
pnpm i next-auth@beta
```

**Lưu ý:** Dùng **beta version** cho Next.js 14+

---

### Generate Secret Key

#### macOS / Linux:
```bash
openssl rand -base64 32
```

#### Windows:
Visit: https://generate-secret.vercel.app/32

**Output example:**
```
xJ8K3mN9pQ2rS5tU7vW9yZ1aB3cD5eF7
```

---

### Add to .env file

```bash
# .env
AUTH_SECRET=xJ8K3mN9pQ2rS5tU7vW9yZ1aB3cD5eF7
```

**Quan trọng:**
- Secret key được dùng để **encrypt cookies**
- Đảm bảo **security** của user sessions
- **KHÔNG** commit vào Git!
- Update trên **Vercel** khi deploy production

---

## ⚙️ 4. NextAuth.js Configuration

### File structure

```
/
├── auth.config.ts       ← Config (pages, callbacks)
├── auth.ts              ← Main auth setup
├── proxy.ts             ← Middleware cho route protection
└── .env                 ← Environment variables
```

---

### Step 1: Create auth.config.ts

#### File: `/auth.config.ts`

```typescript
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',  // ← Custom login page
  },
} satisfies NextAuthConfig;
```

**Giải thích `pages` option:**
- Specify routes cho custom pages
- `signIn: '/login'` → Redirect to `/login` thay vì NextAuth default
- Optional: `signOut`, `error`, `verifyRequest`, `newUser`

---

### Step 2: Add Route Protection

#### File: `/auth.config.ts` (updated)

```typescript
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
```

---

### Giải thích `authorized` callback

**Mục đích:**
> Verify if request is **authorized** to access a page

**Khi nào chạy?**
- **Before** a request is completed
- Mỗi lần user navigate

**Parameters:**
```typescript
authorized({ auth, request: { nextUrl } })
```
- `auth` - User's session object
- `request.nextUrl` - URL đang cố truy cập

---

**Logic flow:**

```typescript
const isLoggedIn = !!auth?.user;
```
- `auth?.user` exists → logged in
- `!!` converts to boolean

```typescript
const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
```
- Check if accessing dashboard routes

```typescript
if (isOnDashboard) {
  if (isLoggedIn) return true;  // ✅ Allow access
  return false;                  // ❌ Redirect to login
}
```
- Dashboard requires authentication

```typescript
else if (isLoggedIn) {
  return Response.redirect(new URL('/dashboard', nextUrl));
}
```
- If logged in và accessing `/login` → redirect to dashboard

```typescript
return true;
```
- Public pages → allow access

---

### Decision Tree

```
User tries to access URL
        ↓
Is it /dashboard/* ?
    ↙         ↘
  YES          NO
    ↓            ↓
Is logged in?  Is logged in?
  ↙    ↘         ↙    ↘
YES    NO       YES    NO
 ↓      ↓        ↓      ↓
Allow  Deny    Redirect Allow
       ↓       to dash-
    To login   board
```

---

## 🚪 5. Middleware (Proxy) Setup

### Create proxy.ts file

#### File: `/proxy.ts` (root)

```typescript
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
```

---

### Giải thích code

#### 1. Initialize NextAuth
```typescript
NextAuth(authConfig).auth
```
- Import `authConfig` object
- Initialize NextAuth với config
- Export `.auth` property → Middleware function

---

#### 2. Matcher pattern
```typescript
matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
```

**Regex breakdown:**
- `/(` - Start pattern
- `(?!` - Negative lookahead
- `api|_next/static|_next/image|.*\\.png$` - Exclude these
- `)` - End lookahead
- `.*` - Match everything else
- `)` - End pattern

**Kết quả:**
- ✅ Run middleware trên `/dashboard`, `/profile`, etc.
- ❌ Skip middleware cho `/api/*`, `/_next/*`, `.png` files

**Tại sao skip?**
- API routes: Có auth riêng
- Static files: Không cần auth check
- Images: Public assets
- Next.js internals: Framework needs

---

### Advantages của Proxy approach

1. **Security:**
   - Protected routes **không render** nếu unauthenticated
   - No sensitive data exposure

2. **Performance:**
   - Auth check **before** page render
   - Không waste resources rendering unauthorized pages

3. **User Experience:**
   - Immediate redirect
   - No flash của protected content

---

## 🔒 6. Password Hashing với bcrypt

### Tại sao hash passwords?

#### ❌ NEVER store plain text:
```sql
-- BAD - Plain text password trong database
INSERT INTO users (email, password) 
VALUES ('user@example.com', 'mypassword123');
```

**Vấn đề:**
- Database leak → All passwords exposed
- Admins có thể xem passwords
- No security!

---

#### ✅ ALWAYS hash passwords:
```sql
-- GOOD - Hashed password
INSERT INTO users (email, password) 
VALUES ('user@example.com', '$2b$10$xJ8K3mN9pQ2rS5tU7vW9y...');
```

**Benefits:**
- ✅ Database leak → Passwords vẫn safe
- ✅ One-way encryption (cannot reverse)
- ✅ Industry standard

---

### bcrypt là gì?

**Password hashing library:**
- Slow by design (prevents brute force)
- Adds salt automatically (prevents rainbow tables)
- Industry-proven security

**How it works:**
```
Plain password → bcrypt.hash() → Hashed string
"mypass123"   →   processing   → "$2b$10$xJ8K3mN9..."
```

**Verify:**
```
User input + Stored hash → bcrypt.compare() → True/False
"mypass123" + "$2b$10..." →   processing   → true ✅
```

---

### Setup bcrypt

#### Install:
```bash
pnpm i bcrypt
pnpm i -D @types/bcrypt
```

#### Create auth.ts

**Tại sao file riêng?**
- bcrypt requires **Node.js APIs**
- Next.js Proxy **không có** Node.js APIs
- Phải tách ra file riêng

---

#### File: `/auth.ts`

```typescript
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
});
```

**Exports:**
- `auth` - Function to get session
- `signIn` - Function to sign in user
- `signOut` - Function to sign out user

---

## 👤 7. Credentials Provider

### Credentials Provider là gì?

**Authentication method** cho phép users login với:
- Username/Email
- Password

**Alternatives:**
- OAuth (Google, GitHub, Facebook)
- Email magic links
- SMS OTP
- Biometric

**Trong tutorial này:** Focus on **Credentials only**

---

### Add Credentials Provider

#### File: `/auth.ts` (updated)

```typescript
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      // authorize function here
    }),
  ],
});
```

---

## 🔑 8. Sign In Functionality

### Complete Implementation

#### File: `/auth.ts` (complete)

```typescript
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
```

---

### Breakdown từng bước

#### Step 1: Validate credentials

```typescript
const parsedCredentials = z
  .object({ 
    email: z.string().email(),      // Must be valid email
    password: z.string().min(6)      // Min 6 characters
  })
  .safeParse(credentials);
```

**Validates:**
- Email format: `user@example.com` ✅, `invalid` ❌
- Password length: `password123` ✅, `pass` ❌

---

#### Step 2: Fetch user

```typescript
const user = await getUser(email);
if (!user) return null;
```

**Query database:**
```sql
SELECT * FROM users WHERE email = 'user@example.com'
```

**Return:**
- User found → `{ id, email, password: "$2b$10..." }`
- Not found → `null`

---

#### Step 3: Compare passwords

```typescript
const passwordsMatch = await bcrypt.compare(password, user.password);
```

**How bcrypt.compare works:**

```
Input password: "mypass123"
Stored hash:    "$2b$10$xJ8K3mN9pQ2rS5tU7vW9y..."
                         ↓
            bcrypt.compare() hashes input
                         ↓
         Compares hashes (constant time)
                         ↓
              Returns: true/false
```

**Constant time comparison:**
- Prevents timing attacks
- Always takes same time, match or not

---

#### Step 4: Return result

```typescript
if (passwordsMatch) return user;
```

**Outcomes:**
- ✅ `return user` → Authentication successful → Session created
- ❌ `return null` → Authentication failed → Show error

---

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User submits login form                              │
│    Email: user@example.com                              │
│    Password: mypass123                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Zod validation                                        │
│    - Email format valid? ✅                              │
│    - Password min 6 chars? ✅                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Database query                                        │
│    SELECT * FROM users WHERE email = '...'              │
└─────────────────────────────────────────────────────────┘
                        ↓
                 User found?
                   ↙    ↘
                YES      NO
                 ↓        ↓
    ┌──────────────┐  [Return null]
    │ 4. bcrypt    │       ↓
    │  .compare()  │  [Login failed]
    └──────────────┘
          ↓
    Passwords match?
       ↙        ↘
     YES         NO
      ↓           ↓
[Return user] [Return null]
      ↓           ↓
[Session      [Login failed]
 created]
```

---

## 📝 9. Login Form Integration

### Create authenticate Server Action

#### File: `/app/lib/actions.ts`

```typescript
'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
```

---

### Giải thích Error Handling

#### AuthError types:

| Error Type | Meaning | User Message |
|------------|---------|--------------|
| `CredentialsSignin` | Wrong email/password | "Invalid credentials." |
| `CallbackRouteError` | Callback route failed | "Something went wrong." |
| `OAuthAccountNotLinked` | Account exists with different provider | "Email already in use." |
| Other | Unknown error | "Something went wrong." |

---

### Login Form Component

#### File: `/app/ui/login-form.tsx`

```tsx
'use client';

import { lusitana } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/app/ui/button';
import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className={`${lusitana.className} mb-3 text-2xl`}>
          Please log in to continue.
        </h1>
        
        <div className="w-full">
          {/* Email Field */}
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          
          {/* Password Field */}
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        
        {/* Hidden redirectTo field */}
        <input type="hidden" name="redirectTo" value={callbackUrl} />
        
        {/* Submit Button */}
        <Button className="mt-4 w-full" aria-disabled={isPending}>
          Log in <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
        
        {/* Error Message */}
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
```

---

### Giải thích useActionState

```typescript
const [errorMessage, formAction, isPending] = useActionState(
  authenticate,
  undefined,
);
```

**Returns 3 values:**
1. `errorMessage` - Error string từ Server Action
2. `formAction` - Wrapper function cho form action
3. `isPending` - Boolean indicating if action is running

**Usage:**
```tsx
<form action={formAction}>  {/* Not authenticate directly */}
  {/* fields */}
  <Button aria-disabled={isPending}>  {/* Disable when pending */}
    {isPending ? 'Logging in...' : 'Log in'}
  </Button>
  
  {errorMessage && (  {/* Show error if exists */}
    <p className="text-red-500">{errorMessage}</p>
  )}
</form>
```

---

### callbackUrl Pattern

```typescript
const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
```

**Scenario:**
1. User tries to access `/dashboard/settings`
2. Not logged in → Redirected to `/login?callbackUrl=/dashboard/settings`
3. After login → Redirect to `/dashboard/settings` (not just `/dashboard`)

**Implementation:**
```tsx
<input type="hidden" name="redirectTo" value={callbackUrl} />
```

**In authenticate action:**
```typescript
await signIn('credentials', formData);
// NextAuth automatically reads redirectTo
```

---

## 🚪 10. Logout Functionality

### Implement Sign Out

#### File: `/app/ui/dashboard/sidenav.tsx`

```tsx
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      {/* Logo */}
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-md bg-blue-600 p-4 md:h-40"
        href="/"
      >
        <div className="w-32 text-white md:w-40">
          <AcmeLogo />
        </div>
      </Link>
      
      {/* Nav Links */}
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        
        {/* Sign Out Form */}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden md:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### Giải thích Sign Out

#### 1. Inline Server Action
```tsx
<form
  action={async () => {
    'use server';  // ← Mark as Server Action
    await signOut({ redirectTo: '/' });
  }}
>
```

**Tại sao inline?**
- Simple action, không cần reuse
- Chỉ 1 line logic
- Cleaner code

**Alternative:** Create separate action trong `actions.ts`

---

#### 2. signOut() function
```typescript
await signOut({ redirectTo: '/' });
```

**Options:**
- `redirectTo` - URL to redirect after sign out
- Default: Same page (without redirect)

**What happens:**
1. Clear session cookie
2. Delete session from database (if stored)
3. Redirect to specified URL

---

## 🔐 11. Session Management

### Getting Current User

#### In Server Components:

```tsx
// /app/dashboard/page.tsx
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.email}!</h1>
    </div>
  );
}
```

---

#### In Server Actions:

```typescript
// /app/lib/actions.ts
'use server';

import { auth } from '@/auth';

export async function createPost(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }
  
  const userId = session.user.id;
  // Use userId in database operations
}
```

---

#### In Client Components:

```tsx
'use client';

import { useSession } from 'next-auth/react';

export default function ProfileButton() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return <a href="/login">Sign In</a>;
  }
  
  return (
    <div>
      <img src={session.user.image} alt="Profile" />
      <span>{session.user.name}</span>
    </div>
  );
}
```

**Note:** Cần wrap app với `SessionProvider` (explained in advanced patterns)

---

## 💡 12. Best Practices

### ✅ DO's (Nên làm)

#### 1. **Always hash passwords**

```typescript
// ✅ GOOD - Hash before storing
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);
await sql`INSERT INTO users (email, password) 
          VALUES (${email}, ${hashedPassword})`;
```

```typescript
// ❌ BAD - Plain text
await sql`INSERT INTO users (email, password) 
          VALUES (${email}, ${password})`;
```

---

#### 2. **Use environment variables for secrets**

```bash
# ✅ GOOD - .env file
AUTH_SECRET=xJ8K3mN9pQ2rS5tU7vW9y...
DATABASE_URL=postgresql://...
```

```typescript
// ❌ BAD - Hardcoded
const secret = "my-secret-key";  // Never do this!
```

---

#### 3. **Validate credentials before checking database**

```typescript
// ✅ GOOD - Validate first
const parsedCredentials = schema.safeParse(credentials);
if (!parsedCredentials.success) {
  return null;  // Don't hit database for invalid input
}

// Then check database
const user = await getUser(email);
```

---

#### 4. **Return generic error messages**

```typescript
// ✅ GOOD - Vague message
if (!user || !passwordsMatch) {
  return 'Invalid credentials.';
}

// ❌ BAD - Too specific
if (!user) return 'Email not found.';
if (!passwordsMatch) return 'Wrong password.';
```

**Tại sao?**
- Prevents username enumeration attacks
- Attacker không biết email có tồn tại không

---

#### 5. **Use constant-time comparison**

```typescript
// ✅ GOOD - bcrypt.compare (constant time)
const match = await bcrypt.compare(password, hash);

// ❌ BAD - Direct comparison
const match = (password === storedPassword);  // Timing attack vulnerable
```

---

#### 6. **Set secure cookie options**

```typescript
// In production
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,    // Cannot access via JavaScript
      sameSite: 'lax',   // CSRF protection
      path: '/',
      secure: true       // HTTPS only in production
    }
  }
}
```

---

#### 7. **Implement rate limiting**

```typescript
// Example: Limit login attempts
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Track failed attempts
if (failedAttempts >= MAX_ATTEMPTS) {
  return {
    error: 'Too many login attempts. Please try again later.',
  };
}
```

---

### ❌ DON'Ts (Không nên)

#### 1. **❌ Don't store passwords in plain text**

```typescript
// ❌ NEVER DO THIS
await sql`INSERT INTO users (email, password) 
          VALUES (${email}, ${password})`;
```

---

#### 2. **❌ Don't expose user existence**

```typescript
// ❌ BAD - Reveals email exists
if (!user) {
  return 'Email not found in our system.';
}
if (!passwordsMatch) {
  return 'Incorrect password.';
}

// ✅ GOOD - Generic message
if (!user || !passwordsMatch) {
  return 'Invalid credentials.';
}
```

---

#### 3. **❌ Don't skip validation**

```typescript
// ❌ BAD - No validation
const email = credentials.email;
const password = credentials.password;
const user = await getUser(email);  // Could be SQL injection!
```

---

#### 4. **❌ Don't use weak hashing algorithms**

```typescript
// ❌ BAD - MD5 is broken
import md5 from 'md5';
const hash = md5(password);

// ❌ BAD - SHA1 is broken
import sha1 from 'sha1';
const hash = sha1(password);

// ✅ GOOD - bcrypt is secure
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 10);
```

---

#### 5. **❌ Don't commit .env files**

```bash
# ❌ BAD - In Git
git add .env
git commit -m "Add env file"

# ✅ GOOD - Gitignore
# .gitignore
.env
.env.local
```

---

## 🎨 13. Advanced Patterns

### Pattern 1: Role-Based Access Control (RBAC)

```typescript
// /auth.config.ts
export const authConfig = {
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'admin';
      const isOnAdminPanel = nextUrl.pathname.startsWith('/admin');
      
      if (isOnAdminPanel) {
        if (isAdmin) return true;
        return false;  // Regular users cannot access admin
      }
      
      // Other route protection logic...
      return true;
    },
  },
} satisfies NextAuthConfig;
```

---

### Pattern 2: Session Callbacks (Add custom data)

```typescript
// /auth.ts
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        // ... validation ...
        
        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            role: user.role,  // Include role
          };
        }
        
        return null;
      },
    }),
  ],
});
```

**Usage:**
```tsx
const session = await auth();
console.log(session.user.id);    // Custom field
console.log(session.user.role);  // Custom field
```

---

### Pattern 3: Protected Server Actions

```typescript
// /app/lib/actions.ts
'use server';

import { auth } from '@/auth';

export async function deleteUser(userId: string) {
  const session = await auth();
  
  // Check authentication
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }
  
  // Check authorization
  if (session.user.role !== 'admin') {
    return { error: 'Forbidden: Admin access required' };
  }
  
  // Proceed with action
  await sql`DELETE FROM users WHERE id = ${userId}`;
  return { success: true };
}
```

---

### Pattern 4: Multiple Providers

```typescript
// /auth.ts
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      // ... credential logic
    }),
  ],
});
```

**Login page:**
```tsx
<button onClick={() => signIn('google')}>Sign in with Google</button>
<button onClick={() => signIn('github')}>Sign in with GitHub</button>
<form action={formAction}>
  {/* Credentials form */}
</form>
```

---

### Pattern 5: Remember Me (Extended Sessions)

```typescript
// /auth.ts
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        // ... validation ...
        
        if (passwordsMatch) {
          // Check remember me checkbox
          const rememberMe = credentials.rememberMe === 'true';
          
          return {
            ...user,
            rememberMe,
          };
        }
        
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.rememberMe) {
        // Extend session for 30 days
        token.maxAge = 30 * 24 * 60 * 60;
      } else {
        // Default 1 day
        token.maxAge = 24 * 60 * 60;
      }
      return token;
    },
  },
});
```

---

## 🧪 14. Testing

### Manual Testing Checklist

#### Authentication Flow:
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid email
- [ ] Cannot login with wrong password
- [ ] Error messages display correctly
- [ ] Redirect to dashboard after login
- [ ] Redirect to callbackUrl if provided

#### Authorization:
- [ ] Cannot access /dashboard without login
- [ ] Redirected to /login when accessing protected routes
- [ ] Can access dashboard after login
- [ ] Can logout successfully
- [ ] Redirected to home after logout

#### Security:
- [ ] Passwords are hashed in database
- [ ] Session cookies are httpOnly
- [ ] Session cookies are secure (HTTPS)
- [ ] AUTH_SECRET is in environment variables
- [ ] No sensitive data in URLs

---

### Unit Testing Example

```typescript
// /app/lib/__tests__/auth.test.ts
import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcrypt';

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'mypassword123';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/);  // bcrypt format
  });
  
  it('should verify password correctly', async () => {
    const password = 'mypassword123';
    const hash = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await bcrypt.compare('wrongpassword', hash);
    expect(isInvalid).toBe(false);
  });
});
```

---

## 📚 15. Thuật ngữ quan trọng

| Thuật ngữ | Giải nghĩa | Ví dụ |
|-----------|------------|-------|
| **Authentication** | Xác thực danh tính (Who are you?) | Login với password |
| **Authorization** | Phân quyền (What can you do?) | Admin có thể delete users |
| **2FA** | Two-Factor Authentication | Password + SMS code |
| **Session** | Phiên đăng nhập của user | Cookie chứa session ID |
| **JWT** | JSON Web Token | Encoded token chứa user data |
| **Hash** | One-way encryption | Password → Hash string |
| **Salt** | Random data thêm vào password | Prevents rainbow tables |
| **bcrypt** | Password hashing algorithm | Industry standard |
| **Middleware** | Code chạy trước request | Auth check trước render |
| **OAuth** | Open Authorization protocol | Login với Google |
| **Credentials** | Username/password login | Traditional login |

---

## 🎯 16. Key Takeaways

1. **Authentication ≠ Authorization** - Hai concept khác nhau
2. **NextAuth.js simplifies auth** - Không cần implement từ đầu
3. **Always hash passwords** - NEVER plain text!
4. **Middleware protects routes** - Check trước khi render
5. **bcrypt for password hashing** - Industry standard
6. **Generic error messages** - Prevent enumeration attacks
7. **Environment variables for secrets** - Never hardcode
8. **Session management** - Track logged-in users
9. **useActionState for forms** - Handle pending và errors
10. **Test thoroughly** - Security is critical!

---

## 🚀 17. Production Checklist

### Before deploying:

**Configuration:**
- [ ] AUTH_SECRET generated và set in .env
- [ ] .env file in .gitignore
- [ ] Environment variables set on Vercel
- [ ] Database URL configured
- [ ] Proxy matcher excludes static files

**Security:**
- [ ] All passwords hashed với bcrypt
- [ ] No secrets hardcoded in code
- [ ] Cookie settings secure (httpOnly, secure, sameSite)
- [ ] Rate limiting implemented
- [ ] Generic error messages (no enumeration)

**Routes:**
- [ ] Protected routes require authentication
- [ ] Unauthorized users redirected to /login
- [ ] Logged-in users redirected from /login
- [ ] Logout functionality works
- [ ] callbackUrl pattern implemented

**Testing:**
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Protected routes inaccessible without auth
- [ ] Session persists across page reloads
- [ ] Logout clears session

**User Experience:**
- [ ] Error messages clear và helpful
- [ ] Loading states during authentication
- [ ] Smooth redirects after login/logout
- [ ] Remember callbackUrl after login

---

## 📖 18. Further Reading

### Official Documentation:
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

### Security Resources:
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### Learning:
- [JWT.io](https://jwt.io/) - Understand JSON Web Tokens
- [Have I Been Pwned](https://haveibeenpwned.com/) - Check password breaches
- [Auth0 Blog](https://auth0.com/blog/) - Authentication best practices

---

## 🎉 Summary

**Authentication trong Next.js với NextAuth.js:**

### Core Components:
1. **NextAuth.js** - Authentication library
2. **Middleware** - Route protection
3. **bcrypt** - Password hashing
4. **Sessions** - User state management

### Security Layers:
1. **Password hashing** - bcrypt with salt
2. **Validation** - Zod validation
3. **Middleware** - Pre-render auth check
4. **HTTP-only cookies** - Secure session storage

### User Flow:
```
Login → Validate → Check DB → Compare Hash → Create Session → Redirect
```

**Remember:**
- ✅ Always hash passwords
- ✅ Use environment variables
- ✅ Generic error messages
- ✅ Test thoroughly
- ✅ Secure cookies in production

Master authentication → Build secure, professional applications! 🔐✨

---

## 💻 Complete Code Reference

### Test Credentials:
```
Email: user@nextmail.com
Password: 123456
```

### File Structure:
```
/
├── .env                  ← AUTH_SECRET
├── auth.config.ts        ← NextAuth config
├── auth.ts               ← Auth setup + providers
├── proxy.ts              ← Middleware
├── app/
│   ├── login/
│   │   └── page.tsx      ← Login page
│   ├── ui/
│   │   └── login-form.tsx ← Login form
│   └── lib/
│       └── actions.ts     ← authenticate action
└── database/
    └── users table        ← Hashed passwords
```

Perfect setup để implement production-ready authentication! 🎊