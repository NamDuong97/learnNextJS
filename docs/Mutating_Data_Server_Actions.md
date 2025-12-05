# Mutating Data với Server Actions

## 📌 Mục tiêu chương này
Học cách **tạo, cập nhật và xóa dữ liệu** (CRUD operations) sử dụng **React Server Actions** trong Next.js.

---

## 🚀 Server Actions là gì?

### Định nghĩa
**React Server Actions** cho phép chạy **asynchronous code trực tiếp trên server**. 

### So sánh với cách truyền thống:

#### ❌ Cách cũ: API Routes
```typescript
// 1. Tạo API endpoint
// /pages/api/invoices.ts
export default async function handler(req, res) {
  const data = req.body;
  await db.insert(data);
  res.json({ success: true });
}

// 2. Call từ client
fetch('/api/invoices', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

**Nhược điểm:**
- Phải tạo API endpoint riêng
- Cần handle request/response
- Phức tạp hơn cho simple operations

---

#### ✅ Cách mới: Server Actions
```typescript
// Server Action
async function createInvoice(formData: FormData) {
  'use server';
  
  // Logic xử lý trực tiếp
  await db.insert(...);
}

// Sử dụng trong form
<form action={createInvoice}>
  {/* form fields */}
</form>
```

**Ưu điểm:**
- ✅ Không cần tạo API endpoints
- ✅ Code đơn giản, dễ hiểu
- ✅ Tự động handle FormData
- ✅ Progressive enhancement (form hoạt động kể cả khi JS chưa load)
- ✅ Built-in security features

---

### 🔒 Security Features
Server Actions có nhiều tính năng bảo mật built-in:

1. **Encrypted closures** - Mã hóa các closures
2. **Strict input checks** - Kiểm tra input nghiêm ngặt
3. **Error message hashing** - Hash error messages
4. **Host restrictions** - Giới hạn hosts
5. **CSRF protection** - Bảo vệ chống CSRF attacks

---

## 📝 Forms với Server Actions

### Cách hoạt động

```jsx
// Server Component
export default function Page() {
  // 1. Define Server Action
  async function create(formData: FormData) {
    'use server';  // ← Đánh dấu là Server Action
    
    // Logic mutate data
    const name = formData.get('name');
    await db.insert({ name });
  }
  
  // 2. Invoke qua action attribute
  return (
    <form action={create}>
      <input name="name" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Progressive Enhancement

**Ưu điểm quan trọng:**
> Forms vẫn hoạt động ngay cả khi JavaScript chưa load hoặc fail!

**Ví dụ:**
- User ở vùng có internet chậm
- JavaScript bundle lớn, chưa download xong
- JavaScript bị lỗi → Form vẫn submit được bằng native HTML form submission

---

## 🎯 CREATE Invoice - 6 Bước chi tiết

### **Bước 1: Tạo route và form**

#### Cấu trúc folder:
```
/app/dashboard/invoices/
  ├── page.tsx
  ├── create/
  │   └── page.tsx           ← New route
  └── [id]/
      └── edit/
          └── page.tsx
```

#### File: `/app/dashboard/invoices/create/page.tsx`

```jsx
import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';

export default async function Page() {
  // Fetch customers cho dropdown
  const customers = await fetchCustomers();
  
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          { label: 'Create Invoice', href: '/dashboard/invoices/create', active: true },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}
```

**Giải thích:**
- Page là **Server Component** → Có thể fetch data trực tiếp
- Pass `customers` vào `<Form>` để hiển thị dropdown

---

### **Bước 2: Tạo Server Action**

#### File: `/app/lib/actions.ts`

```typescript
'use server';  // ← Đánh dấu tất cả exported functions là Server Actions

export async function createInvoice(formData: FormData) {
  // Logic sẽ thêm sau
}
```

**Important:** `'use server'` directive
- Đặt ở **đầu file** → Tất cả exports là Server Actions
- Hoặc đặt **trong function** → Chỉ function đó là Server Action
- Functions không dùng sẽ **tự động bị remove** khỏi bundle

---

#### Sử dụng action trong form:

#### File: `/app/ui/invoices/create-form.tsx`

```jsx
import { createInvoice } from '@/app/lib/actions';

export default function Form({ customers }: { customers: CustomerField[] }) {
  return (
    <form action={createInvoice}>  {/* ← Pass function reference */}
      <select name="customerId">
        {customers.map(customer => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>
      
      <input name="amount" type="number" placeholder="Enter amount" />
      
      <div>
        <input type="radio" name="status" value="pending" /> Pending
        <input type="radio" name="status" value="paid" /> Paid
      </div>
      
      <button type="submit">Create Invoice</button>
    </form>
  );
}
```

**Behind the scenes:**
- Server Actions tự động tạo **POST API endpoint**
- Không cần manually create API routes!

---

### **Bước 3: Extract data từ FormData**

#### File: `/app/lib/actions.ts`

```typescript
'use server';

export async function createInvoice(formData: FormData) {
  // Method 1: .get() cho từng field
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };
  
  // Test: Log ra terminal (server-side)
  console.log(rawFormData);
}
```

**Alternative:** Nhiều fields? Dùng `Object.fromEntries()`

```typescript
// Method 2: Dùng entries() cho nhiều fields
const rawFormData = Object.fromEntries(formData.entries());
```

**Lưu ý:**
- `console.log` sẽ xuất hiện ở **terminal**, không phải browser console
- Vì code chạy trên **server**!

---

### **Bước 4: Validate và prepare data**

#### 🎯 Vấn đề: Type coercion

```jsx
<input name="amount" type="number" />
```

**Surprise:**
```typescript
console.log(typeof formData.get('amount'));  // "string" 😱
```

**Tại sao?**
- HTML input với `type="number"` vẫn trả về **string**!
- Cần convert sang number trước khi lưu database

---

#### ✅ Giải pháp: Zod validation

**Zod** là TypeScript-first validation library.

#### Install:
```bash
pnpm i zod
```

#### Define schema:

```typescript
'use server';

import { z } from 'zod';

// 1. Define schema khớp với database
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),        // ← Tự động convert string → number
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// 2. Omit các fields sẽ tự generate
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // 3. Parse và validate
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  
  // Giờ 'amount' đã là number! ✅
}
```

**Giải thích Zod:**
- `z.string()` → Phải là string
- `z.coerce.number()` → Convert sang number + validate
- `z.enum([...])` → Chỉ chấp nhận các values cho phép
- `.parse()` → Validate và throw error nếu invalid

---

#### 💰 Store monetary values in cents

**Best Practice:** Lưu tiền tệ bằng **cents** trong database

**Tại sao?**
- ❌ JavaScript floating-point errors: `0.1 + 0.2 = 0.30000000000000004`
- ✅ Integers chính xác tuyệt đối
- ✅ Không bị rounding errors

```typescript
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({...});
  
  // Convert dollars → cents
  const amountInCents = amount * 100;  // $10.50 → 1050 cents
}
```

---

#### 📅 Tạo date hiện tại

```typescript
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({...});
  const amountInCents = amount * 100;
  
  // Tạo date format: "YYYY-MM-DD"
  const date = new Date().toISOString().split('T')[0];
  // "2025-12-05T14:30:00.000Z" → "2025-12-05"
}
```

**Breakdown:**
- `new Date()` → Current datetime
- `.toISOString()` → "2025-12-05T14:30:00.000Z"
- `.split('T')[0]` → Lấy phần date: "2025-12-05"

---

### **Bước 5: Insert vào database**

```typescript
'use server';

import { z } from 'zod';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// ... schemas ...

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({...});
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
  // SQL query với template literals
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
}
```

**Lưu ý:**
- Dùng **parameterized queries** → Tự động escape, tránh SQL injection
- `await` vì query là async operation

---

### **Bước 6: Revalidate cache và redirect**

#### 🗄️ Next.js Client Router Cache

**Vấn đề:**
- Next.js cache route segments trong browser
- Data mới insert nhưng UI vẫn hiển thị data cũ!

**Giải pháp:** `revalidatePath()`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createInvoice(formData: FormData) {
  // ... validation ...
  // ... insert data ...
  
  // 1. Clear cache cho route này
  revalidatePath('/dashboard/invoices');
  
  // 2. Redirect user về invoices page
  redirect('/dashboard/invoices');
}
```

**Flow hoàn chỉnh:**
```
Submit form → Insert DB → revalidatePath() → redirect()
                              ↓                   ↓
                        Clear cache         Navigate to /invoices
                              ↓                   ↓
                        Fetch fresh data    Hiển thị data mới
```

---

## 🔄 UPDATE Invoice - 4 Bước

### **Bước 1: Tạo dynamic route với ID**

#### Cấu trúc folder:
```
/app/dashboard/invoices/
  └── [id]/              ← Dynamic segment
      └── edit/
          └── page.tsx
```

**URL sẽ là:**
- `/dashboard/invoices/123e4567-e89b.../edit`
- `[id]` → Placeholder cho bất kỳ giá trị nào

---

#### Link tới edit page:

#### File: `/app/ui/invoices/buttons.tsx`

```tsx
import { PencilIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function UpdateInvoice({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}  // ← Template literal
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}
```

---

### **Bước 2: Read ID từ page params**

#### File: `/app/dashboard/invoices/[id]/edit/page.tsx`

```tsx
import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';

export default async function Page(props: { 
  params: Promise<{ id: string }> 
}) {
  // 1. Await params (Next.js 15+)
  const params = await props.params;
  const id = params.id;
  
  // 2. Fetch data parallel
  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);
  
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          { label: 'Edit Invoice', href: `/dashboard/invoices/${id}/edit`, active: true },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}
```

**Giải thích:**
- `params` → Object chứa dynamic route parameters
- `params.id` → Giá trị của `[id]` trong URL
- `Promise.all()` → Fetch 2 queries song song, nhanh hơn

---

### **Bước 3: Pre-populate form**

Form sẽ tự động điền data có sẵn:

```tsx
// /app/ui/invoices/edit-form.tsx
export default function EditInvoiceForm({ invoice, customers }) {
  return (
    <form>
      <select name="customerId" defaultValue={invoice.customer_id}>
        {customers.map(...)}
      </select>
      
      <input 
        name="amount" 
        type="number" 
        defaultValue={invoice.amount / 100}  // Convert cents → dollars
      />
      
      <input 
        type="radio" 
        name="status" 
        value="pending"
        defaultChecked={invoice.status === 'pending'}
      />
      <input 
        type="radio" 
        name="status" 
        value="paid"
        defaultChecked={invoice.status === 'paid'}
      />
    </form>
  );
}
```

---

### **Bước 4: Pass ID vào Server Action**

#### ❌ Không thể làm thế này:

```tsx
<form action={updateInvoice(id)}>  {/* ← Sai! */}
```

**Tại sao?**
- `action` expects một **function reference**
- `updateInvoice(id)` gọi function ngay lập tức → trả về result, không phải function

---

#### ✅ Dùng `.bind()` method

**`.bind()` là gì?**
> JavaScript method để tạo function mới với `this` và arguments được bind sẵn.

```tsx
// /app/ui/invoices/edit-form.tsx
import { updateInvoice } from '@/app/lib/actions';

export default function EditInvoiceForm({ invoice, customers }) {
  // Bind invoice.id vào parameter đầu tiên
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
  
  return (
    <form action={updateInvoiceWithId}>
      {/* form fields */}
    </form>
  );
}
```

**Cách hoạt động:**
```typescript
updateInvoice.bind(null, invoice.id)
    ↓
Tạo function mới: (formData) => updateInvoice(invoice.id, formData)
```

**Parameters của `.bind()`:**
- **1st param:** `this` context (dùng `null` vì không cần)
- **2nd+ params:** Arguments được bind sẵn

---

#### Alternative: Hidden input field

```tsx
<form action={updateInvoice}>
  <input type="hidden" name="id" value={invoice.id} />
  {/* other fields */}
</form>
```

**Nhược điểm:**
- ❌ ID xuất hiện trong HTML source (plaintext)
- ❌ Không an toàn cho sensitive data
- ✅ `.bind()` **tốt hơn** vì ID được encode

---

#### Implement Server Action:

```typescript
// /app/lib/actions.ts
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  // 1. Parse và validate
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  
  // 2. Convert to cents
  const amountInCents = amount * 100;
  
  // 3. Update query
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, 
        amount = ${amountInCents}, 
        status = ${status}
    WHERE id = ${id}
  `;
  
  // 4. Revalidate và redirect
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

**Pattern giống create:**
- Extract → Validate → Transform → Execute → Revalidate → Redirect

---

## 🗑️ DELETE Invoice

### Implementation:

#### File: `/app/ui/invoices/buttons.tsx`

```tsx
import { deleteInvoice } from '@/app/lib/actions';
import { TrashIcon } from '@heroicons/react/24/outline';

export function DeleteInvoice({ id }: { id: string }) {
  // Bind id vào delete action
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);
  
  return (
    <form action={deleteInvoiceWithId}>
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-4" />
      </button>
    </form>
  );
}
```

---

#### File: `/app/lib/actions.ts`

```typescript
export async function deleteInvoice(id: string) {
  // 1. Delete query
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  
  // 2. Revalidate cache
  revalidatePath('/dashboard/invoices');
  
  // 3. Không cần redirect vì đang ở trang invoices
}
```

**Khác biệt với create/update:**
- **Không cần** `redirect()` vì đã ở trang `/dashboard/invoices`
- `revalidatePath()` tự động trigger re-render → Table update

---

## 🆚 UUIDs vs Auto-incrementing Keys

### Trong tutorial này dùng UUIDs

```
UUID: 123e4567-e89b-12d3-a456-426614174000
Auto: 1, 2, 3, 4, 5...
```

### So sánh:

| Tiêu chí | UUIDs | Auto-incrementing |
|----------|-------|-------------------|
| **URL** | Dài, phức tạp | Ngắn, sạch |
| **ID collision** | Không có | Có thể xảy ra |
| **Global uniqueness** | ✅ Globally unique | ❌ Chỉ unique trong table |
| **Enumeration attacks** | ✅ An toàn | ❌ Dễ đoán (invoice/1, invoice/2...) |
| **Database size** | Tốt cho large DBs | Tốt cho small DBs |
| **Security** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Khi nào dùng UUID:**
- ✅ Large databases
- ✅ Cần high security
- ✅ Distributed systems
- ✅ Tránh enumeration attacks

**Khi nào dùng Auto-increment:**
- ✅ Muốn URLs đẹp
- ✅ Small/medium databases
- ✅ Internal tools (không public)

---

## 🔄 Revalidation & Caching

### Next.js Router Cache

**Cách hoạt động:**
```
User visit /invoices → Fetch data → Store in cache
                                        ↓
User navigate away                  Cache được lưu
                                        ↓
User back to /invoices              Dùng cache (không fetch mới!)
```

### Vấn đề với mutations:

```
Create invoice → DB updated → Cache vẫn cũ → UI không update!
```

### Giải pháp: `revalidatePath()`

```typescript
import { revalidatePath } from 'next/cache';

export async function createInvoice(formData: FormData) {
  await sql`INSERT INTO invoices ...`;
  
  // Clear cache cho path này
  revalidatePath('/dashboard/invoices');
  
  // Lần navigate tiếp theo sẽ fetch data mới
}
```

**Alternative:** `revalidateTag()`

```typescript
// Tag specific data
fetch('...', { next: { tags: ['invoices'] } });

// Revalidate by tag
revalidateTag('invoices');
```

---

## 📊 Flow hoàn chỉnh - CREATE Invoice

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User điền form                                            │
│    - Customer: "John Doe"                                    │
│    - Amount: $50.00                                          │
│    - Status: "pending"                                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. User click "Create Invoice"                               │
│    - Form submit với action={createInvoice}                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Next.js call Server Action                                │
│    - createInvoice(formData) executed on server              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Extract & Validate                                        │
│    - customerId: "123"                                       │
│    - amount: "50.00" → 50 (number)                          │
│    - status: "pending"                                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Transform data                                            │
│    - amountInCents: 50 * 100 = 5000                         │
│    - date: "2025-12-05"                                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Insert vào Database                                       │
│    INSERT INTO invoices                                      │
│    VALUES ("123", 5000, "pending", "2025-12-05")           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Revalidate Cache                                          │
│    revalidatePath('/dashboard/invoices')                     │
│    → Clear cached data                                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Redirect                                                  │
│    redirect('/dashboard/invoices')                           │
│    → Navigate user về invoices page                          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Re-fetch & Display                                        │
│    - Page re-render với data mới                             │
│    - User thấy invoice vừa tạo ở top của table              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Best Practices

### ✅ Nên làm:

1. **Tổ chức Server Actions trong file riêng**
   ```typescript
   // /app/lib/actions.ts
   'use server';
   
   export async function createInvoice() {...}
   export async function updateInvoice() {...}
   export async function deleteInvoice() {...}
   ```

2. **Luôn validate input với Zod**
   ```typescript
   const FormSchema = z.object({
     amount: z.coerce.number(),
     status: z.enum(['pending', 'paid']),
   });
   ```

3. **Store monetary values in cents**
   ```typescript
   const amountInCents = amount * 100;
   ```

4. **Dùng `.bind()` để pass extra params**
   ```typescript
   const updateWithId = updateInvoice.bind(null, id);
   ```

5. **Luôn revalidate sau mutations**
   ```typescript
   await sql`INSERT ...`;
   revalidatePath('/dashboard/invoices');
   ```

6. **Redirect sau successful mutations**
   ```typescript
   redirect('/dashboard/invoices');
   ```

7. **Dùng UUIDs cho public-facing IDs**
   - Tránh enumeration attacks
   - Globally unique

---

### ❌ Không nên:

1. **❌ Pass sensitive data qua hidden inputs**
   ```tsx
   {/* Tránh điều này */}
   <input type="hidden" name="id" value={invoice.id} />
   ```

2. **❌ Quên validate types**
   ```typescript
   // Sai - amount là string!
   const amount = formData.get('amount');
   await sql`INSERT ... ${amount}`;
   ```

3. **❌ Không revalidate cache**
   ```typescript
   await sql`UPDATE ...`;
   // Quên revalidatePath() → UI không update!
   ```

4. **❌ Store dollars thay vì cents**
   ```typescript
   // Sai - floating point errors!
   const amount = 10.99;
   ```

5. **❌ Manually tạo API routes cho CRUD**
   ```typescript
   // Không cần nữa!
   // /pages/api/invoices.ts
   ```

---

## 🔧 Code mẫu hoàn chỉnh

### Complete Server Actions file:

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Schema definition
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// CREATE
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// UPDATE
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  
  const amountInCents = amount * 100;
  
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// DELETE
export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
```

---

## 📚 Thuật ngữ quan trọng

| Thuật ngữ | Giải nghĩa | Ví dụ |
|-----------|------------|-------|
| **Server Actions** | Functions chạy trên server, invoke từ client | `'use server'` |
| **FormData** | Web API để handle form data | `formData.get('name')` |
| **Progressive Enhancement** | Form hoạt động kể cả khi JS chưa load | Native HTML submission |
| **Revalidation** | Clear cache và fetch data mới | `revalidatePath()` |
| **Type Coercion** | Convert type (string → number) | `z.coerce.number()` |
| **Dynamic Route Segment** | Route với parameter động | `[id]` folder |
| **`.bind()`** | Bind arguments vào function | `fn.bind(null, id)` |
| **UUID** | Universally Unique Identifier | `123e4567-e89b...` |
| **Monetary values in cents** | Lưu tiền bằng số nguyên (cents) | $10.50 → 1050 |

---

## 🎯 Key Takeaways

1. **Server Actions loại bỏ API endpoints** - Write server code directly
2. **`'use server'`** - Directive để mark Server Actions
3. **FormData tự động** - Không cần manually parse
4. **Progressive enhancement** - Forms work without JS
5. **Zod cho validation** - Type-safe và tự động coerce
6. **Store tiền bằng cents** - Tránh floating-point errors
7. **`.bind()` để pass params** - An toàn hơn hidden inputs
8. **Luôn revalidate** - Clear cache sau mutations
9. **Dynamic routes với `[param]`** - Flexible routing
10. **UUIDs cho security** - Tránh enumeration attacks

---

## 🚀 Bước tiếp theo

- **Error Handling** - Xử lý errors gracefully
- **Form Validation** - Client-side + server-side validation
- **Optimistic Updates** - Update UI trước khi server responds
- **Loading States** - Show loading indicators
- **Server Actions với `useFormState`** - Advanced patterns

---

## 🔐 Security Reminders

1. ✅ Server Actions có built-in CSRF protection
2. ✅ Input validation với Zod
3. ✅ Parameterized SQL queries (SQL injection safe)
4. ✅ UUIDs thay vì auto-incrementing IDs
5. ✅ `.bind()` thay vì hidden inputs cho sensitive data
6. ✅ Type coercion để ensure correct data types

Server Actions giúp build **secure và maintainable** applications! 🛡️