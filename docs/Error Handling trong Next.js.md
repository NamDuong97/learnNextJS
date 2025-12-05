# Handling Errors trong Next.js

## 📌 Mục tiêu chương này
Học cách **xử lý errors gracefully** sử dụng JavaScript `try/catch` và các API đặc biệt của Next.js.

---

## 🎯 2 Loại Errors cần handle

### 1. **Expected Errors** (Errors dự đoán được)
- Database connection fails
- Validation errors
- Network timeouts
- User không tồn tại

**Giải pháp:** `try/catch` trong Server Actions

---

### 2. **Unexpected Errors** (Errors không dự đoán)
- Bugs trong code
- Null pointer exceptions
- Undefined references
- Server crashes

**Giải pháp:** Next.js `error.tsx` file

---

## 🛡️ 1. Try/Catch trong Server Actions

### Cấu trúc cơ bản

```typescript
// /app/lib/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createInvoice(formData: FormData) {
  try {
    // 1. Validate data
    const { customerId, amount, status } = CreateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
    
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    // 2. Database operation (có thể fail)
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    
  } catch (error) {
    // 3. Handle error gracefully
    return {
      message: 'Database Error: Failed to create invoice.',
    };
  }
  
  // 4. Success path - redirect NGOÀI try/catch
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

---

### ⚠️ QUAN TRỌNG: `redirect` ngoài try/catch

#### ❌ SAI - redirect trong try block:

```typescript
export async function createInvoice(formData: FormData) {
  try {
    await sql`INSERT INTO invoices ...`;
    
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');  // ← SAI!
    
  } catch (error) {
    // redirect throw error → bị catch ở đây!
    return { message: 'Error' };
  }
}
```

**Vấn đề:**
- `redirect()` hoạt động bằng cách **throw một error**
- Error này sẽ bị `catch` block bắt → không redirect được!

---

#### ✅ ĐÚNG - redirect ngoài try/catch:

```typescript
export async function createInvoice(formData: FormData) {
  try {
    await sql`INSERT INTO invoices ...`;
  } catch (error) {
    return { message: 'Database Error: Failed to create invoice.' };
  }
  
  // Chỉ chạy nếu try thành công
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

**Giải thích:**
- `redirect` chỉ reach được khi `try` block thành công
- Nếu có error → return early → không chạy redirect
- Perfect! ✅

---

### Complete Server Actions với Error Handling

```typescript
// /app/lib/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ==================== CREATE ====================
export async function createInvoice(formData: FormData) {
  try {
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
    
  } catch (error) {
    return {
      message: 'Database Error: Failed to create invoice.',
    };
  }
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// ==================== UPDATE ====================
export async function updateInvoice(id: string, formData: FormData) {
  try {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
    
    const amountInCents = amount * 100;
    
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, 
          amount = ${amountInCents}, 
          status = ${status}
      WHERE id = ${id}
    `;
    
  } catch (error) {
    return {
      message: 'Database Error: Failed to update invoice.',
    };
  }
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// ==================== DELETE ====================
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    
    return { message: 'Invoice deleted successfully.' };
  } catch (error) {
    return {
      message: 'Database Error: Failed to delete invoice.',
    };
  }
}
```

---

## 🚨 2. Error.tsx - Catch-all cho Unexpected Errors

### `error.tsx` là gì?

**Error Boundary** cho route segment:
- Bắt **tất cả uncaught errors** trong route và children
- Hiển thị fallback UI thay vì crash app
- Cho phép user recover (retry)

---

### Cấu trúc folder

```
/app/dashboard/invoices/
  ├── page.tsx
  ├── error.tsx              ← Error boundary cho /invoices
  ├── create/
  │   └── page.tsx
  └── [id]/
      └── edit/
          └── page.tsx
```

**Scope:**
- `error.tsx` bắt errors trong:
  - ✅ `/dashboard/invoices/page.tsx`
  - ✅ `/dashboard/invoices/create/page.tsx`
  - ✅ `/dashboard/invoices/[id]/edit/page.tsx`

---

### Implementation

#### File: `/app/dashboard/invoices/error.tsx`

```tsx
'use client';  // ← BẮT BUỘC là Client Component

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, Datadog, etc.)
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center">Something went wrong!</h2>
      <button
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={() => reset()}  // ← Attempt recovery
      >
        Try again
      </button>
    </main>
  );
}
```

---

### Giải thích Props

#### 1. `error` prop

```typescript
error: Error & { digest?: string }
```

**Là gì?**
- Instance của JavaScript's native `Error` object
- Chứa thông tin về lỗi

**Properties:**
```typescript
error.message   // Error message string
error.name      // Error type (e.g., "TypeError")
error.stack     // Stack trace
error.digest    // Next.js error hash (optional)
```

**Ví dụ:**
```typescript
{
  message: "Cannot read property 'id' of undefined",
  name: "TypeError",
  stack: "TypeError: Cannot read property...\n  at Page...",
  digest: "1234567890"  // Unique error identifier
}
```

---

#### 2. `reset` function

```typescript
reset: () => void
```

**Mục đích:**
- Attempt to **re-render** route segment
- Clear error boundary
- Cho user cơ hội retry

**Cách hoạt động:**
```tsx
<button onClick={() => reset()}>
  Try again
</button>
```

**Flow khi click "Try again":**
```
1. reset() được gọi
   ↓
2. Clear error boundary state
   ↓
3. Re-render route segment
   ↓
4a. Nếu thành công → Hiển thị bình thường
4b. Nếu vẫn lỗi → error.tsx hiển thị lại
```

---

### ⚠️ Lưu ý quan trọng về error.tsx

#### 1. **Phải là 'use client'**

```tsx
'use client';  // ← BẮT BUỘC!

export default function Error({ error, reset }) {
  // ...
}
```

**Tại sao?**
- Cần React hooks (`useEffect`)
- Cần event handlers (`onClick`)
- Error boundaries là client-side concept

---

#### 2. **Không bắt errors trong layout.tsx cùng level**

```
/app/dashboard/
  ├── layout.tsx          ← Errors ở đây KHÔNG bị bắt
  ├── error.tsx           ← Boundary này
  └── page.tsx            ← Bắt errors ở đây
```

**Giải pháp:** Tạo `error.tsx` ở level cao hơn:
```
/app/
  ├── layout.tsx          
  ├── error.tsx           ← Bắt errors trong dashboard/layout.tsx
  └── dashboard/
      ├── layout.tsx      
      ├── error.tsx       ← Bắt errors trong dashboard/page.tsx
      └── page.tsx
```

---

#### 3. **Nested error boundaries**

```
/app/
  ├── error.tsx                    ← Global error boundary
  └── dashboard/
      ├── error.tsx                ← Dashboard error boundary
      └── invoices/
          ├── error.tsx            ← Invoices error boundary (most specific)
          └── [id]/
              └── edit/
                  └── page.tsx
```

**Priority:** Nearest error boundary wins!

---

## 🔍 3. Not Found Errors (404)

### `notFound()` function là gì?

**Mục đích:**
- Handle cases khi resource **không tồn tại**
- Hiển thị 404 UI thay vì generic error

**Use cases:**
- User ID không tồn tại
- Blog post không tìm thấy
- Product page deleted
- Invalid route parameters

---

### Implementation

#### Bước 1: Check nếu resource không tồn tại

#### File: `/app/dashboard/invoices/[id]/edit/page.tsx`

```tsx
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
import { notFound } from 'next/navigation';

export default async function Page(props: { 
  params: Promise<{ id: string }> 
}) {
  const params = await props.params;
  const id = params.id;
  
  // Fetch data
  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);
  
  // Check if invoice exists
  if (!invoice) {
    notFound();  // ← Trigger 404 UI
  }
  
  return <Form invoice={invoice} customers={customers} />;
}
```

**Giải thích:**
- `fetchInvoiceById(id)` → `undefined` nếu không tìm thấy
- `if (!invoice)` → true
- `notFound()` được gọi → Trigger 404 UI

---

#### Bước 2: Tạo not-found.tsx file

#### File: `/app/dashboard/invoices/[id]/edit/not-found.tsx`

```tsx
import Link from 'next/link';
import { FaceFrownIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <FaceFrownIcon className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">404 Not Found</h2>
      <p>Could not find the requested invoice.</p>
      <Link
        href="/dashboard/invoices"
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
      >
        Go Back
      </Link>
    </main>
  );
}
```

---

### Scope của not-found.tsx

```
/app/dashboard/invoices/
  ├── page.tsx
  ├── not-found.tsx              ← 404 cho /invoices
  └── [id]/
      └── edit/
          ├── page.tsx
          └── not-found.tsx      ← 404 cho /invoices/[id]/edit (more specific)
```

**Rule:**
- Next.js tìm `not-found.tsx` **gần nhất** với route
- Nếu không có → fallback lên level cao hơn

---

## 🆚 error.tsx vs not-found.tsx

### So sánh chi tiết

| Feature | error.tsx | not-found.tsx |
|---------|-----------|---------------|
| **Trigger** | Uncaught exceptions | `notFound()` function |
| **Use case** | Bugs, crashes, unexpected errors | Resource không tồn tại |
| **Status code** | 500 (Server Error) | 404 (Not Found) |
| **Props** | `error`, `reset` | Không có props |
| **Client Component** | ✅ Bắt buộc | ❌ Có thể Server Component |
| **Recovery** | ✅ `reset()` function | ❌ Không có retry |
| **Priority** | Lower | **Higher** (takes precedence) |

---

### ⚠️ Priority Rule

> **`notFound()` takes precedence over `error.tsx`**

**Ví dụ:**

```tsx
// /app/blog/[slug]/page.tsx
export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);
  
  if (!post) {
    notFound();  // ← Triggers not-found.tsx
  }
  
  // Giả sử có bug ở đây
  const title = post.title.toUpperCase();  // Nếu post.title undefined → error.tsx
  
  return <article>{title}</article>;
}
```

**Scenarios:**

1. **Post không tồn tại:**
   - `if (!post)` → true
   - `notFound()` được gọi
   - → **not-found.tsx** hiển thị (404)

2. **Post tồn tại nhưng có bug:**
   - `if (!post)` → false
   - `post.title.toUpperCase()` → crash
   - → **error.tsx** hiển thị (500)

---

## 🔄 Error Handling Flow

### Flow hoàn chỉnh từ Server Action → UI

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User submit form                                          │
│    - Click "Create Invoice"                                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Action executed                                    │
│    - createInvoice(formData)                                 │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Try Block                                                 │
│    - Parse & validate data                                   │
│    - Insert into database                                    │
└─────────────────────────────────────────────────────────────┘
                    ↙        ↘
              Success        Error
                 ↓              ↓
┌──────────────────────┐  ┌──────────────────────────────────┐
│ 4a. Success Path     │  │ 4b. Catch Block                  │
│ - No error           │  │ - return { message: 'Error...' } │
│ - Execute after try  │  │ - Early return                   │
└──────────────────────┘  └──────────────────────────────────┘
         ↓                           ↓
┌──────────────────────┐  ┌──────────────────────────────────┐
│ 5a. Revalidate       │  │ 5b. Component receives error     │
│ & Redirect           │  │ - Display error message to user  │
└──────────────────────┘  └──────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. User redirected to /dashboard/invoices                    │
│    - See updated data                                        │
└─────────────────────────────────────────────────────────────┘
```

---

### Flow với Uncaught Error → error.tsx

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Server Action executed                                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Unexpected error occurs                                   │
│    - throw new Error('Something broke!')                     │
│    - Không có try/catch để bắt                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Error bubbles up                                          │
│    - Tìm nearest error.tsx                                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. error.tsx component renders                               │
│    - Props: { error, reset }                                 │
│    - Display fallback UI                                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. User có 2 options:                                        │
│    a. Click "Try again" → reset() → re-render               │
│    b. Navigate away                                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Flow với notFound() → not-found.tsx

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Page component renders                                    │
│    - Fetch data for invoice ID                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Check if resource exists                                  │
│    - const invoice = await fetchInvoiceById(id)              │
│    - Result: undefined (không tìm thấy)                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Call notFound()                                           │
│    - if (!invoice) notFound()                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Next.js tìm not-found.tsx                                 │
│    - Tìm trong cùng folder                                   │
│    - Hoặc bubble up lên parent                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. not-found.tsx renders                                     │
│    - Display 404 UI                                          │
│    - HTTP status: 404                                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. User clicks "Go Back"                                     │
│    - Navigate to /dashboard/invoices                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Best Practices

### ✅ DO's (Nên làm)

#### 1. **Luôn dùng try/catch trong Server Actions**

```typescript
export async function createInvoice(formData: FormData) {
  try {
    // Database operations
    await sql`INSERT INTO ...`;
  } catch (error) {
    return { message: 'Database Error' };
  }
  
  // Success path
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

---

#### 2. **Log errors to monitoring service**

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log to Sentry, Datadog, etc.
    Sentry.captureException(error);
    console.error(error);
  }, [error]);
  
  return <div>Error UI</div>;
}
```

---

#### 3. **Provide helpful error messages**

```typescript
// ❌ Vague
catch (error) {
  return { message: 'Error' };
}

// ✅ Specific
catch (error) {
  return { 
    message: 'Database Error: Failed to create invoice. Please try again.' 
  };
}
```

---

#### 4. **Dùng notFound() cho 404 cases**

```tsx
export default async function Page({ params }) {
  const post = await fetchPost(params.id);
  
  if (!post) {
    notFound();  // ← Specific 404 handling
  }
  
  return <article>{post.content}</article>;
}
```

---

#### 5. **Tạo error boundaries ở các levels phù hợp**

```
/app/
  ├── error.tsx                    ← Global fallback
  └── dashboard/
      ├── error.tsx                ← Dashboard-specific
      └── invoices/
          ├── error.tsx            ← Invoices-specific
          └── [id]/edit/
              ├── page.tsx
              └── not-found.tsx    ← 404 for single invoice
```

---

#### 6. **redirect() ngoài try/catch**

```typescript
export async function updateInvoice(id: string, formData: FormData) {
  try {
    await sql`UPDATE invoices ...`;
  } catch (error) {
    return { message: 'Error' };
  }
  
  // Chỉ chạy nếu try thành công
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');  // ← Ngoài try/catch!
}
```

---

### ❌ DON'Ts (Không nên)

#### 1. **❌ Không log sensitive data**

```typescript
// ❌ BAD - exposes sensitive info
catch (error) {
  console.log('User password:', formData.get('password'));
  return { message: error.message };  // ← Có thể leak info
}

// ✅ GOOD
catch (error) {
  console.error('Login failed for user');
  return { message: 'Invalid credentials' };
}
```

---

#### 2. **❌ Không dùng error.tsx như Server Component**

```tsx
// ❌ SAI - thiếu 'use client'
export default function Error({ error, reset }) {
  const [count, setCount] = useState(0);  // ← Error! Hooks require client
  return <div>Error</div>;
}

// ✅ ĐÚNG
'use client';

export default function Error({ error, reset }) {
  const [count, setCount] = useState(0);  // ← OK!
  return <div>Error</div>;
}
```

---

#### 3. **❌ Không show raw error messages to users**

```typescript
// ❌ BAD - exposes internal details
catch (error) {
  return { 
    message: error.message  // "Cannot connect to database at 192.168.1.5:5432"
  };
}

// ✅ GOOD
catch (error) {
  console.error(error);  // Log internally
  return { 
    message: 'Unable to process request. Please try again.'
  };
}
```

---

#### 4. **❌ Không ignore errors**

```typescript
// ❌ BAD - silent failure
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    // Nothing! User không biết có lỗi
  }
  
  revalidatePath('/dashboard/invoices');
}

// ✅ GOOD
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice deleted successfully.' };
  } catch (error) {
    return { 
      message: 'Database Error: Failed to delete invoice.' 
    };
  }
}
```

---

## 🎨 Advanced Patterns

### Pattern 1: Display Server Action Errors trong Form

#### Client Component:

```tsx
'use client';

import { useFormState } from 'react-dom';
import { createInvoice } from '@/app/lib/actions';

export default function CreateInvoiceForm({ customers }) {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createInvoice, initialState);

  return (
    <form action={dispatch}>
      <select name="customerId">
        {customers.map(customer => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>
      
      <input name="amount" type="number" />
      
      {/* Display error message */}
      {state.message && (
        <div className="error-message">
          {state.message}
        </div>
      )}
      
      <button type="submit">Create Invoice</button>
    </form>
  );
}
```

#### Server Action:

```typescript
export async function createInvoice(
  prevState: any,
  formData: FormData
) {
  try {
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
    
  } catch (error) {
    return {
      message: 'Database Error: Failed to create invoice.',
    };
  }
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

---

### Pattern 2: Validation Errors với Zod

```typescript
import { z } from 'zod';

const FormSchema = z.object({
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Amount must be greater than 0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select a status.',
  }),
});

export async function createInvoice(
  prevState: any,
  formData: FormData
) {
  // Validate with safeParse (doesn't throw)
  const validatedFields = FormSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  
  // Check validation errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to create invoice.',
    };
  }
  
  // Continue with valid data
  const { customerId, amount, status } = validatedFields.data;
  
  try {
    await sql`INSERT INTO invoices ...`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to create invoice.',
    };
  }
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

#### Display field-specific errors:

```tsx
'use client';

import { useFormState } from 'react-dom';

export default function Form() {
  const [state, dispatch] = useFormState(createInvoice, initialState);

  return (
    <form action={dispatch}>
      <select name="customerId">...</select>
      {state.errors?.customerId && (
        <p className="error">{state.errors.customerId}</p>
      )}
      
      <input name="amount" type="number" />
      {state.errors?.amount && (
        <p className="error">{state.errors.amount}</p>
      )}
      
      <button type="submit">Create</button>
    </form>
  );
}
```

---

### Pattern 3: Global Error Handler

```tsx
// /app/error.tsx - Root level
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="global-error">
          <h1>Oops! Something went wrong</h1>
          <p>We've been notified and are working on a fix.</p>
          <button onClick={() => reset()}>Try again</button>
          <a href="/">Go home</a>
        </div>
      </body>
    </html>
  );
}
```

---

## 📊 Error Handling Decision Tree

```
Có error xảy ra?
    ↓
    ├─ Expected error (validation, database, etc.)?
    │     ↓
    │     YES → Dùng try/catch trong Server Action
    │              ↓
    │              Return error message to form
    │
    └─ Unexpected error (bug, crash)?
          ↓
          ├─ Resource không tồn tại?
          │     ↓
          │     YES → notFound() + not-found.tsx
          │              ↓
          │              Display 404 UI
          │
          └─ NO → Let error bubble up
                    ↓
                    error.tsx catches it
                    ↓
                    Display error UI + reset option
```

---

## 📚 Thuật ngữ quan trọng

| Thuật ngữ | Giải nghĩa | Ví dụ |
|-----------|------------|-------|
| **Error Boundary** | Component bắt errors trong children | `error.tsx` |
| **Fallback UI** | UI hiển thị khi có error | Error message + retry button |
| **Uncaught Exception** | Error không được try/catch | Bugs, null references |
| **Graceful Degradation** | App vẫn hoạt động khi có lỗi | Show error, cho retry |
| **try/catch** | JavaScript error handling | Bắt expected errors |
| **notFound()** | Next.js function trigger 404 | Resource không tồn tại |
| **reset()** | Function để retry/recover | Re-render route segment |
| **digest** | Unique error identifier | Hash của error để track |

---

## 🎯 Key Takeaways

1. **2 loại errors:** Expected (try/catch) và Unexpected (error.tsx)
2. **`redirect()` ngoài try/catch** - Vì nó throw error!
3. **`error.tsx` bắt buộc 'use client'** - Cần hooks và events
4. **`notFound()` > `error.tsx`** - Priority cao hơn
5. **Nested error boundaries** - Nearest wins
6. **Log errors to monitoring** - Sentry, Datadog
7. **Friendly error messages** - Không expose internal details
8. **Always provide recovery option** - reset() hoặc navigation
9. **Validate early** - Zod validation trước database ops
10. **Test error scenarios** - Manually throw errors để test

---

## 🧪 Testing Error Scenarios

### Manually throw errors để test:

```typescript
// Test error.tsx
export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');  // ← Test error boundary
  
  // Unreachable code
  await sql`DELETE FROM invoices WHERE id = ${id}`;
}

// Test not-found.tsx
export default async function Page({ params }) {
  // Force 404
  notFound();  // ← Test 404 handling
  
  // Unreachable code
  const invoice = await fetchInvoiceById(params.id);
}
```

**Nhớ remove sau khi test!**

---

## 🔐 Security Considerations

### 1. **Không expose sensitive errors**

```typescript
// ❌ BAD
catch (error) {
  return { message: error.message };
  // "Connection failed to postgres://user:password@host:5432/db"
}

// ✅ GOOD
catch (error) {
  console.error(error);  // Log server-side
  return { message: 'An error occurred. Please try again.' };
}
```

---

### 2. **Sanitize error messages**

```typescript
catch (error) {
  // Log full error internally
  console.error('[CREATE_INVOICE_ERROR]', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  // Return safe message to client
  return { 
    message: 'Unable to create invoice. Please contact support if the problem persists.' 
  };
}
```

---

### 3. **Rate limit error reporting**

```typescript
// Prevent error spam attacks
let errorCount = 0;
const ERROR_THRESHOLD = 5;

export default function Error({ error, reset }) {
  useEffect(() => {
    errorCount++;
    
    if (errorCount <= ERROR_THRESHOLD) {
      reportError(error);
    } else {
      console.warn('Error rate limit exceeded');
    }
  }, [error]);
  
  return <div>Error UI</div>;
}
```

---

## 🚀 Production Checklist

### Trước khi deploy:

- [ ] All Server Actions có try/catch
- [ ] redirect() đặt ngoài try/catch blocks
- [ ] error.tsx files ở các route quan trọng
- [ ] not-found.tsx cho dynamic routes
- [ ] Error logging setup (Sentry/Datadog)
- [ ] Error messages user-friendly (không technical)
- [ ] Tested error scenarios manually
- [ ] Reset/retry buttons hoạt động
- [ ] No sensitive data trong error messages
- [ ] Global error boundary setup
- [ ] 404 pages styled đẹp
- [ ] Error monitoring alerts configured

---

## 📖 Further Reading

### Official Next.js Docs:
- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [error.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [not-found.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [notFound() API Reference](https://nextjs.org/docs/app/api-reference/functions/not-found)

### Error Monitoring Services:
- [Sentry](https://sentry.io/)
- [Datadog](https://www.datadoghq.com/)
- [LogRocket](https://logrocket.com/)
- [New Relic](https://newrelic.com/)

---

## 🎉 Summary

**Error handling trong Next.js App Router gồm 3 layers:**

1. **Try/Catch** - Expected errors trong Server Actions
2. **error.tsx** - Unexpected errors trong routes
3. **not-found.tsx** - 404 errors cho missing resources

**Remember:**
- ✅ redirect() ngoài try/catch
- ✅ error.tsx cần 'use client'
- ✅ notFound() > error.tsx (priority)
- ✅ Log errors, show friendly messages
- ✅ Always provide recovery options

Master error handling → Better UX → Happier users! 🎊