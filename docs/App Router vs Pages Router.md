# App Router vs Pages Router - So sánh toàn diện

## 📌 Tổng quan

Next.js hỗ trợ **2 routing systems** có thể **coexist** (chung sống) trong cùng 1 project:

| Router | Thư mục | Introduced | Status |
|--------|---------|------------|--------|
| **App Router** | `/app` | Next.js 13 (2022) | ✅ Recommended, Modern |
| **Pages Router** | `/pages` | Next.js 1 (2016) | ✅ Stable, Legacy support |

**Quan trọng:** Cả 2 có thể dùng chung trong 1 project!

---

## 🏗️ 1. Cấu trúc Folder & File Conventions

### Pages Router (Cách cũ)

```
/pages/
  ├── index.js                    → /
  ├── about.js                    → /about
  ├── blog/
  │   ├── index.js               → /blog
  │   ├── [slug].js              → /blog/:slug
  │   └── [category]/
  │       └── [post].js          → /blog/:category/:post
  ├── dashboard/
  │   └── settings.js            → /dashboard/settings
  └── api/
      └── users.js               → /api/users
```

**Đặc điểm Pages Router:**
- ✅ File = Route (đơn giản, dễ hiểu)
- ✅ Mỗi file là 1 page
- ❌ Không có nested layouts
- ❌ Phải dùng `_app.js`, `_document.js` cho global setup

---

### App Router (Cách mới)

```
/app/
  ├── page.js                     → /
  ├── layout.js                   → Root layout
  ├── about/
  │   └── page.js                → /about
  ├── blog/
  │   ├── page.js                → /blog
  │   ├── layout.js              → Blog layout (nested)
  │   ├── [slug]/
  │   │   └── page.js            → /blog/:slug
  │   └── [category]/
  │       └── [post]/
  │           └── page.js        → /blog/:category/:post
  ├── dashboard/
  │   ├── layout.js              → Dashboard layout
  │   ├── page.js                → /dashboard
  │   └── settings/
  │       └── page.js            → /dashboard/settings
  └── api/
      └── users/
          └── route.js           → /api/users
```

**Đặc điểm App Router:**
- ✅ Folder = Route segment
- ✅ `page.js` = UI for that route
- ✅ `layout.js` = Shared UI (nested layouts!)
- ✅ Special files: `loading.js`, `error.js`, `not-found.js`

---

## 📄 2. File Conventions - So sánh chi tiết

### Pages Router - Special Files

| File | Mục đích | Scope |
|------|----------|-------|
| `_app.js` | Global layout, state | Toàn bộ app |
| `_document.js` | Modify `<html>`, `<body>` | Toàn bộ app |
| `_error.js` | Custom error page | Toàn bộ app |
| `404.js` | Custom 404 page | Toàn bộ app |
| `500.js` | Custom 500 page | Toàn bộ app |

**Ví dụ `_app.js`:**
```jsx
// /pages/_app.js
export default function App({ Component, pageProps }) {
  return (
    <div>
      <nav>Global Navigation</nav>
      <Component {...pageProps} />
    </div>
  );
}
```

**Hạn chế:**
- ❌ Chỉ có 1 global layout
- ❌ Không thể nested layouts cho từng section
- ❌ Toàn bộ app re-render khi navigate

---

### App Router - Special Files

| File | Mục đích | Scope |
|------|----------|-------|
| `layout.js` | Shared UI, nested layouts | Per folder |
| `page.js` | Route UI | Per route |
| `loading.js` | Loading UI (Suspense) | Per route |
| `error.js` | Error boundary | Per route |
| `not-found.js` | 404 UI | Per route |
| `route.js` | API endpoint | Per route |
| `template.js` | Re-render on nav | Per route |
| `default.js` | Parallel routes fallback | Per route |

**Ví dụ nested layouts:**
```jsx
// /app/layout.js - Root layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>Global Nav</nav>
        {children}
      </body>
    </html>
  );
}

// /app/dashboard/layout.js - Dashboard layout
export default function DashboardLayout({ children }) {
  return (
    <div>
      <aside>Dashboard Sidebar</aside>
      <main>{children}</main>
    </div>
  );
}

// /app/dashboard/page.js - Dashboard page
export default function DashboardPage() {
  return <h1>Dashboard Home</h1>;
}
```

**Kết quả render:**
```html
<nav>Global Nav</nav>
<aside>Dashboard Sidebar</aside>
<main><h1>Dashboard Home</h1></main>
```

**Ưu điểm:**
- ✅ Nested layouts tự động
- ✅ Layout không re-render khi navigate
- ✅ Granular error boundaries
- ✅ Per-route loading states

---

## 🔄 3. Data Fetching - Sự khác biệt lớn nhất

### Pages Router - Data Fetching Methods

#### 3 methods chính:

**1️⃣ `getStaticProps` - Static Site Generation (SSG)**

```jsx
// /pages/blog/[slug].js
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);
  
  return {
    props: { post },
    revalidate: 60, // ISR: regenerate after 60s
  };
}

export async function getStaticPaths() {
  const posts = await fetchAllPosts();
  
  return {
    paths: posts.map(post => ({ params: { slug: post.slug } })),
    fallback: 'blocking',
  };
}

export default function BlogPost({ post }) {
  return <article>{post.title}</article>;
}
```

**Khi nào dùng:**
- ✅ Data không thay đổi thường xuyên
- ✅ Blog posts, documentation
- ✅ Muốn pre-render at build time

---

**2️⃣ `getServerSideProps` - Server-Side Rendering (SSR)**

```jsx
// /pages/dashboard.js
export async function getServerSideProps({ req, res }) {
  const session = await getSession(req);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  const data = await fetchDashboardData(session.userId);
  
  return {
    props: { data },
  };
}

export default function Dashboard({ data }) {
  return <div>{data.stats}</div>;
}
```

**Khi nào dùng:**
- ✅ Data cần fresh mỗi request
- ✅ Personalized content
- ✅ Real-time data

---

**3️⃣ `getInitialProps` - Hybrid (Deprecated)**

```jsx
// /pages/profile.js
ProfilePage.getInitialProps = async ({ req, res }) => {
  const data = await fetchProfile();
  return { data };
};

export default function ProfilePage({ data }) {
  return <div>{data.name}</div>;
}
```

**Lưu ý:**
- ⚠️ Deprecated, không nên dùng
- ⚠️ Chạy cả client lẫn server (confusing!)
- ✅ Dùng `getServerSideProps` hoặc `getStaticProps` thay thế

---

### App Router - Data Fetching

#### Đơn giản hóa radical - Just `fetch()`!

**Server Component (default):**

```jsx
// /app/blog/[slug]/page.js
export default async function BlogPost({ params }) {
  // Fetch trực tiếp trong component!
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: { revalidate: 60 }, // ISR
  }).then(res => res.json());
  
  return <article>{post.title}</article>;
}

// Generate static params (giống getStaticPaths)
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(res => res.json());
  
  return posts.map(post => ({
    slug: post.slug,
  }));
}
```

**Các options cho `fetch()`:**

```jsx
// 1. Static (mặc định) - cache forever
fetch('https://api.example.com/data')

// 2. ISR - revalidate after X seconds
fetch('https://api.example.com/data', {
  next: { revalidate: 60 }
})

// 3. Dynamic - no cache
fetch('https://api.example.com/data', {
  cache: 'no-store'
})

// 4. Revalidate by tag
fetch('https://api.example.com/data', {
  next: { tags: ['posts'] }
})
```

---

**Client Component:**

```jsx
'use client';

import { useEffect, useState } from 'react';

export default function ClientFetch() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  if (!data) return <div>Loading...</div>;
  return <div>{data.content}</div>;
}
```

---

## 📊 So sánh Data Fetching

| Feature | Pages Router | App Router |
|---------|-------------|-----------|
| **Location** | Separate functions | Inside component |
| **SSG** | `getStaticProps` | `fetch()` with cache |
| **SSR** | `getServerSideProps` | `fetch()` with `cache: 'no-store'` |
| **ISR** | `revalidate` in props | `next: { revalidate }` |
| **Complexity** | ⭐⭐⭐ (3 methods khác nhau) | ⭐ (chỉ `fetch()`) |
| **Type safety** | ❌ Manual typing | ✅ Better inference |

---

## 🧩 4. Layouts & Nested Routes

### Pages Router - Layouts

**Vấn đề:** Chỉ có 1 global layout trong `_app.js`

#### Pattern: Per-page layouts (workaround)

```jsx
// /pages/_app.js
export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  
  return getLayout(<Component {...pageProps} />);
}

// /pages/dashboard/index.js
import DashboardLayout from '@/layouts/DashboardLayout';

function DashboardPage() {
  return <h1>Dashboard</h1>;
}

DashboardPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default DashboardPage;
```

**Nhược điểm:**
- ❌ Boilerplate code cho mỗi page
- ❌ Layout re-render khi navigate
- ❌ Không tự động persist state

---

### App Router - Layouts

**Tự động và powerful!**

```jsx
// /app/layout.js - Root layout (bắt buộc)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>Global Header</header>
        {children}
        <footer>Global Footer</footer>
      </body>
    </html>
  );
}

// /app/dashboard/layout.js - Nested layout
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// /app/dashboard/analytics/layout.js - Deeper nested
export default function AnalyticsLayout({ children }) {
  return (
    <div className="analytics">
      <AnalyticsNav />
      {children}
    </div>
  );
}

// /app/dashboard/analytics/page.js
export default function AnalyticsPage() {
  return <h1>Analytics Dashboard</h1>;
}
```

**Kết quả render `/dashboard/analytics`:**
```html
<html>
  <body>
    <header>Global Header</header>
    <div class="dashboard">
      <Sidebar />
      <main>
        <div class="analytics">
          <AnalyticsNav />
          <h1>Analytics Dashboard</h1>
        </div>
      </main>
    </div>
    <footer>Global Footer</footer>
  </body>
</html>
```

**Ưu điểm:**
- ✅ Tự động nested
- ✅ Layouts không re-render khi navigate
- ✅ State persistence
- ✅ Cleaner code

---

## 🎨 5. Server vs Client Components

### Pages Router

**Tất cả đều là Client Components!**

```jsx
// /pages/index.js
// Đây là Client Component (có thể dùng hooks, events)
import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

// Nhưng có thể fetch data on server với getServerSideProps
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}
```

**Đặc điểm:**
- Component render trên server (initial) → hydrate trên client
- Có thể dùng hooks, event handlers
- Data fetching tách biệt với component

---

### App Router

**Mặc định là Server Components!**

#### Server Component (default):

```jsx
// /app/page.js
// Server Component - KHÔNG CẦN 'use server'
export default async function Home() {
  // Có thể fetch data trực tiếp
  const data = await fetchData();
  
  // ❌ KHÔNG thể dùng hooks
  // ❌ KHÔNG thể dùng event handlers
  
  return <div>{data.content}</div>;
}
```

#### Client Component (opt-in):

```jsx
// /app/counter.js
'use client';  // ← Explicitly mark as Client Component

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

#### Combining Server + Client:

```jsx
// /app/page.js - Server Component
import Counter from './counter';  // Client Component

export default async function Home() {
  const data = await fetchData();  // Server-side fetch
  
  return (
    <div>
      <h1>{data.title}</h1>
      <Counter />  {/* Client Component nested */}
    </div>
  );
}
```

---

## 📋 So sánh Server vs Client

| Feature | Pages Router | App Router |
|---------|-------------|-----------|
| **Default** | Client | Server |
| **Opt-in** | N/A | `'use client'` |
| **Data fetching** | getServerSideProps | `async` component |
| **Hooks** | ✅ Everywhere | ❌ Server, ✅ Client |
| **Event handlers** | ✅ Everywhere | ❌ Server, ✅ Client |
| **Bundle size** | Larger | Smaller (Server Components không ship JS) |

---

## 🔌 6. API Routes

### Pages Router

```
/pages/api/
  ├── hello.js              → /api/hello
  ├── users/
  │   ├── index.js         → /api/users
  │   └── [id].js          → /api/users/:id
  └── posts/
      └── [postId]/
          └── comments.js  → /api/posts/:postId/comments
```

#### Ví dụ:

```javascript
// /pages/api/users/[id].js
export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    const user = await getUser(id);
    res.status(200).json(user);
  } else if (req.method === 'PUT') {
    const updated = await updateUser(id, req.body);
    res.status(200).json(updated);
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
```

**Đặc điểm:**
- ✅ Đơn giản, quen thuộc
- ✅ Một handler cho tất cả methods
- ❌ Phải manually check method
- ❌ Không type-safe

---

### App Router - Route Handlers

```
/app/api/
  ├── hello/
  │   └── route.js         → /api/hello
  ├── users/
  │   ├── route.js         → /api/users
  │   └── [id]/
  │       └── route.js     → /api/users/:id
  └── posts/
      └── [postId]/
          └── comments/
              └── route.js → /api/posts/:postId/comments
```

#### Ví dụ:

```javascript
// /app/api/users/[id]/route.js
import { NextResponse } from 'next/server';

// GET /api/users/:id
export async function GET(request, { params }) {
  const { id } = params;
  const user = await getUser(id);
  return NextResponse.json(user);
}

// PUT /api/users/:id
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();
  const updated = await updateUser(id, body);
  return NextResponse.json(updated);
}

// DELETE /api/users/:id
export async function DELETE(request, { params }) {
  const { id } = params;
  await deleteUser(id);
  return new NextResponse(null, { status: 204 });
}
```

**Đặc điểm:**
- ✅ Separate function per HTTP method
- ✅ Cleaner, more RESTful
- ✅ Type-safe params
- ✅ Web standard Request/Response

---

## 📊 So sánh API Routes

| Feature | Pages Router | App Router |
|---------|-------------|-----------|
| **File name** | `[id].js` | `route.js` |
| **Method handling** | Manual `if/else` | Separate functions |
| **Request** | Node.js `req` | Web `Request` |
| **Response** | Node.js `res` | `NextResponse` |
| **Type safety** | ❌ Weak | ✅ Strong |
| **Clarity** | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 🏷️ 7. Metadata & SEO

### Pages Router

#### Method 1: Next.js `<Head>`

```jsx
// /pages/about.js
import Head from 'next/head';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us</title>
        <meta name="description" content="Learn more about us" />
        <meta property="og:title" content="About Us" />
      </Head>
      <h1>About Page</h1>
    </>
  );
}
```

#### Method 2: `_document.js` (global)

```jsx
// /pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

**Nhược điểm:**
- ❌ Phải import `<Head>` mỗi page
- ❌ Duplicate code
- ❌ Khó manage dynamic metadata

---

### App Router - Metadata API

#### Method 1: Static Metadata

```javascript
// /app/about/page.js
export const metadata = {
  title: 'About Us',
  description: 'Learn more about us',
  openGraph: {
    title: 'About Us',
    description: 'Learn more about us',
    images: ['/og-image.jpg'],
  },
};

export default function About() {
  return <h1>About Page</h1>;
}
```

#### Method 2: Dynamic Metadata

```javascript
// /app/blog/[slug]/page.js
export async function generateMetadata({ params }) {
  const post = await fetchPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);
  return <article>{post.content}</article>;
}
```

#### Method 3: Template Metadata

```javascript
// /app/blog/layout.js
export const metadata = {
  title: {
    template: '%s | My Blog',  // "%s" will be replaced
    default: 'My Blog',
  },
};

// /app/blog/post-1/page.js
export const metadata = {
  title: 'First Post',  // Final: "First Post | My Blog"
};
```

**Ưu điểm:**
- ✅ Type-safe
- ✅ Automatic merging với parent layouts
- ✅ Không cần import
- ✅ Static và dynamic support

---

## 🚦 8. Navigation & Links

### Pages Router

```jsx
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Nav() {
  const router = useRouter();
  
  return (
    <nav>
      {/* Link component */}
      <Link href="/about">About</Link>
      <Link href="/blog/my-post">Blog Post</Link>
      
      {/* Programmatic navigation */}
      <button onClick={() => router.push('/dashboard')}>
        Go to Dashboard
      </button>
      
      {/* Check current route */}
      {router.pathname === '/about' && <span>Active</span>}
    </nav>
  );
}
```

---

### App Router

```jsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <nav>
      {/* Link component - same */}
      <Link href="/about">About</Link>
      <Link href="/blog/my-post">Blog Post</Link>
      
      {/* Programmatic navigation */}
      <button onClick={() => router.push('/dashboard')}>
        Go to Dashboard
      </button>
      
      {/* Check current route */}
      {pathname === '/about' && <span>Active</span>}
    </nav>
  );
}
```

**Sự khác biệt:**
- `useRouter` từ `next/navigation` (không phải `next/router`)
- `usePathname()` thay vì `router.pathname`
- App Router có thêm `useSearchParams()`, `useParams()`

---

## 🔀 9. Coexistence - Dùng chung cả 2!

### Cấu trúc project khi dùng chung:

```
my-app/
  ├── app/                    ← App Router (ưu tiên)
  │   ├── layout.js
  │   ├── page.js            → /
  │   ├── dashboard/
  │   │   └── page.js        → /dashboard
  │   └── api/
  │       └── users/
  │           └── route.js   → /api/users
  │
  ├── pages/                  ← Pages Router (legacy)
  │   ├── _app.js
  │   ├── about.js           → /about
  │   ├── blog/
  │   │   └── [slug].js      → /blog/:slug
  │   └── api/
  │       └── posts/
  │           └── [id].js    → /api/posts/:id
  │
  └── public/
```

### ⚠️ Rules khi coexist:

1. **Route priority: App Router > Pages Router**
   ```
   /app/about/page.js         → Wins
   /pages/about.js            → Ignored
   ```

2. **API routes cùng tồn tại**
   ```
   /app/api/users/route.js    → /api/users
   /pages/api/posts/[id].js   → /api/posts/:id
   ✅ Both work!
   ```

3. **Không conflict nếu routes khác nhau**
   ```
   /app/dashboard/page.js     → /dashboard
   /pages/blog/[slug].js      → /blog/:slug
   ✅ Perfect harmony
   ```

---

### 🎯 Migration Strategy

#### Phase 1: New features trong App Router
```
/app/
  ├── new-feature/
  │   └── page.js            ← Tính năng mới
  └── api/
      └── v2/
          └── users/
              └── route.js   ← API mới

/pages/
  └── ...                    ← Legacy routes giữ nguyên
```

#### Phase 2: Migrate từng page dần dần
```
/app/
  ├── dashboard/             ← Đã migrate
  │   ├── layout.js
  │   └── page.js
  └── blog/                  ← Đang migrate
      └── page.js

/pages/
  ├── _app.js
  ├── about.js               ← Chưa migrate
  └── contact.js             ← Chưa migrate
```

#### Phase 3: Hoàn tất migration
```
/app/                        ← Everything in App Router!
  ├── layout.js
  ├── page.js
  ├── dashboard/
  ├── blog/
  ├── about/
  └── contact/

/pages/                      ← Remove (optional để lại API routes cũ)
  └── api/
      └── legacy/
```

---

## 📊 10. So sánh tổng quan

| Feature | Pages Router | App Router |
|---------|-------------|-----------|
| **Introduced** | Next.js 1 (2016) | Next.js 13 (2022) |
| **Status** | ✅ Stable, maintained | ✅ Recommended |
| **Learning curve** | ⭐⭐ Dễ | ⭐⭐⭐ Trung bình |
| **Routing** | File-based | Folder-based |
| **Layouts** | Manual pattern | ✅ Built-in, nested |
| **Data fetching** | 3 methods riêng | `fetch()` unified |
| **Default component** | Client | Server |
| **Bundle size** | Larger | Smaller |
| **Streaming** | ❌ Limited | ✅ Native support |
| **Suspense** | ❌ Manual | ✅ Built-in |
| **Error boundaries** | Global only | Per-route |
| **Loading states** | Manual | Built-in |
| **Metadata** | `<Head>` component | Metadata API |
| **Type safety** | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 Khi nào dùng cái nào?

### Dùng Pages Router khi:

✅ Maintain legacy codebase  
✅ Team chưa quen App Router  
✅ Project đơn giản, không cần nested layouts  
✅ Cần stability tuyệt đối (production critical)  
✅ Đã có codebase lớn, không muốn refactor  

### Dùng App Router khi:

✅ **New projects** (highly recommended!)  
✅ Cần nested layouts phức tạp  
✅ Cần streaming và Suspense  
✅ Optimize bundle size (Server Components)  
✅ Better developer experience  
✅ Modern React features (Server Components, etc.)  

### Dùng BOTH khi:

✅ **Đang migration từ Pages → App**  
✅ Legacy code lớn, migrate dần  
✅ New features dùng App Router  
✅ Muốn tận dụng best of both worlds  

---

## 🔄 11. Common Patterns - Code so sánh

### Pattern 1: Protected Routes

**Pages Router:**
```jsx
// /pages/dashboard.js
export async function getServerSideProps({ req, res }) {
  const session = await getSession(req);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return { props: { session } };
}

export default function Dashboard({ session }) {
  return <div>Welcome {session.user.name}</div>;
}
```

**App Router:**
```jsx
// /app/dashboard/page.js
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function Dashboard() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Welcome {session.user.name}</div>;
}
```

---

### Pattern 2: Dynamic Routes with Params

**Pages Router:**
```jsx
// /pages/blog/[category]/[slug].js
export default function BlogPost({ category, slug, post }) {
  return (
    <article>
      <small>{category}</small>
      <h1>{post.title}</h1>
    </article>
  );
}

export async function getServerSideProps({ params }) {
  const { category, slug } = params;
  const post = await fetchPost(category, slug);
  
  return {
    props: { category, slug, post },
  };
}
```

**App Router:**
```jsx
// /app/blog/[category]/[slug]/page.js
export default async function BlogPost({ params }) {
  const { category, slug } = params;
  const post = await fetchPost(category, slug);
  
  return (
    <article>
      <small>{category}</small>
      <h1>{post.title}</h1>
    </article>
  );
}
```

---

### Pattern 3: Loading States

**Pages Router:**
```jsx
// /pages/posts.js
import { useState, useEffect } from 'react';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

**App Router:**
```jsx
// /app/posts/loading.js
export default function Loading() {
  return <div>Loading...</div>;
}

// /app/posts/page.js
async function getPosts() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function Posts() {
  const posts = await getPosts();
  
  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

---

## 💡 Tips cho việc làm chủ cả 2

### 1. **Hiểu rõ mental model**

**Pages Router:**
- Think: "File = Route = Page"
- Component là client component với server data fetching riêng

**App Router:**
- Think: "Folder = Route segment, `page.js` = UI"
- Component mặc định là server, opt-in client khi cần

---

### 2. **Practice migration patterns**

Bắt đầu với 1 page đơn giản:

```jsx
// Before: /pages/about.js
export default function About() {
  return <h1>About Us</h1>;
}

// After: /app/about/page.js
export default function About() {
  return <h1>About Us</h1>;
}
```

Rồi thêm dần complexity: layouts, loading, errors, etc.

---

### 3. **Leverage coexistence**

Đừng sợ dùng chung! Example workflow:

```
Week 1: Migrate homepage → /app/page.js
Week 2: Migrate dashboard → /app/dashboard/
Week 3: Add new feature → /app/analytics/
Week 4: Migrate blog → /app/blog/
...
Keep: /pages/api/ (API routes cũ vẫn hoạt động)
```

---

### 4. **Tài liệu reference**

- [Next.js Docs - Pages Router](https://nextjs.org/docs/pages)
- [Next.js Docs - App Router](https://nextjs.org/docs/app)
- [Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

---

## 🎓 Checklist làm chủ cả 2

### Pages Router Mastery:
- [ ] Hiểu `getStaticProps`, `getServerSideProps`
- [ ] Biết cách dùng `getStaticPaths` cho dynamic routes
- [ ] Master `_app.js` và `_document.js`
- [ ] Implement per-page layouts pattern
- [ ] Tạo API routes trong `/pages/api`

### App Router Mastery:
- [ ] Hiểu Server vs Client Components
- [ ] Master nested layouts
- [ ] Dùng `loading.js`, `error.js`, `not-found.js`
- [ ] Fetch data với `fetch()` và caching options
- [ ] Implement Route Handlers trong `/app/api`
- [ ] Hiểu Streaming và Suspense
- [ ] Dùng Metadata API

### Coexistence Mastery:
- [ ] Biết priority rules (App > Pages)
- [ ] Plan migration strategy
- [ ] Migrate một route từ Pages → App
- [ ] Maintain cả 2 routers trong 1 project

---

## 🚀 Conclusion

**App Router** là tương lai của Next.js, nhưng **Pages Router** vẫn hoàn toàn viable và được support.

**Strategy cho dự án của bạn:**
1. **New features** → App Router
2. **Legacy code** → Pages Router (giữ nguyên)
3. **Migration** → Dần dần, không rush
4. **Learn both** → Flexible và powerful!

Làm chủ cả 2 giúp bạn:
- ✅ Maintain legacy codebases
- ✅ Build với modern features
- ✅ Flexible trong mọi tình huống
- ✅ Trở thành Next.js expert!

Good luck! 🎉