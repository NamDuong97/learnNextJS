# Search và Pagination trong Next.js

## 📌 Mục tiêu chương này
Học cách implement **search và pagination** sử dụng **URL search params** trong Next.js.

---

## 🎯 Tại sao dùng URL Search Params?

### ❓ Câu hỏi: Tại sao không dùng Client State?

Nhiều người quen dùng `useState` để quản lý search state:
```jsx
// ❌ Cách cũ - dùng state
const [searchQuery, setSearchQuery] = useState('');
```

### ✅ Lý do nên dùng URL Search Params:

#### 1. **Bookmarkable & Shareable** (Có thể bookmark và chia sẻ)
```
URL: /dashboard/invoices?query=pending&page=2
```
- User có thể **bookmark** link này
- User có thể **share** link này cho đồng nghiệp
- Mở lại sẽ giữ nguyên state (query, page, filters)

#### 2. **Server-Side Rendering (SSR)**
- URL params được đọc trực tiếp trên server
- Dễ dàng render initial state từ server
- Không cần hydration phức tạp

#### 3. **Analytics & Tracking**
- Search queries nằm trong URL
- Dễ track user behavior
- Không cần thêm client-side logic

#### 4. **SEO Friendly**
- Search engines có thể index các state khác nhau
- Tốt hơn cho việc crawl và index

---

## 🛠️ 3 Hooks quan trọng của Next.js

### 1️⃣ `useSearchParams`
**Mục đích:** Đọc URL parameters

```jsx
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();

// URL: /dashboard/invoices?page=1&query=pending
console.log(searchParams.get('page'));   // "1"
console.log(searchParams.get('query'));  // "pending"
```

**Output dạng object:**
```javascript
{ page: '1', query: 'pending' }
```

---

### 2️⃣ `usePathname`
**Mục đích:** Đọc pathname hiện tại

```jsx
import { usePathname } from 'next/navigation';

const pathname = usePathname();

// URL: /dashboard/invoices?page=1
console.log(pathname);  // "/dashboard/invoices"
```

**Lưu ý:** Chỉ trả về **path**, không bao gồm query params.

---

### 3️⃣ `useRouter`
**Mục đích:** Navigate giữa các routes

```jsx
import { useRouter } from 'next/navigation';

const router = useRouter();

// Các methods phổ biến:
router.push('/dashboard');      // Navigate tới route mới
router.replace('/dashboard');   // Replace route hiện tại
router.refresh();               // Refresh page
router.back();                  // Quay lại
```

**Khác biệt `push` vs `replace`:**
- `push`: Thêm vào history stack (có thể back)
- `replace`: Thay thế URL hiện tại (không thể back)

---

## 🔍 Implement Search - 4 Bước chi tiết

### 📋 Overview của flow:
```
User nhập text → Update URL → Server fetch data → Table re-render
     (Client)      (Client)       (Server)          (Server)
```

---

### **Bước 1: Capture user input**

#### File: `/app/ui/search.tsx`

```jsx
'use client';  // ← Client Component

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Search({ placeholder }: { placeholder: string }) {
  function handleSearch(term: string) {
    console.log(term);  // In ra console để test
  }

  return (
    <div className="relative flex flex-1 shrink-0">
      <input
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);  // ← Bắt sự kiện onChange
        }}
      />
      <MagnifyingGlassIcon />
    </div>
  );
}
```

**Giải thích:**
- `'use client'` → Báo đây là Client Component
- `onChange` → Bắt mỗi lần user gõ phím
- `e.target.value` → Lấy giá trị input hiện tại

**Test:** Mở DevTools Console → Gõ vào search box → Thấy text hiển thị

---

### **Bước 2: Update URL với search params**

#### Thêm hooks và logic xử lý URL:

```jsx
'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleSearch(term: string) {
    // 1. Tạo URLSearchParams instance
    const params = new URLSearchParams(searchParams);
    
    // 2. Set hoặc delete 'query' param
    if (term) {
      params.set('query', term);      // ← Có text: thêm vào URL
    } else {
      params.delete('query');         // ← Rỗng: xóa khỏi URL
    }
    
    // 3. Update URL
    replace(`${pathname}?${params.toString()}`);
  }
  
  // ...
}
```

#### 🔬 Phân tích từng bước:

**1. URLSearchParams là gì?**
```javascript
const params = new URLSearchParams(searchParams);
```
- **Web API** để manipulate URL query parameters
- Thay vì tự tạo string `?page=1&query=a`, dùng API này tiện hơn

**2. Set/Delete logic:**
```javascript
if (term) {
  params.set('query', term);    // Thêm/update parameter
} else {
  params.delete('query');       // Xóa parameter
}
```

**Ví dụ thực tế:**
```javascript
// User gõ "Lee"
params.set('query', 'Lee');
params.toString();  // "query=Lee"

// User xóa hết
params.delete('query');
params.toString();  // ""
```

**3. Replace URL:**
```javascript
replace(`${pathname}?${params.toString()}`);
```

**Breakdown:**
- `pathname` = `/dashboard/invoices`
- `params.toString()` = `query=lee`
- Kết quả: `/dashboard/invoices?query=lee`

**Tại sao dùng `replace` thay vì `push`?**
- `replace`: Không tạo history entry mới
- Tốt cho search vì user không muốn "back" qua từng ký tự đã gõ

---

### **Bước 3: Sync URL với input field**

#### Vấn đề:
- User share link: `/dashboard/invoices?query=pending`
- Input field rỗng → **Không khớp với URL**

#### Giải pháp: `defaultValue`

```jsx
<input
  placeholder={placeholder}
  onChange={(e) => {
    handleSearch(e.target.value);
  }}
  defaultValue={searchParams.get('query')?.toString()}  // ← Đọc từ URL
/>
```

**Giải thích:**
- `searchParams.get('query')` → Lấy giá trị `query` từ URL
- `?.toString()` → Optional chaining, tránh lỗi nếu null
- `defaultValue` → Set giá trị ban đầu từ URL

---

### **Bước 4: Update table để reflect search**

#### File: `/app/dashboard/invoices/page.tsx`

```jsx
import { Suspense } from 'react';
import Table from '@/app/ui/invoices/table';

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  // 1. Await searchParams (Next.js 15+)
  const searchParams = await props.searchParams;
  
  // 2. Extract query và page
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div>
      <h1>Invoices</h1>
      <Search placeholder="Search invoices..." />
      
      {/* 3. Pass query vào Table component */}
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
```

**Quan trọng:** `key={query + currentPage}`
- Khi query hoặc page thay đổi → key thay đổi
- React re-mount component → Trigger re-fetch data
- **Đây là pattern quan trọng trong Next.js!**

---

#### File: `/app/ui/invoices/table.tsx`

```jsx
export default async function InvoicesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  // Fetch data dựa trên query và currentPage
  const invoices = await fetchFilteredInvoices(query, currentPage);
  
  return (
    <table>
      {/* Render invoices */}
    </table>
  );
}
```

---

## 🎭 Controlled vs Uncontrolled Components

### Controlled Component (dùng `value`)

```jsx
const [inputValue, setInputValue] = useState('');

<input
  value={inputValue}                        // ← React quản lý
  onChange={(e) => setInputValue(e.target.value)}
/>
```

**Đặc điểm:**
- ✅ React quản lý state
- ✅ Single source of truth
- ❌ Cần thêm useState

---

### Uncontrolled Component (dùng `defaultValue`)

```jsx
<input
  defaultValue={searchParams.get('query')?.toString()}  // ← Native quản lý
  onChange={(e) => handleSearch(e.target.value)}
/>
```

**Đặc điểm:**
- ✅ Native input tự quản lý state
- ✅ Không cần useState
- ✅ Phù hợp khi save vào URL thay vì state

**Trong trường hợp này:**
- Dùng `defaultValue` vì URL là source of truth
- Không cần state vì URL đã lưu query

---

## 🔄 Client vs Server: Khi nào dùng gì?

### Rule of Thumb:

| Component Type | Method | Lý do |
|---------------|---------|--------|
| **Client Component** | `useSearchParams()` hook | Cần access params từ client |
| **Server Component** | `searchParams` prop | Fetch data trên server |

### Ví dụ so sánh:

#### ❌ Sai: Server Component dùng hook
```jsx
// Server Component
export default function Page() {
  const searchParams = useSearchParams();  // ← LỖI! Hook chỉ dùng trong Client
  // ...
}
```

#### ✅ Đúng: Server Component dùng prop
```jsx
// Server Component
export default async function Page(props: { searchParams?: Promise<{...}> }) {
  const searchParams = await props.searchParams;  // ← OK!
  // ...
}
```

#### ✅ Đúng: Client Component dùng hook
```jsx
'use client';

export default function Search() {
  const searchParams = useSearchParams();  // ← OK!
  // ...
}
```

---

## ⚡ Debouncing - Kỹ thuật tối ưu quan trọng

### 🔴 Vấn đề: Query mỗi keystroke

```jsx
function handleSearch(term: string) {
  console.log(`Searching... ${term}`);
  // Update URL
}
```

**User gõ "Delba":**
```
Searching... D      → Query DB
Searching... De     → Query DB
Searching... Del    → Query DB
Searching... Delb   → Query DB
Searching... Delba  → Query DB
```

**Hậu quả:**
- **5 requests** cho 1 từ!
- Với 1000 users → **Quá tải database**
- Tốn bandwidth và resources

---

### ✅ Giải pháp: Debouncing

**Debouncing** là kỹ thuật giới hạn tần suất gọi function.

#### Cơ chế hoạt động:

```
User gõ "D" → Start timer (300ms)
          ↓
User gõ "e" (100ms sau) → Reset timer
          ↓
User gõ "l" (150ms sau) → Reset timer
          ↓
User gõ "b" (200ms sau) → Reset timer
          ↓
User gõ "a" (100ms sau) → Reset timer
          ↓
User dừng gõ → Chờ 300ms → EXECUTE!
```

**Kết quả:**
- Chỉ **1 request** thay vì 5
- Execute sau khi user **dừng gõ 300ms**

---

### 📦 Cài đặt thư viện

```bash
pnpm i use-debounce
```

---

### 🔧 Implement Debouncing

#### File: `/app/ui/search.tsx`

```jsx
'use client';

import { useDebouncedCallback } from 'use-debounce';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Wrap handleSearch bằng useDebouncedCallback
  const handleSearch = useDebouncedCallback((term: string) => {
    console.log(`Searching... ${term}`);
    
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);  // ← Đợi 300ms

  return (
    <input
      placeholder="Search..."
      onChange={(e) => handleSearch(e.target.value)}
      defaultValue={searchParams.get('query')?.toString()}
    />
  );
}
```

**Giải thích:**
- `useDebouncedCallback(fn, delay)` → Wrap function
- `300` → Đợi 300ms sau keystroke cuối
- Function chỉ execute khi user **ngừng gõ**

---

### 📊 So sánh trước và sau:

| Metric | Không Debounce | Có Debounce (300ms) |
|--------|----------------|---------------------|
| **User gõ "Delba"** | 5 queries | 1 query |
| **User gõ "Next.js"** | 7 queries | 1 query |
| **1000 users** | 5000-10000 queries | 1000-2000 queries |
| **Database load** | Rất cao | Tối ưu |

---

## 🎨 Flow hoàn chỉnh

### Từ keystroke đến render:

```
1. User gõ "Lee" trong search box
   └─> onChange event triggered
       
2. handleSearch("Lee") được gọi
   └─> Debounce: Đợi 300ms
       
3. (Sau 300ms) Execute:
   └─> params.set('query', 'Lee')
       └─> URL: /dashboard/invoices?query=Lee
       
4. URL thay đổi → Next.js detect
   └─> Server Component re-render
       
5. Page component nhận searchParams mới
   └─> query = "Lee"
       └─> Pass vào <Table query="Lee" />
       
6. <Table> fetch data
   └─> fetchFilteredInvoices("Lee", 1)
       └─> SELECT * FROM invoices WHERE name LIKE '%Lee%'
       
7. Table re-render với data mới
   └─> User thấy kết quả filtered
```
Tóm lại: 
User gõ “Lee” → router.replace(${pathname}?query=Lee) (client) → Next.js intercepts → gửi request Flight để lấy Server Component payload cho segment /dashboard/invoices. Server chỉ render page.tsx / invoices segment (và các suspense child nếu cần). Sau khi payload về, client reconcile DOM; InvoicesTable (server component trong segment đó) sẽ được render server-side với query="Lee" và client thấy bảng đã filter.

---

## 💡 Best Practices

### ✅ Nên làm:

1. **Dùng URL params cho search state**
   - Bookmarkable
   - Shareable
   - SEO friendly

2. **Luôn debounce search input**
   - Giảm database load
   - Tối ưu bandwidth
   - Tốt hơn cho UX

3. **Dùng đúng tool cho đúng layer**
   - Client: `useSearchParams` hook
   - Server: `searchParams` prop

4. **Uncontrolled components cho URL-backed state**
   - Dùng `defaultValue`
   - Đơn giản hơn
   - URL là source of truth

5. **Set key cho Suspense**
   ```jsx
   <Suspense key={query + currentPage} fallback={...}>
   ```
   - Trigger re-mount khi params thay đổi

---

### ❌ Không nên:

1. **Không debounce search**
   - Quá nhiều requests
   - Lãng phí resources

2. **Dùng useState cho search**
   - Mất state khi refresh
   - Không shareable
   - Khó SEO

3. **Dùng `push` thay vì `replace`**
   - History stack đầy rác
   - Back button không hoạt động tốt

---

## 🔧 Code mẫu hoàn chỉnh

### Search Component:

```jsx
'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 shrink-0">
      <label htmlFor="search" className="sr-only">Search</label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
    </div>
  );
}
```

---

### Page Component:

```jsx
import { Suspense } from 'react';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full">
      <h1>Invoices</h1>
      
      <Search placeholder="Search invoices..." />
      
      <Suspense 
        key={query + currentPage} 
        fallback={<InvoicesTableSkeleton />}
      >
        <Table query={query} currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
```

---

## 📚 Thuật ngữ quan trọng

| Thuật ngữ | Giải nghĩa | Ví dụ |
|-----------|------------|-------|
| **URL Search Params** | Parameters trong URL sau dấu `?` | `?query=lee&page=1` |
| **Debouncing** | Trì hoãn execution cho đến khi ngừng trigger | Đợi 300ms sau keystroke cuối |
| **Controlled Component** | Component với state được React quản lý | `value={state}` |
| **Uncontrolled Component** | Component tự quản lý state (native) | `defaultValue={...}` |
| **Client-side navigation** | Navigate không reload page | Next.js router |
| **URLSearchParams** | Web API để manipulate query params | `params.set('query', 'Lee')` |
| **Bookmarkable** | URL có thể save và quay lại | Share link với query |

---

## 🎯 Key Takeaways

1. **URL params > Client state** cho search functionality
2. **3 hooks cốt lõi**: `useSearchParams`, `usePathname`, `useRouter`
3. **4 bước implement search**: Capture → Update URL → Sync → Update table
4. **Luôn debounce** search input để tối ưu performance
5. **Client dùng hook, Server dùng prop** để access params
6. **Uncontrolled components** với `defaultValue` cho URL-backed state
7. **`key` prop** trong Suspense để trigger re-mount

## 🚀 Cơ chế rendering của nextjs trong Server Component
○ (Static)
- Server Component được prerender trước (build-time hoặc per-route static) → không cần request server mỗi lần.
Next.js gọi đây là Static Rendering.
- Khi nào component/route được đánh dấu Static?
- Không dùng cookies(), headers(), searchParams, server actions, no-store, cache: 'no-store', hoặc bất kỳ thứ gì làm route phải động.
- Không có fetch nào yêu cầu dynamic data.
- URL không ảnh hưởng đến render của nó (route cố định).
- Có nghĩa là:
  + HTML và RSC payload được build sẵn trong .next/
  + Next.js chỉ serve lại (từ file tĩnh hoặc cache) → cực nhanh, không chạy lại server render.

ƒ (Dynamic)
- Route must be rendered on demand by server → dynamic server render.
Chỉ khi người dùng request route đó, Next.js mới chạy lại server component để lấy dữ liệu mới.
- Khi nào route thành Dynamic?
- Chỉ cần có 1 trong những thứ sau là route bị ép thành Dynamic:
| Điều kiện                                              | Giải thích                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| `searchParams`                                         | Mỗi URL khác tạo ra render khác → dynamic                  |
| `cookies()` hoặc `headers()`                           | Phụ thuộc request runtime → dynamic                        |
| Data fetch sử dụng `cache: 'no-store'`                 | Không cache → phải fetch lại mỗi lần                       |
| Fetch từ database                                      | Hầu như luôn dynamic, trừ khi bạn bật `revalidate` rõ ràng |
| Server Action                                          | Luôn làm route dynamic                                     |
| `useEffect` trong client component **không ảnh hưởng** | Vì server components không chạy client code     

Cách để xem đâu là route động, tĩnh ta chạy lệnh pnpm run build --debug
o là tĩnh, f là động

## 🚀 Bước tiếp theo

- Implement **Pagination** với cùng pattern
- Thêm **filters** (status, date range, etc.)
- Optimize với **Server Actions** (Next.js 14+)
- Học về **Route Handlers** cho advanced use cases

