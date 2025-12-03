# Next.js - Routing & Layouts

## 📌 TÓM TẮT

Next.js sử dụng **File-System Routing** - cấu trúc thư mục tự động tạo routes.

---

## 1️⃣ FILE-SYSTEM ROUTING

### Cấu trúc cơ bản:

```
app/
├── page.tsx              → /
├── dashboard/
│   ├── page.tsx          → /dashboard
│   ├── customers/
│   │   └── page.tsx      → /dashboard/customers
│   └── invoices/
│       └── page.tsx      → /dashboard/invoices
```

### Quy tắc:

| File/Folder | Mục đích | Bắt buộc? |
|-------------|----------|-----------|
| `page.tsx` | Trang có thể truy cập công khai | ✅ Có |
| `layout.tsx` | UI chia sẻ giữa các trang con | ❌ Không |
| Thư mục | Tạo route segment | ✅ Có (cho nested routes) |

---

## 2️⃣ PAGE.TSX

### Định nghĩa:
File đặc biệt Next.js export React component, **BẮT BUỘC** để route có thể truy cập.

### Ví dụ:

```tsx
// app/dashboard/page.tsx
export default function Page() {
  return <p>Dashboard Page</p>;
}
```

**URL:** `http://localhost:3000/dashboard`

---

## 3️⃣ LAYOUT.TSX - CHILDREN PROP EXPLAINED

### Định nghĩa:
UI được chia sẻ giữa nhiều pages con, nhận `children` prop từ **Next.js tự động inject**.

---

### 🔑 CHILDREN LÀ GÌ?

**TL;DR:** `children` = Component từ `page.tsx` của route hiện tại

```
User truy cập URL → Next.js tìm page.tsx tương ứng → Inject vào {children}
```

---

### 📂 CẤU TRÚC THƯ MỤC MẪU:

```
app/
├── layout.tsx                    # Root Layout
└── dashboard/
    ├── layout.tsx                # Dashboard Layout  ← Nhận children
    ├── page.tsx                  # Dashboard Page    ← Children #1
    ├── customers/
    │   └── page.tsx              # Customers Page    ← Children #2
    └── invoices/
        └── page.tsx              # Invoices Page     ← Children #3
```

---

### 🎯 CHILDREN = PAGE COMPONENT

#### **Case 1: User vào `/dashboard`**

```tsx
// 1. Next.js tìm: app/dashboard/page.tsx
export default function Page() {
  return <p>Dashboard Page</p>;
}

// 2. Next.js inject component này vào children:
<Layout>
  {children}  ← Nhận <p>Dashboard Page</p>
</Layout>

// 3. Kết quả render:
<div className="flex h-screen">
  <SideNav />
  <div className="grow p-6">
    <p>Dashboard Page</p>  ← Từ dashboard/page.tsx
  </div>
</div>
```

#### **Case 2: User vào `/dashboard/customers`**

```tsx
// 1. Next.js tìm: app/dashboard/customers/page.tsx
export default function Page() {
  return <p>Customers Page</p>;
}

// 2. Next.js inject component này vào children:
<Layout>
  {children}  ← Nhận <p>Customers Page</p>
</Layout>

// 3. Kết quả render:
<div className="flex h-screen">
  <SideNav />  ← KHÔNG ĐỔI
  <div className="grow p-6">
    <p>Customers Page</p>  ← Đổi thành customers/page.tsx
  </div>
</div>
```

#### **Case 3: User vào `/dashboard/invoices`**

```tsx
// 1. Next.js tìm: app/dashboard/invoices/page.tsx
export default function Page() {
  return <p>Invoices Page</p>;
}

// 2. Children thay đổi:
<Layout>
  {children}  ← Nhận <p>Invoices Page</p>
</Layout>
```

---

### 🔄 FLOW HOẠT ĐỘNG CHI TIẾT

```
┌─────────────────────────────────────────────────────────────┐
│  1. User nhập URL: http://localhost:3000/dashboard/customers│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Next.js Router phân tích URL:                            │
│     - Path: /dashboard/customers                             │
│     - Segments: ['dashboard', 'customers']                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Next.js tìm layouts theo hierarchy:                      │
│     ✓ app/layout.tsx (Root Layout)                           │
│     ✓ app/dashboard/layout.tsx (Dashboard Layout)            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Next.js tìm page component:                              │
│     ✓ app/dashboard/customers/page.tsx                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Next.js build component tree:                            │
│                                                               │
│     <RootLayout>           ← app/layout.tsx                  │
│       <DashboardLayout>    ← app/dashboard/layout.tsx        │
│         <CustomersPage />  ← app/dashboard/customers/page.tsx│
│       </DashboardLayout>   ↑ Đây chính là {children}         │
│     </RootLayout>                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Render HTML:                                             │
│                                                               │
│  <html>                                                       │
│    <body>                                                     │
│      <div class="flex h-screen">                             │
│        <div class="w-64">                                     │
│          <SideNav />                                          │
│        </div>                                                 │
│        <div class="grow p-6">                                 │
│          <p>Customers Page</p>  ← children rendered ở đây    │
│        </div>                                                 │
│      </div>                                                   │
│    </body>                                                    │
│  </html>                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 💡 SO SÁNH VỚI REACT THÔNG THƯỜNG

#### **React thông thường (Manual):**

```tsx
// ❌ Phải MANUALLY truyền children
function App() {
  return (
    <Layout>
      <DashboardPage />  {/* ← Phải tự truyền */}
    </Layout>
  );
}

function Layout({ children }) {
  return (
    <div>
      <SideNav />
      {children}  {/* ← Nhận DashboardPage */}
    </div>
  );
}
```

#### **Next.js (Automatic):**

```tsx
// ✅ Next.js TỰ ĐỘNG inject dựa trên URL
// app/dashboard/layout.tsx
export default function Layout({ children }) {
  return (
    <div>
      <SideNav />
      {children}  {/* ← Next.js tự inject page.tsx */}
    </div>
  );
}

// BẠN KHÔNG CẦN VIẾT:
// <Layout><DashboardPage /></Layout>
// Next.js làm điều này tự động dựa trên file structure!
```

---

### 📊 BẢNG TÓM TẮT: CHILDREN THEO URL

| URL | File được inject vào `{children}` | Component |
|-----|-----------------------------------|-----------|
| `/dashboard` | `app/dashboard/page.tsx` | `<DashboardPage />` |
| `/dashboard/customers` | `app/dashboard/customers/page.tsx` | `<CustomersPage />` |
| `/dashboard/invoices` | `app/dashboard/invoices/page.tsx` | `<InvoicesPage />` |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | `<SettingsPage />` |

**Quy luật:** Next.js **TỰ ĐỘNG** tìm `page.tsx` gần nhất trong cây thư mục và inject vào `children`.

---

### 🧩 VÍ DỤ THỰC TẾ VỚI CODE ĐẦY ĐỦ

#### **File 1: Dashboard Layout**
```tsx
// app/dashboard/layout.tsx
import SideNav from '@/app/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
  console.log('Layout render'); // ← Chỉ render 1 lần
  
  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* PHẦN CỐ ĐỊNH - Không re-render */}
      <div className="w-full md:w-64">
        <SideNav />
      </div>
      
      {/* PHẦN ĐỘNG - Re-render khi navigate */}
      <div className="grow p-6">
        {children}  {/* ← Page component xuất hiện ở đây */}
      </div>
    </div>
  );
}
```

#### **File 2: Dashboard Page**
```tsx
// app/dashboard/page.tsx
export default function Page() {
  console.log('Dashboard Page render');
  
  return (
    <div>
      <h1>Dashboard Overview</h1>
      <p>Welcome to dashboard!</p>
    </div>
  );
}
```

#### **File 3: Customers Page**
```tsx
// app/dashboard/customers/page.tsx
export default function Page() {
  console.log('Customers Page render');
  
  return (
    <div>
      <h1>Customers List</h1>
      <table>...</table>
    </div>
  );
}
```

#### **Console Output khi navigate:**

```
User vào /dashboard:
  → Layout render
  → Dashboard Page render

User click navigate → /dashboard/customers:
  → Customers Page render  ← CHỈ page mới render
  (Layout KHÔNG render lại)

User click back → /dashboard:
  → Dashboard Page render  ← CHỈ page render
  (Layout KHÔNG render lại)
```

---

### ⚠️ LƯU Ý QUAN TRỌNG

#### **1. Children KHÔNG PHẢI là prop thông thường**

```tsx
// ❌ KHÔNG THỂ làm như này:
<Layout children={<DashboardPage />} />

// ✅ Next.js tự động làm dựa trên URL
// Bạn CHỈ CẦN tạo file structure đúng
```

#### **2. Children có thể là Layout khác (Nested Layouts)**

```
app/
├── layout.tsx                    # Root Layout
└── dashboard/
    ├── layout.tsx                # Dashboard Layout
    └── analytics/
        ├── layout.tsx            # Analytics Layout  ← Cũng là children!
        └── page.tsx              # Analytics Page
```

```tsx
// Khi vào /dashboard/analytics:
<RootLayout>
  <DashboardLayout>
    {children}  ← ĐÂY LÀ <AnalyticsLayout>
      <AnalyticsLayout>
        {children}  ← ĐÂY LÀ <AnalyticsPage />
      </AnalyticsLayout>
  </DashboardLayout>
</RootLayout>
```

#### **3. Không có page.tsx = 404**

```
app/
└── dashboard/
    ├── layout.tsx
    └── (không có page.tsx)

User vào /dashboard → 404 Error
Vì: Layout có nhưng không có page.tsx để inject vào children
```

---

### 🎯 KEY TAKEAWAYS

1. **Children = Page component** tương ứng với URL
2. **Next.js tự động inject** - bạn không cần truyền manual
3. **Children thay đổi** khi navigate, **Layout không đổi**
4. **File structure = Component tree** - Next.js build tự động
5. **Phải có page.tsx** thì route mới accessible

---

### 🔗 QUAN HỆ GIỮA CÁC FILES

```
URL: /dashboard/customers
                ↓
     ┌──────────────────────┐
     │   Route Matching     │
     └──────────────────────┘
                ↓
     ┌──────────────────────────────────────┐
     │  Next.js tìm files:                  │
     │  1. app/layout.tsx                   │
     │  2. app/dashboard/layout.tsx         │
     │  3. app/dashboard/customers/page.tsx │
     └──────────────────────────────────────┘
                ↓
     ┌──────────────────────────────────────┐
     │  Component Tree:                     │
     │                                      │
     │  <RootLayout>                        │
     │    <DashboardLayout>                 │
     │      <CustomersPage />  ← children   │
     │    </DashboardLayout>                │
     │  </RootLayout>                       │
     └──────────────────────────────────────┘
                ↓
           Render HTML
```

**Children chính là "slot" để Next.js đặt page component vào!** 🎰

---

## 4️⃣ PARTIAL RENDERING ⚡

### Cơ chế:

```
User điều hướng: /dashboard → /dashboard/customers

┌─────────────────────────────────┐
│  <Layout>                       │
│    <SideNav />  ← KHÔNG render  │ ✅ Giữ state
│    <div>                         │
│      {children} ← CHỈ re-render │ ⚡ Nhanh hơn
│    </div>                        │
│  </Layout>                       │
└─────────────────────────────────┘
```

### Lợi ích:

| Không dùng Layout | Dùng Layout |
|-------------------|-------------|
| ❌ Re-render toàn bộ | ✅ Chỉ re-render children |
| ❌ Mất state khi navigate | ✅ Giữ state trong layout |
| ❌ Lặp code nhiều nơi | ✅ DRY - code 1 lần |
| ❌ Chậm | ✅ Nhanh |

**Ví dụ thực tế:**
```tsx
<SideNav>
  <input value={searchQuery} />  
  {/* ← State giữ nguyên khi navigate giữa pages */}
</SideNav>
```

---

## 5️⃣ ROOT LAYOUT

### Định nghĩa:
Layout **BẮT BUỘC** ở `/app/layout.tsx`, bọc toàn bộ ứng dụng.

### Ví dụ:

```tsx
// app/layout.tsx
import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}  {/* ← Tất cả pages render ở đây */}
      </body>
    </html>
  );
}
```

### Mục đích:
- Sửa đổi `<html>`, `<body>` tags
- Thêm global CSS
- Thêm metadata (SEO)
- UI chung cho **TẤT CẢ** pages

### Cấu trúc layouts:

```
Root Layout (app/layout.tsx)
  └─ Dashboard Layout (app/dashboard/layout.tsx)
       ├─ Dashboard Page (app/dashboard/page.tsx)
       ├─ Customers Page (app/dashboard/customers/page.tsx)
       └─ Invoices Page (app/dashboard/invoices/page.tsx)
```

---

## 6️⃣ COLOCATION

### Định nghĩa:
Đặt các files liên quan (components, utils, tests) cùng folder với routes.

### Cấu trúc:

```
app/
├── layout.tsx
├── page.tsx
├── ui/                    ← Components (không public)
│   ├── button.tsx
│   └── dashboard/
│       └── sidenav.tsx
├── lib/                   ← Utilities (không public)
│   └── data.ts
└── dashboard/
    ├── layout.tsx
    ├── page.tsx          ← Public (chỉ page.tsx)
    └── actions.ts        ← Server actions (không public)
```

### Quy tắc:
✅ **CHỈ** `page.tsx` là public route  
❌ Các files khác (`layout.tsx`, components, utils) không thể truy cập trực tiếp qua URL

---

## 7️⃣ THỰC HÀNH

### Bài tập: Tạo Dashboard với 3 pages

```bash
# Cấu trúc cần tạo:
app/
└── dashboard/
    ├── layout.tsx           # Layout chung
    ├── page.tsx             # /dashboard
    ├── customers/
    │   └── page.tsx         # /dashboard/customers
    └── invoices/
        └── page.tsx         # /dashboard/invoices
```

### Code mẫu:

**1. Dashboard Layout:**
```tsx
// app/dashboard/layout.tsx
import SideNav from '@/app/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
```

**2. Dashboard Page:**
```tsx
// app/dashboard/page.tsx
export default function Page() {
  return <p>Dashboard Page</p>;
}
```

**3. Customers Page:**
```tsx
// app/dashboard/customers/page.tsx
export default function Page() {
  return <p>Customers Page</p>;
}
```

**4. Invoices Page:**
```tsx
// app/dashboard/invoices/page.tsx
export default function Page() {
  return <p>Invoices Page</p>;
}
```

---

## 8️⃣ SO SÁNH: LAYOUTS VS COMPONENTS

| Aspect | Layout | Component |
|--------|--------|-----------|
| **Scope** | Nhiều pages | 1 page hoặc component |
| **Re-render** | Không (partial rendering) | Có (khi props đổi) |
| **State** | Giữ nguyên khi navigate | Reset khi unmount |
| **Vị trí** | `layout.tsx` | Anywhere (`.tsx`, `.jsx`) |
| **Children** | Tự động từ pages | Truyền thủ công |

---

## 9️⃣ BEST PRACTICES

### ✅ NÊN:
- Dùng `layout.tsx` cho UI lặp lại (navbar, sidebar, footer)
- Tạo nested layouts cho từng section (dashboard, admin, etc.)
- Giữ logic business ở server components trong layouts
- Dùng colocation để organize code theo features

### ❌ KHÔNG NÊN:
- Đặt state quản lý phức tạp trong layout (dùng Context thay thế)
- Re-fetch data trong layout mỗi lần navigate
- Tạo quá nhiều nested layouts (2-3 levels là đủ)
- Đặt client components nặng trong layout (ảnh hưởng performance)

---

## 🔟 CHEAT SHEET

```tsx
// 1. Tạo route: Folder + page.tsx
app/about/page.tsx → /about

// 2. Tạo nested route: Nested folders
app/blog/[slug]/page.tsx → /blog/:slug

// 3. Shared UI: layout.tsx
app/dashboard/layout.tsx → Dùng chung cho tất cả /dashboard/*

// 4. Root layout: Bắt buộc
app/layout.tsx → Bọc toàn bộ app

// 5. Private files: Không có page.tsx
app/lib/utils.ts → Không thể truy cập qua URL
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [Next.js Routing Documentation](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js Layouts Documentation](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [Next.js File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)

---

## 🎯 KẾT LUẬN

**Next.js Routing = Simple yet Powerful**

```
Folder Structure = Routes 🗂️
page.tsx = Public Access 🌐
layout.tsx = Shared UI 🎨
Partial Rendering = Performance ⚡
```

**Remember:** Layouts preserve state → Faster navigation → Better UX! 🚀