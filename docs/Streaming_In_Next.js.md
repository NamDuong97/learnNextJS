# Streaming trong Next.js

## 📌 Vấn đề cần giải quyết
Từ chương trước: **Slow data fetch khiến toàn bộ trang bị block** → Cần phương pháp để cải thiện trải nghiệm người dùng.

---

## 🌊 Streaming là gì?

### Định nghĩa
**Streaming** là kỹ thuật truyền dữ liệu cho phép chia route thành các "chunks" (mảnh) nhỏ hơn và **stream từng phần từ server về client** khi chúng sẵn sàng.

### Cơ chế hoạt động

**❌ Không có Streaming:**
```
[Chờ tất cả data] ────────────────────────────> [Hiển thị cả trang]
    (5 giây)                                         
```

**✅ Có Streaming:**
```
[SideNav] ──> [Cards] ──> [Chart] ──> [Latest Invoices]
  (ngay)      (1s)        (3s)         (2s)
```

### Lợi ích chính
✅ **Ngăn chặn blocking** - Data fetch chậm không block toàn bộ trang  
✅ **Progressive rendering** - User thấy và tương tác với các phần sẵn sàng trước  
✅ **Interruptable navigation** - User có thể navigate đi nơi khác mà không cần đợi  

---

## 🛠️ 2 Cách Implement Streaming

### 1️⃣ Page-Level: Dùng `loading.tsx`

#### Cách hoạt động
- Tạo file `loading.tsx` trong folder `/app/dashboard/`
- Next.js tự động tạo `<Suspense>` boundary cho toàn bộ page

#### Ví dụ đơn giản
```jsx
// /app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

#### Ví dụ với Loading Skeleton
```jsx
// /app/dashboard/loading.tsx
import DashboardSkeleton from '@/app/ui/skeletons';

export default function Loading() {
  return <DashboardSkeleton />;
}
```

**Loading Skeleton** là gì?
> Phiên bản UI đơn giản hóa, dùng làm placeholder để báo cho user rằng nội dung đang load.

**Ưu điểm:**
- `<SideNav>` (static) hiển thị ngay lập tức
- User có thể tương tác với SideNav trong khi dynamic content đang load

---

### 2️⃣ Component-Level: Dùng `<Suspense>`

#### Cơ chế
- Import `Suspense` từ React
- Wrap từng component cần stream
- Cung cấp `fallback` UI cho mỗi component

#### Ví dụ chi tiết

**Bước 1: Di chuyển data fetch vào component**
```jsx
// /app/ui/dashboard/revenue-chart.tsx
import { fetchRevenue } from '@/app/lib/data';

export default async function RevenueChart() {
  const revenue = await fetchRevenue(); // Fetch ở đây, không ở page
  
  return (
    // ... render chart
  );
}
```

**Bước 2: Wrap component bằng Suspense**
```jsx
// /app/dashboard/(overview)/page.tsx
import { Suspense } from 'react';
import { RevenueChartSkeleton } from '@/app/ui/skeletons';

export default async function Page() {
  return (
    <main>
      <h1>Dashboard</h1>
      
      {/* Component được stream riêng biệt */}
      <Suspense fallback={<RevenueChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      
      {/* Phần khác của trang */}
    </main>
  );
}
```

**Kết quả:**
- Trang hiển thị ngay lập tức
- `<RevenueChartSkeleton>` hiển thị trong khi data đang load
- Khi data sẵn sàng, skeleton được thay thế bằng chart thực

---

## 📁 Route Groups - Tổ chức File

### Vấn đề
`loading.tsx` ở level cao hơn sẽ áp dụng cho TẤT CẢ các trang con (invoices, customers, etc.)

### Giải pháp: Route Groups

#### Cú pháp
```
/dashboard/
  ├── (overview)/        ← Tên trong ngoặc đơn
  │   ├── page.tsx       
  │   └── loading.tsx    ← Chỉ áp dụng cho overview
  ├── invoices/
  │   └── page.tsx       ← Không bị ảnh hưởng
  └── customers/
      └── page.tsx       ← Không bị ảnh hưởng
```

#### Đặc điểm
- Tên folder trong `()` **KHÔNG xuất hiện trong URL**
- `/dashboard/(overview)/page.tsx` → URL: `/dashboard`
- Dùng để tổ chức logic mà không ảnh hưởng routing

#### Use cases
- Tách section: `(marketing)`, `(shop)`
- Tổ chức theo team trong app lớn
- Áp dụng layout/loading riêng cho từng nhóm

---

## 🎯 Grouping Components - Kỹ thuật nâng cao

### Vấn đề: "Popping Effect"
Nếu stream từng Card riêng lẻ → Cards xuất hiện từng cái một → **Gây jarring** (khó chịu) cho user

### Giải pháp: Wrapper Component

#### Trước khi group:
```jsx
<Suspense fallback={<CardSkeleton />}>
  <Card title="Collected" />
</Suspense>
<Suspense fallback={<CardSkeleton />}>
  <Card title="Pending" />
</Suspense>
// → Cards xuất hiện lẻ tẻ
```

#### Sau khi group:
```jsx
// /app/dashboard/(overview)/page.tsx
<Suspense fallback={<CardsSkeleton />}>
  <CardWrapper />  {/* Wrap tất cả cards */}
</Suspense>
```

```jsx
// /app/ui/dashboard/cards.tsx
export default async function CardWrapper() {
  const { numberOfInvoices, numberOfCustomers, ... } = await fetchCardData();
  
  return (
    <>
      <Card title="Collected" value={totalPaidInvoices} />
      <Card title="Pending" value={totalPendingInvoices} />
      <Card title="Total Invoices" value={numberOfInvoices} />
      <Card title="Total Customers" value={numberOfCustomers} />
    </>
  );
}
```

**Hiệu ứng:**
- Tất cả Cards load cùng lúc
- Tạo "staggered effect" (hiệu ứng phân tầng) cho trang

---

## 🎨 Quyết định vị trí Suspense Boundaries

### 3 Chiến lược chính

#### 1. Stream toàn bộ trang (`loading.tsx`)
```jsx
// /app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}
```
**Ưu:** Đơn giản, dễ implement  
**Nhược:** Nếu 1 component chậm → toàn trang chậm  

---

#### 2. Stream từng component riêng lẻ
```jsx
<Suspense fallback={<ChartSkeleton />}>
  <RevenueChart />
</Suspense>
<Suspense fallback={<InvoicesSkeleton />}>
  <LatestInvoices />
</Suspense>
```
**Ưu:** Granular control, flexible  
**Nhược:** UI có thể "pop" nhiều lần  

---

#### 3. Stream theo sections/groups
```jsx
<Suspense fallback={<CardsSkeleton />}>
  <CardWrapper />
</Suspense>
<Suspense fallback={<ChartSkeleton />}>
  <RevenueChart />
</Suspense>
```
**Ưu:** Cân bằng giữa performance và UX  
**Nhược:** Cần tạo wrapper components  

---

## ✅ Best Practices

### 📍 Nguyên tắc chung
> **"Move data fetches down to the components that need it"**

### Quy trình đề xuất:
1. **Xác định data fetch chậm** → Cô lập chúng
2. **Di chuyển fetch xuống component** → Fetch tại nơi cần dùng
3. **Wrap component bằng Suspense** → Cung cấp fallback UI
4. **Group components hợp lý** → Tránh popping effect

### Câu hỏi cần trả lời:
- User mong đợi trải nghiệm như thế nào khi page load?
- Content nào cần ưu tiên hiển thị trước?
- Components có phụ thuộc lẫn nhau không?

### ⚠️ Lưu ý
- **Không có câu trả lời đúng tuyệt đối** - Phụ thuộc vào từng ứng dụng
- **Đừng ngại thử nghiệm** - Suspense là API mạnh mẽ
- **Test với người dùng thật** - Để biết phương án nào tốt nhất

---

## 📊 So sánh các phương pháp

| Phương pháp | Level | Độ phức tạp | Kiểm soát | Use case |
|-------------|-------|-------------|-----------|----------|
| `loading.tsx` | Page | Thấp ⭐ | Thấp | Toàn bộ trang cần load cùng lúc |
| `<Suspense>` riêng lẻ | Component | Cao ⭐⭐⭐ | Cao | Từng phần độc lập |
| Wrapper + Suspense | Group | Trung bình ⭐⭐ | Trung bình | Nhóm components liên quan |

---

## 🔄 Flow thực tế

### Ví dụ Dashboard hoàn chỉnh:

```jsx
export default async function Page() {
  return (
    <main>
      {/* 1. Static content - hiển thị ngay */}
      <h1>Dashboard</h1>
      
      {/* 2. Cards - load cùng nhau */}
      <Suspense fallback={<CardsSkeleton />}>
        <CardWrapper />
      </Suspense>
      
      {/* 3. Chart - load độc lập (chậm nhất) */}
      <Suspense fallback={<RevenueChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      
      {/* 4. Latest Invoices - load độc lập */}
      <Suspense fallback={<LatestInvoicesSkeleton />}>
        <LatestInvoices />
      </Suspense>
    </main>
  );
}
```

**Timeline:**
```
0s:  ✅ Header, SideNav (static)
1s:  ✅ Cards (nhóm 4 cards)
2s:  ✅ Latest Invoices
3s:  ✅ Revenue Chart (chậm nhất)
```

---

## 💡 Key Takeaways

1. **Streaming ngăn blocking** - Data fetch chậm không làm đơ trang
2. **2 cách implement** - Page-level (`loading.tsx`) và Component-level (`<Suspense>`)
3. **Route Groups** - Tổ chức file không ảnh hưởng URL
4. **Grouping components** - Tránh popping effect
5. **Di chuyển fetch xuống component** - Best practice chung
6. **Thử nghiệm là chìa khóa** - Không có giải pháp one-size-fits-all

---

## 🎓 Thuật ngữ quan trọng

| Thuật ngữ | Giải nghĩa |
|-----------|------------|
| **Streaming** | Chia nhỏ và gửi dần dần từ server về client |
| **Chunk** | Mảnh/phần nhỏ của route |
| **Loading Skeleton** | UI placeholder khi đang load |
| **Fallback** | UI thay thế tạm thời |
| **Suspense Boundary** | Điểm đặt `<Suspense>` để wrap component |
| **Route Groups** | Folder `(name)` để tổ chức không ảnh hưởng URL |
| **Popping Effect** | UI xuất hiện rời rạc gây khó chịu |
| **Staggered Effect** | Hiệu ứng phân tầng, load theo nhóm |

---

## 🚀 Bước tiếp theo
Học cách thêm **search và pagination** vào dashboard sử dụng Next.js APIs.