# Next.js - Navigation

## 📌 TỔNG QUAN

Next.js cung cấp `<Link>` component để điều hướng giữa các pages với **client-side navigation** tối ưu hơn `<a>` tag truyền thống.

---

## 1️⃣ SO SÁNH: `<a>` TAG vs `<Link>` COMPONENT

### ❌ Vấn đề với `<a>` tag:

```tsx
// Sử dụng <a> tag
<a href="/dashboard">Dashboard</a>
<a href="/customers">Customers</a>
```

**Kết quả:**
```
User click link → Full page reload 🔄
                → Mất state
                → Download lại toàn bộ resources
                → Chậm, trải nghiệm kém
```

---

### ✅ Giải pháp với `<Link>` component:

```tsx
// Sử dụng <Link> component
import Link from 'next/link';

<Link href="/dashboard">Dashboard</Link>
<Link href="/customers">Customers</Link>
```

**Kết quả:**
```
User click link → Client-side navigation ⚡
                → Giữ nguyên state
                → Chỉ update phần thay đổi
                → Nhanh, mượt mà như native app
```

---

## 2️⃣ `<LINK>` COMPONENT

### Cú pháp cơ bản:

```tsx
import Link from 'next/link';

export default function NavLinks() {
  return (
    <>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/customers">Customers</Link>
      <Link href="/invoices">Invoices</Link>
    </>
  );
}
```

### So sánh với `<a>` tag:

| Feature | `<a>` tag | `<Link>` component |
|---------|-----------|-------------------|
| **Syntax** | `<a href="/page">` | `<Link href="/page">` |
| **Navigation** | Full page reload | Client-side (SPA-like) |
| **Performance** | ❌ Chậm | ✅ Nhanh |
| **State** | ❌ Mất | ✅ Giữ nguyên |
| **Prefetch** | ❌ Không | ✅ Tự động |

---

## 3️⃣ CODE SPLITTING & PREFETCHING

### 🔧 Automatic Code Splitting

**React SPA truyền thống:**
```
Browser tải toàn bộ app code khi load lần đầu
    ↓
bundle.js (5MB) → Chậm, lãng phí
```

**Next.js:**
```
Next.js tự động chia code theo routes
    ↓
/dashboard.js (200KB)
/customers.js (150KB)  → Chỉ tải khi cần
/invoices.js (180KB)
```

**Lợi ích:**
- ✅ Pages tách biệt → Lỗi 1 page không ảnh hưởng app
- ✅ Browser parse ít code hơn → Nhanh hơn
- ✅ Initial load nhẹ hơn

---

### ⚡ Automatic Prefetching

**Cơ chế:**
```
<Link> xuất hiện trong viewport (màn hình)
    ↓
Next.js tự động tải trước code của route đó (background)
    ↓
User click → Code đã sẵn sàng → Navigate gần như tức thì!
```

**Ví dụ:**
```tsx
// User đang ở trang /dashboard
<nav>
  <Link href="/customers">Customers</Link>  ← Hiển thị trong viewport
  <Link href="/invoices">Invoices</Link>    ← Hiển thị trong viewport
</nav>

// Next.js tự động prefetch:
// → /customers.js (background)
// → /invoices.js (background)

// User click "Customers" → Navigate ngay lập tức! ⚡
```

**Lưu ý:** Chỉ hoạt động trong **production mode** (`npm run build && npm start`)

---

## 4️⃣ ACTIVE LINK PATTERN

### Vấn đề:
Làm sao để highlight link đang active (trang hiện tại)?

### Giải pháp: `usePathname()` Hook

#### **Bước 1: Chuyển sang Client Component**

```tsx
'use client';  // ← Bắt buộc vì usePathname() là React Hook

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks() {
  const pathname = usePathname();  // ← Lấy path hiện tại
  
  console.log(pathname);  
  // Output: "/dashboard" hoặc "/customers" hoặc "/invoices"
  
  return (
    // ...
  );
}
```

**Tại sao cần `'use client'`?**
- `usePathname()` là React Hook
- Hooks chỉ chạy trên client
- Server components không có hooks

---

#### **Bước 2: Conditional Styling với `clsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentDuplicateIcon },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              // Base styles (luôn luôn có)
              'flex h-[48px] grow items-center gap-2 rounded-md bg-gray-50 p-3',
              // Conditional styles (chỉ khi active)
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
                // ↑ Nếu pathname khớp với link.href → Thêm class này
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p>{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
```

---

### 📊 Flow hoạt động:

```
User ở trang /dashboard
    ↓
pathname = '/dashboard'
    ↓
Render links:
    ├─ Dashboard: pathname === '/dashboard' → TRUE  → bg-sky-100 ✅
    ├─ Customers: pathname === '/customers' → FALSE → bg-gray-50
    └─ Invoices:  pathname === '/invoices'  → FALSE → bg-gray-50
    ↓
User click "Customers"
    ↓
Navigate → pathname = '/customers'
    ↓
Re-render links:
    ├─ Dashboard: pathname === '/dashboard' → FALSE → bg-gray-50
    ├─ Customers: pathname === '/customers' → TRUE  → bg-sky-100 ✅
    └─ Invoices:  pathname === '/invoices'  → FALSE → bg-gray-50
```

---

### 🎨 Ví dụ visual:

```
┌─────────────────────────────────────┐
│  DASHBOARD (Active - Blue bg) ✅    │  ← pathname === '/dashboard'
│  Customers (Inactive - Gray bg)     │
│  Invoices (Inactive - Gray bg)      │
└─────────────────────────────────────┘

User click "Customers"
    ↓

┌─────────────────────────────────────┐
│  Dashboard (Inactive - Gray bg)     │
│  CUSTOMERS (Active - Blue bg) ✅    │  ← pathname === '/customers'
│  Invoices (Inactive - Gray bg)      │
└─────────────────────────────────────┘
```

---

## 5️⃣ CLIENT COMPONENT vs SERVER COMPONENT

### Khi nào cần Client Component?

```tsx
// ❌ Server Component - KHÔNG có hooks
export default function NavLinks() {
  const pathname = usePathname();  // ← LỖI! Không có hooks
  // ...
}

// ✅ Client Component - CÓ hooks
'use client';

export default function NavLinks() {
  const pathname = usePathname();  // ← OK!
  // ...
}
```

### Rules:

| Feature | Server Component | Client Component |
|---------|-----------------|------------------|
| **React Hooks** | ❌ Không | ✅ Có |
| **Browser APIs** | ❌ Không | ✅ Có |
| **Event Handlers** | ❌ Không | ✅ Có |
| **'use client'** | Không cần | ✅ Bắt buộc |
| **Default** | ✅ Mặc định | Phải khai báo |

---

## 6️⃣ CLSX LIBRARY

### Công dụng:
Kết hợp class names một cách có điều kiện

### Cú pháp:

```tsx
import clsx from 'clsx';

// Ví dụ 1: Base classes + Conditional classes
<div className={clsx(
  'base-class always-applied',  // ← Luôn có
  {
    'active-class': isActive,    // ← Chỉ khi isActive = true
    'error-class': hasError,     // ← Chỉ khi hasError = true
  }
)} />

// Ví dụ 2: Multiple conditions
<div className={clsx(
  'px-4 py-2 rounded',
  {
    'bg-blue-500': type === 'primary',
    'bg-gray-500': type === 'secondary',
    'opacity-50': disabled,
    'cursor-not-allowed': disabled,
  }
)} />
```

### So sánh:

```tsx
// ❌ Không dùng clsx (khó đọc)
<div className={`base-class ${isActive ? 'active' : ''} ${hasError ? 'error' : ''}`} />

// ✅ Dùng clsx (dễ đọc)
<div className={clsx('base-class', {
  'active': isActive,
  'error': hasError,
})} />
```

---

## 7️⃣ COMPLETE EXAMPLE

```tsx
// app/ui/dashboard/nav-links.tsx
'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Invoices', href: '/dashboard/invoices', icon: DocumentDuplicateIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
```

---

## 8️⃣ NAVIGATION FLOW - TỔNG HỢP

```
┌──────────────────────────────────────────────────────────────┐
│  1. User click <Link href="/customers">                     │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  2. Next.js Router:                                          │
│     - Không reload page                                      │
│     - Client-side navigation                                 │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Check prefetch:                                          │
│     - Code đã load sẵn? → Yes → Navigate ngay               │
│     - Chưa load? → Load → Navigate                          │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  4. Update URL:                                              │
│     - Browser URL: /dashboard → /customers                   │
│     - pathname: '/dashboard' → '/customers'                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  5. Partial Rendering:                                       │
│     - Layout: Không re-render (giữ state)                   │
│     - Page: Re-render với /customers page                   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  6. Active Link Update:                                      │
│     - pathname thay đổi                                      │
│     - NavLinks re-render                                     │
│     - "Customers" link → bg-sky-100 (active)                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 TỔNG KẾT

### **Core Concepts:**

1. **`<Link>` Component:**
   - Thay thế cho `<a>` tag
   - Client-side navigation (không reload page)
   - Giữ nguyên state, nhanh hơn

2. **Code Splitting:**
   - Tự động chia code theo routes
   - Chỉ load khi cần thiết
   - Pages tách biệt, lỗi không lan rộng

3. **Prefetching:**
   - `<Link>` trong viewport → Tự động prefetch
   - Chỉ hoạt động ở production
   - Navigate gần như tức thì

4. **Active Links:**
   - `usePathname()` hook → Lấy path hiện tại
   - `'use client'` directive → Cần thiết cho hooks
   - `clsx` library → Conditional class names

---

### **Comparison Table:**

| Tính năng | `<a>` tag | `<Link>` component |
|-----------|-----------|-------------------|
| **Full reload** | ✅ Có | ❌ Không |
| **Client navigation** | ❌ Không | ✅ Có |
| **Giữ state** | ❌ Không | ✅ Có |
| **Code splitting** | ❌ Không | ✅ Có |
| **Prefetching** | ❌ Không | ✅ Có |
| **Performance** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

### **Best Practices:**

```tsx
// ✅ DO: Sử dụng <Link> cho internal navigation
<Link href="/dashboard">Dashboard</Link>

// ❌ DON'T: Dùng <a> cho internal navigation
<a href="/dashboard">Dashboard</a>

// ✅ DO: Dùng <a> cho external links
<a href="https://google.com" target="_blank">Google</a>

// ✅ DO: Active links với usePathname()
const pathname = usePathname();
<Link className={clsx({ 'active': pathname === link.href })} />

// ✅ DO: 'use client' khi dùng hooks
'use client';
import { usePathname } from 'next/navigation';
```

---

### **Key Takeaways:**

1. **`<Link>` > `<a>`** cho internal navigation
2. **Prefetching tự động** → Navigate nhanh hơn
3. **Code splitting** → Performance tốt hơn
4. **`usePathname()`** → Active link pattern
5. **`'use client'`** → Bắt buộc cho hooks

---

**Next.js Navigation = Fast, Smooth, Optimized by Default! 🚀**