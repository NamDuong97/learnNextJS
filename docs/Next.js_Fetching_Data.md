# Next.js - Fetching Data

## 📌 TỔNG QUAN

Next.js cung cấp nhiều cách để fetch data, trong đó **React Server Components** cho phép query database trực tiếp từ server một cách an toàn.

---

## 1️⃣ CÁC CÁCH FETCH DATA

### 🔹 API Layer

**Định nghĩa:** Lớp trung gian giữa application code và database.

**Khi nào dùng:**
- ✅ Sử dụng third-party services có API
- ✅ Fetch data từ client (cần API layer trên server để bảo mật)
- ✅ Tạo API endpoints với Route Handlers

**Cấu trúc:**

```
Client → API Layer (Server) → Database
         ↑
         Bảo vệ database secrets
```

**Ví dụ:**

```tsx
// app/api/invoices/route.ts
export async function GET() {
  const data = await sql`SELECT * FROM invoices`;
  return Response.json(data);
}

// Client fetch
const res = await fetch('/api/invoices');
const data = await res.json();
```

---

### 🔹 Database Queries (ORM/SQL)

**Định nghĩa:** Viết logic để tương tác trực tiếp với database.

**Khi nào dùng:**
- ✅ Tạo API endpoints
- ✅ Sử dụng React Server Components (fetch trên server)

**2 cách tiếp cận:**

| ORM (Object-Relational Mapping) | SQL (Raw Queries) |
|--------------------------------|-------------------|
| Prisma, Drizzle, TypeORM | postgres.js, pg |
| Type-safe, auto-completion | Linh hoạt, hiệu suất tốt |
| Generate SQL tự động | Viết SQL trực tiếp |
| Dễ học | Cần biết SQL |

---

### ⚠️ KHI NÀO KHÔNG NÊN QUERY TRỰC TIẾP DATABASE?

```tsx
// ❌ KHÔNG làm thế này - Fetch data từ CLIENT
'use client';

export default function InvoicesList() {
  const data = await sql`SELECT * FROM invoices`;
  // ↑ LỖI: Lộ database credentials cho client!
  
  return <div>...</div>;
}

// ✅ ĐÚNG - Fetch từ SERVER hoặc qua API
export default async function InvoicesList() {
  const data = await sql`SELECT * FROM invoices`;
  // ↑ OK: Server Component, không lộ credentials
  
  return <div>...</div>;
}
```

**Rule:**
- ❌ **Client-side:** Phải dùng API Layer
- ✅ **Server-side:** Có thể query trực tiếp

---

## 2️⃣ REACT SERVER COMPONENTS

### Định nghĩa:
Components chạy trên server, mặc định trong Next.js App Router.

### ✅ Lợi ích:

**1. Support Promises natively:**
```tsx
// ✅ Server Component - Dùng async/await trực tiếp
export default async function Page() {
  const data = await fetchData();  // ← OK, không cần useEffect
  
  return <div>{data}</div>;
}

// ❌ Client Component - Phải dùng useEffect + useState
'use client';

export default function Page() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{data}</div>;
}
```

**2. Logic và data fetching trên server:**
```
Server Component
    ↓
Fetch data + Process logic (trên server)
    ↓
Gửi chỉ kết quả (HTML) về client
    ↓
Client nhận: Nhanh hơn, ít JavaScript hơn
```

**3. Query database trực tiếp:**
```tsx
// ✅ Không cần API layer
import { sql } from '@/lib/postgres';

export default async function Page() {
  const invoices = await sql`SELECT * FROM invoices`;
  
  return <InvoiceList invoices={invoices} />;
}
```

---

### 📊 So sánh Client Component vs Server Component:

| Feature | Client Component | Server Component |
|---------|-----------------|------------------|
| **Chạy ở đâu** | Browser | Server |
| **async/await** | ❌ Cần useEffect | ✅ Native support |
| **Database access** | ❌ Không (qua API) | ✅ Trực tiếp |
| **Bundle size** | Tăng (ship JS) | Giảm (chỉ HTML) |
| **Directive** | `'use client'` | Mặc định |

---

## 3️⃣ SỬ DỤNG SQL

### Tại sao dùng SQL?

1. **Tiêu chuẩn ngành:** ORM cũng generate SQL
2. **Hiểu cơ bản database:** Áp dụng cho nhiều tools
3. **Linh hoạt:** Fetch và manipulate dữ liệu cụ thể
4. **Bảo mật:** postgres.js có SQL injection protection

---

### Setup:

```tsx
// app/lib/data.ts
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchInvoices() {
  const data = await sql`SELECT * FROM invoices`;
  return data;
}
```

---

### Ví dụ SQL queries:

**Query 1: Fetch tất cả invoices**
```tsx
const invoices = await sql`
  SELECT * FROM invoices
  ORDER BY date DESC
`;
```

**Query 2: Fetch 5 invoices mới nhất**
```tsx
const latestInvoices = await sql`
  SELECT invoices.amount, customers.name, customers.image_url
  FROM invoices
  JOIN customers ON invoices.customer_id = customers.id
  ORDER BY invoices.date DESC
  LIMIT 5
`;
```

**Query 3: Count và aggregate**
```tsx
const stats = await sql`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
  FROM invoices
`;
```

---

### 💡 SQL vs JavaScript Processing

**❌ Không tối ưu - Xử lý trên JavaScript:**
```tsx
// Fetch TẤT CẢ invoices
const allInvoices = await sql`SELECT * FROM invoices`;

// Sort và filter trên JS
const latestInvoices = allInvoices
  .sort((a, b) => b.date - a.date)
  .slice(0, 5);

// Vấn đề:
// - Transfer toàn bộ data (có thể hàng MB)
// - Client phải process (chậm)
// - Tốn bandwidth
```

**✅ Tối ưu - Xử lý trên Database:**
```tsx
// Fetch CHỈ 5 invoices cần thiết
const latestInvoices = await sql`
  SELECT * FROM invoices
  ORDER BY date DESC
  LIMIT 5
`;

// Lợi ích:
// - Transfer ít data hơn
// - Database xử lý (nhanh hơn)
// - Tiết kiệm bandwidth
```

---

## 4️⃣ FETCH DATA CHO DASHBOARD

### Page Structure:

```tsx
// app/dashboard/page.tsx
import { Card } from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { 
  fetchRevenue, 
  fetchLatestInvoices,
  fetchCardData 
} from '@/app/lib/data';

export default async function Page() {
  // Fetch data trên server
  const revenue = await fetchRevenue();
  const latestInvoices = await fetchLatestInvoices();
  const {
    numberOfInvoices,
    numberOfCustomers,
    totalPaidInvoices,
    totalPendingInvoices,
  } = await fetchCardData();

  return (
    <main>
      <h1>Dashboard</h1>
      
      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Collected" value={totalPaidInvoices} type="collected" />
        <Card title="Pending" value={totalPendingInvoices} type="pending" />
        <Card title="Total Invoices" value={numberOfInvoices} type="invoices" />
        <Card title="Total Customers" value={numberOfCustomers} type="customers" />
      </div>
      
      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <RevenueChart revenue={revenue} />
        <LatestInvoices latestInvoices={latestInvoices} />
      </div>
    </main>
  );
}
```

---

### Data Fetching Functions:

```tsx
// app/lib/data.ts

// 1. Fetch revenue data
export async function fetchRevenue() {
  const data = await sql`
    SELECT month, revenue 
    FROM revenue
    ORDER BY month
  `;
  return data;
}

// 2. Fetch latest 5 invoices
export async function fetchLatestInvoices() {
  const data = await sql`
    SELECT invoices.amount, customers.name, customers.image_url, customers.email
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    ORDER BY invoices.date DESC
    LIMIT 5
  `;
  return data;
}

// 3. Fetch card statistics
export async function fetchCardData() {
  const invoiceCount = await sql`SELECT COUNT(*) FROM invoices`;
  const customerCount = await sql`SELECT COUNT(*) FROM customers`;
  const invoiceStatus = await sql`
    SELECT
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
    FROM invoices
  `;
  
  return {
    numberOfCustomers: customerCount[0].count,
    numberOfInvoices: invoiceCount[0].count,
    totalPaidInvoices: invoiceStatus[0].paid,
    totalPendingInvoices: invoiceStatus[0].pending,
  };
}
```

---

## 5️⃣ REQUEST WATERFALLS

### Định nghĩa:
Chuỗi các network requests phụ thuộc vào việc hoàn thành request trước đó.

### ❌ Vấn đề - Sequential Fetching:

```tsx
export default async function Page() {
  const revenue = await fetchRevenue();                // ← 1. Chờ 2s
  const latestInvoices = await fetchLatestInvoices();  // ← 2. Chờ 1s (sau khi 1 xong)
  const cardData = await fetchCardData();              // ← 3. Chờ 1.5s (sau khi 2 xong)
  
  // Tổng: 2s + 1s + 1.5s = 4.5s ⏱️
}
```

**Timeline:**
```
0s ────────────── 2s ─── 3s ──── 4.5s
    fetchRevenue()  ↓     ↓        ↓
                    fetchLatestInvoices()
                              ↓
                              fetchCardData()

Total: 4.5 seconds ⏰
```

---

### Khi nào Waterfall pattern hợp lý?

**✅ Trường hợp cần dependency:**

```tsx
// Use case: Fetch user trước, sau đó fetch posts của user
const user = await fetchUser(userId);           // ← Bước 1: Lấy user
const posts = await fetchUserPosts(user.id);    // ← Bước 2: Cần user.id từ bước 1

// Use case: Fetch category trước, sau đó fetch products
const category = await fetchCategory(slug);           // ← Bước 1
const products = await fetchProductsByCategory(category.id);  // ← Bước 2
```

**❌ Trường hợp KHÔNG cần dependency:**

```tsx
// 3 requests này KHÔNG phụ thuộc lẫn nhau!
const revenue = await fetchRevenue();
const latestInvoices = await fetchLatestInvoices();
const cardData = await fetchCardData();
// → Nên fetch song song!
```

---

## 6️⃣ PARALLEL DATA FETCHING

### Giải pháp: `Promise.all()`

**✅ Fetch song song:**

```tsx
export default async function Page() {
  // Khởi tạo tất cả promises cùng lúc
  const data = await Promise.all([
    fetchRevenue(),          // ← Chạy song song
    fetchLatestInvoices(),   // ← Chạy song song
    fetchCardData(),         // ← Chạy song song
  ]);
  
  const [revenue, latestInvoices, cardData] = data;
  
  // Tổng: max(2s, 1s, 1.5s) = 2s ⏱️
}
```

**Timeline:**
```
0s ────────────── 2s
    fetchRevenue()         ✓
    fetchLatestInvoices()  ✓
    fetchCardData()        ✓

Total: 2 seconds ⚡ (Nhanh hơn 2.25 lần!)
```

---

### Cách implement trong functions:

```tsx
// app/lib/data.ts
export async function fetchCardData() {
  try {
    // Khởi tạo promises (không await ngay)
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
      FROM invoices
    `;

    // Chờ TẤT CẢ promises hoàn thành cùng lúc
    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    return {
      numberOfInvoices: data[0].rows[0].count,
      numberOfCustomers: data[1].rows[0].count,
      totalPaidInvoices: data[2].rows[0].paid,
      totalPendingInvoices: data[2].rows[0].pending,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}
```

---

### `Promise.all()` vs `Promise.allSettled()`

| Feature | `Promise.all()` | `Promise.allSettled()` |
|---------|----------------|----------------------|
| **Behavior** | Fail nếu 1 promise reject | Luôn resolve với tất cả results |
| **Error handling** | Throw ngay khi có lỗi | Trả về status của từng promise |
| **Use case** | Tất cả requests phải thành công | Một số requests có thể fail |

**Ví dụ:**

```tsx
// Promise.all() - All or nothing
try {
  const [data1, data2, data3] = await Promise.all([
    fetchData1(),  // ← Nếu fail → throw error
    fetchData2(),
    fetchData3(),
  ]);
} catch (error) {
  // Một trong 3 fail → vào đây
}

// Promise.allSettled() - Lấy kết quả từng cái
const results = await Promise.allSettled([
  fetchData1(),
  fetchData2(),
  fetchData3(),
]);

results.forEach((result) => {
  if (result.status === 'fulfilled') {
    console.log('Success:', result.value);
  } else {
    console.log('Failed:', result.reason);
  }
});
```

---

### ⚠️ Nhược điểm của Parallel Fetching:

**Vấn đề: Slow Request Block Tất Cả**

```tsx
const data = await Promise.all([
  fetchRevenue(),          // ← 0.5s
  fetchLatestInvoices(),   // ← 0.3s
  fetchSlowData(),         // ← 10s ⏰ (CHẬM!)
]);

// Kết quả: Phải đợi 10s dù 2 requests kia đã xong!
// User nhìn blank screen 10s
```

**Giải pháp: Streaming & Suspense** (chương tiếp theo)

---

## 7️⃣ BEST PRACTICES

### ✅ NÊN:

```tsx
// 1. Dùng Server Components cho data fetching
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// 2. Fetch song song khi không có dependency
const [data1, data2] = await Promise.all([
  fetchData1(),
  fetchData2(),
]);

// 3. Dùng SQL để filter/sort ở database
const data = await sql`
  SELECT * FROM invoices 
  WHERE status = 'paid'
  ORDER BY date DESC
  LIMIT 10
`;

// 4. Organize data fetching functions trong 1 file
// app/lib/data.ts
export async function fetchInvoices() { ... }
export async function fetchCustomers() { ... }
```

---

### ❌ KHÔNG NÊN:

```tsx
// 1. KHÔNG fetch từ Client Component (lộ credentials)
'use client';
export default function Page() {
  const data = await sql`SELECT * FROM invoices`; // ❌
}

// 2. KHÔNG fetch tất cả rồi filter bằng JS
const allData = await sql`SELECT * FROM invoices`;
const filtered = allData.filter(x => x.status === 'paid'); // ❌
// → Dùng WHERE clause trong SQL

// 3. KHÔNG tạo waterfall không cần thiết
const data1 = await fetch1(); // ❌
const data2 = await fetch2(); // ← Không phụ thuộc data1 nhưng phải đợi
// → Dùng Promise.all()

// 4. KHÔNG để data fetching logic rải rác
// Tập trung vào app/lib/data.ts
```

---

## 8️⃣ TỔNG HỢP FLOW

```
┌─────────────────────────────────────────────────────────────┐
│  1. User truy cập /dashboard                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Next.js render Server Component (Page)                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Execute async function                                   │
│     - await fetchRevenue()                                   │
│     - await fetchLatestInvoices()                            │
│     - await fetchCardData()                                  │
│                                                               │
│     Option A: Sequential (Waterfall) - Chậm ❌              │
│     Option B: Parallel (Promise.all) - Nhanh ✅             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Query Database (postgres.js)                             │
│     - SELECT revenue...                                      │
│     - SELECT invoices...                                     │
│     - SELECT COUNT(*)...                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Process data on Server                                   │
│     - Format, calculate, transform                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Render Components với data                               │
│     - <Card />                                               │
│     - <RevenueChart />                                       │
│     - <LatestInvoices />                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Gửi HTML về Client (không lộ database secrets)          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Client nhận và render UI                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 TỔNG KẾT

### **Core Concepts:**

1. **3 cách fetch data:**
   - API Layer: Client → API → Database
   - Direct Query: Server Component → Database
   - Hybrid: Combine cả 2

2. **Server Components:**
   - Fetch data trên server
   - Không cần API layer
   - Bảo mật credentials
   - Support async/await native

3. **SQL:**
   - Fetch dữ liệu cụ thể (không fetch all)
   - Process ở database (nhanh hơn JS)
   - Protect SQL injection

4. **Request Waterfalls:**
   - Sequential = Chậm
   - Chỉ dùng khi có dependency
   - Tránh khi không cần thiết

5. **Parallel Fetching:**
   - `Promise.all()` cho independent requests
   - Nhanh hơn nhiều
   - Nhược điểm: Slow request block tất cả

---

### **Comparison Table:**

| Approach | Speed | Security | Use Case |
|----------|-------|----------|----------|
| **Sequential** | ⭐⭐ | ⭐⭐⭐⭐⭐ | Dependent requests |
| **Parallel** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Independent requests |
| **Client Fetch** | ⭐⭐⭐ | ⚠️ Không an toàn | Public data only |
| **Server Fetch** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Private data |

---

### **Performance Comparison:**

```
Sequential (Waterfall):
fetchA (2s) → fetchB (1s) → fetchC (1.5s)
Total: 4.5s ⏱️

Parallel (Promise.all):
fetchA (2s) ┐
fetchB (1s) ├─→ All complete at 2s
fetchC (1.5s)┘
Total: 2s ⚡ (Nhanh hơn 2.25x)
```

---

### **Key Takeaways:**

1. **Server Components > Client Components** cho data fetching
2. **SQL filtering > JavaScript filtering** cho performance
3. **Parallel > Sequential** khi requests độc lập
4. **Direct database access** an toàn trong Server Components
5. **`Promise.all()`** giảm latency đáng kể

---

### **Next Steps:**

Trong chương tiếp theo, chúng ta sẽ học về:
- ⏳ **Streaming**: Load từng phần thay vì đợi tất cả
- 🔄 **Suspense**: Show loading states cho từng component
- 🎨 **Loading Skeletons**: Improve UX khi fetch data

---

**Remember: Fetch smart, not hard! 🚀**

Server Components + SQL + Parallel Fetching = Fast & Secure! 💪