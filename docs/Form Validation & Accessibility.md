# Form Validation & Accessibility trong Next.js

## 📌 Mục tiêu chương này
Học cách implement **server-side form validation**, hiển thị errors gracefully, và improve **accessibility** cho users với disabilities.

---

## ♿ 1. Accessibility là gì?

### Định nghĩa
**Accessibility (a11y)** là việc thiết kế và implement web applications để **mọi người đều có thể sử dụng**, bao gồm người khuyết tật.

### Các khía cạnh của Accessibility:

| Area | Description | Examples |
|------|-------------|----------|
| **Keyboard Navigation** | Di chuyển không cần chuột | Tab, Enter, Arrow keys |
| **Screen Readers** | Đọc nội dung cho người mù | NVDA, JAWS, VoiceOver |
| **Semantic HTML** | Dùng đúng HTML elements | `<button>` thay vì `<div>` |
| **Alt Text** | Mô tả hình ảnh | `alt="User profile picture"` |
| **Color Contrast** | Đủ contrast để đọc | WCAG AA standard |
| **Form Labels** | Mô tả input fields | `<label>` với `htmlFor` |
| **ARIA Attributes** | Thông tin cho AT | `aria-label`, `aria-describedby` |

**AT = Assistive Technologies** (công nghệ hỗ trợ)

---

## 🔍 2. ESLint Accessibility Plugin

### Setup eslint-plugin-jsx-a11y

#### Bước 1: Install ESLint

```bash
pnpm add -D eslint eslint-config-next
```

---

#### Bước 2: Create config file

#### File: `eslint.config.mjs` (root)

```javascript
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,  // ← Includes eslint-plugin-jsx-a11y
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
```

**Giải thích:**
- `eslint-config-next/core-web-vitals` → Bao gồm `eslint-plugin-jsx-a11y`
- Plugin này catches accessibility issues automatically

---

#### Bước 3: Add lint script

#### File: `package.json`

```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start",
    "lint": "eslint ."  // ← Add this
  }
}
```

---

#### Bước 4: Run linter

```bash
pnpm lint
```

**Nếu no errors:**
```
✔ No ESLint warnings or errors
```

---

### Ví dụ: Lỗi accessibility

#### Image không có alt text:

```tsx
// ❌ BAD - Missing alt
<Image
  src={invoice.image_url}
  width={28}
  height={28}
/>
```

**Run `pnpm lint`:**
```
./app/ui/invoices/table.tsx
45:25  Warning: Image elements must have an alt prop,
either with meaningful text, or an empty string for 
decorative images. jsx-a11y/alt-text
```

#### Fix:

```tsx
// ✅ GOOD - Has alt text
<Image
  src={invoice.image_url}
  width={28}
  height={28}
  alt={`${invoice.name}'s profile picture`}
/>
```

---

### Common warnings từ jsx-a11y:

| Warning | Vấn đề | Fix |
|---------|--------|-----|
| `jsx-a11y/alt-text` | Missing alt | Add `alt="..."` |
| `jsx-a11y/aria-props` | Invalid ARIA | Fix ARIA attributes |
| `jsx-a11y/aria-proptypes` | Wrong ARIA type | Use correct values |
| `jsx-a11y/label-has-associated-control` | Label not connected | Add `htmlFor` |
| `jsx-a11y/no-autofocus` | Autofocus issues | Remove autofocus |

---

## 📝 3. Form Accessibility Foundations

### 3 practices cơ bản đã implement:

#### 1. **Semantic HTML**

```tsx
// ✅ GOOD - Semantic elements
<form>
  <input type="text" />
  <select>
    <option>Choose...</option>
  </select>
  <button type="submit">Submit</button>
</form>

// ❌ BAD - Divs everywhere
<div onClick={handleSubmit}>
  <div contentEditable />
  <div onClick={selectOption}>Choose...</div>
  <div onClick={submit}>Submit</div>
</div>
```

**Tại sao quan trọng?**
- Screen readers hiểu semantic elements
- Tự động có keyboard navigation
- Native browser behaviors (validation, submit on Enter, etc.)

---

#### 2. **Labels với htmlFor**

```tsx
// ✅ GOOD - Connected label
<label htmlFor="email" className="mb-2 block text-sm font-medium">
  Email Address
</label>
<input
  id="email"
  name="email"
  type="email"
  placeholder="Enter your email"
/>
```

**Benefits:**
- Screen readers đọc label khi focus vào input
- Click vào label → focus vào input
- Context cho user

```tsx
// ❌ BAD - No connection
<div>Email Address</div>
<input name="email" type="email" />
```

---

#### 3. **Focus Outlines**

```css
/* ✅ GOOD - Visible focus */
input:focus {
  outline: 2px solid blue;
  outline-offset: 2px;
}

/* ❌ BAD - Removing outline */
input:focus {
  outline: none;  /* Don't do this! */
}
```

**Tại sao quan trọng?**
- Keyboard users cần biết đang focus ở đâu
- Visual indicator của active element
- Critical cho accessibility

**Test:** Press Tab key → See focus move through form

---

## ✅ 4. Form Validation

### Client-Side vs Server-Side

#### Client-Side Validation

**Ưu điểm:**
- ✅ Instant feedback
- ✅ Better UX (không cần roundtrip)
- ✅ Reduces server load

**Nhược điểm:**
- ❌ Có thể bypass (disable JS, modify code)
- ❌ Không đủ secure
- ❌ Phải duplicate validation logic

---

#### Server-Side Validation

**Ưu điểm:**
- ✅ **Cannot be bypassed** - Secure!
- ✅ Single source of truth
- ✅ Validate trước khi hit database
- ✅ Protect against malicious users

**Nhược điểm:**
- ❌ Requires roundtrip to server
- ❌ Slightly slower feedback

---

### 🎯 Best Practice: Cả 2!

```
┌─────────────────────────────────────────────────┐
│ Client-Side (HTML5 + JS)                        │
│ - Instant feedback                              │
│ - Better UX                                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Server-Side (Zod + Database)                    │
│ - Security                                      │
│ - Final validation                              │
│ - Cannot be bypassed                            │
└─────────────────────────────────────────────────┘
```

**Trong tutorial này:** Focus on **server-side validation**

---

## 🎣 5. useActionState Hook

### useActionState là gì?

React hook để manage **form state và errors** trong Server Actions.

**Introduced:** React 19 (replaces `useFormState`)

---

### Cú pháp

```typescript
const [state, formAction] = useActionState(
  serverAction,    // Server Action function
  initialState     // Initial state object
);
```

**Returns:**
- `state` - Current form state (errors, messages)
- `formAction` - Function to call khi form submit

---

### Implementation Step-by-Step

#### Bước 1: Convert to Client Component

```tsx
// /app/ui/invoices/create-form.tsx
'use client';  // ← BẮT BUỘC vì dùng hook

import { useActionState } from 'react';
import { createInvoice, State } from '@/app/lib/actions';

export default function Form({ customers }: { customers: CustomerField[] }) {
  // Hook code here...
}
```

**Tại sao 'use client'?**
- `useActionState` là React hook
- Hooks chỉ chạy trong Client Components

---

#### Bước 2: Define initialState

```tsx
export default function Form({ customers }) {
  const initialState: State = { 
    message: null, 
    errors: {} 
  };
  
  // ...
}
```

**State type (sẽ define sau):**
```typescript
type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
```

---

#### Bước 3: Use the hook

```tsx
export default function Form({ customers }) {
  const initialState: State = { message: null, errors: {} };
  
  const [state, formAction] = useActionState(
    createInvoice,    // Server Action
    initialState      // Initial state
  );
  
  return (
    <form action={formAction}>  {/* ← Pass formAction, not createInvoice */}
      {/* form fields */}
    </form>
  );
}
```

**Quan trọng:** 
- Form `action={formAction}` (không phải `createInvoice`)
- `formAction` là wrapper tự động handle state

---

## 🛡️ 6. Server-Side Validation với Zod

### Update FormSchema với error messages

```typescript
// /app/lib/actions.ts
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',  // ← Custom message
  }),
  
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),  // ← Validation rule
  
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
```

**Giải thích từng field:**

#### 1. customerId:
```typescript
customerId: z.string({
  invalid_type_error: 'Please select a customer.',
})
```
- Expected: `string`
- Error khi: empty/undefined
- Message: Custom friendly message

---

#### 2. amount:
```typescript
amount: z.coerce
  .number()
  .gt(0, { message: 'Please enter an amount greater than $0.' })
```
- `z.coerce.number()` → Convert string → number
- `.gt(0)` → Greater than 0
- Default to 0 nếu empty → Fail validation

---

#### 3. status:
```typescript
status: z.enum(['pending', 'paid'], {
  invalid_type_error: 'Please select an invoice status.',
})
```
- Chỉ accept 'pending' hoặc 'paid'
- Error khi: empty hoặc invalid value

---

### Update Server Action signature

```typescript
// /app/lib/actions.ts
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(
  prevState: State,      // ← From useActionState
  formData: FormData     // ← Form data
) {
  // Validation logic here...
}
```

**Parameters:**
- `prevState` - Previous state from `useActionState` (required prop)
- `formData` - Form data như trước

---

### safeParse() vs parse()

#### parse() - Throws error:

```typescript
// ❌ Throws error immediately
const result = CreateInvoice.parse(data);
// Nếu invalid → throw Error → Cần try/catch
```

---

#### safeParse() - Returns object:

```typescript
// ✅ Returns { success: boolean, data/error }
const validatedFields = CreateInvoice.safeParse(data);

if (!validatedFields.success) {
  // Handle errors gracefully
  return {
    errors: validatedFields.error.flatten().fieldErrors,
    message: 'Validation failed',
  };
}

// Use validated data
const { customerId, amount, status } = validatedFields.data;
```

**Structure của safeParse result:**

```typescript
// Success case:
{
  success: true,
  data: {
    customerId: "123",
    amount: 50,
    status: "pending"
  }
}

// Error case:
{
  success: false,
  error: ZodError {
    issues: [...],
    flatten: () => {
      fieldErrors: {
        customerId: ["Please select a customer."],
        amount: ["Please enter an amount greater than $0."]
      }
    }
  }
}
```

---

### Complete Server Action với Validation

```typescript
// /app/lib/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 1. Define State type
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// 2. Define Zod schema
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

// 3. Server Action
export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // Database error
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Success - revalidate and redirect
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

---

### 🔍 Flow Validation

```
┌─────────────────────────────────────────────────┐
│ 1. User submits form                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Server Action receives data                  │
│    - prevState (from useActionState)            │
│    - formData                                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Zod safeParse() validates                    │
│    - Check types                                │
│    - Check constraints                          │
│    - Return success/error object               │
└─────────────────────────────────────────────────┘
              ↙           ↘
        Success         Failure
           ↓               ↓
┌──────────────────┐  ┌────────────────────────────┐
│ 4a. Extract data │  │ 4b. Return errors          │
│ validatedFields  │  │ { errors: {...},           │
│ .data            │  │   message: '...' }         │
└──────────────────┘  └────────────────────────────┘
           ↓                      ↓
┌──────────────────┐  ┌────────────────────────────┐
│ 5a. Transform    │  │ 5b. Component re-renders   │
│ - To cents       │  │ - Display errors           │
│ - Date format    │  │ - User sees feedback       │
└──────────────────┘  └────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────┐
│ 6a. try/catch Database operation                 │
└──────────────────────────────────────────────────┘
      ↙              ↘
   Success         Error
      ↓               ↓
┌──────────────┐  ┌──────────────────────────────┐
│ 7a. Success  │  │ 7b. Database error           │
│ - Revalidate │  │ return { message: '...' }    │
│ - Redirect   │  │                              │
└──────────────┘  └──────────────────────────────┘
```

---

## 🎨 7. Displaying Errors trong Form

### Hiển thị field-specific errors

```tsx
// /app/ui/invoices/create-form.tsx
'use client';

import { useActionState } from 'react';
import { createInvoice, State } from '@/app/lib/actions';

export default function Form({ customers }: { customers: CustomerField[] }) {
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(createInvoice, initialState);

  return (
    <form action={formAction}>
      {/* Customer Field */}
      <div className="mb-4">
        <label htmlFor="customer" className="mb-2 block text-sm font-medium">
          Choose customer
        </label>
        
        <select
          id="customer"
          name="customerId"
          className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm"
          defaultValue=""
          aria-describedby="customer-error"  // ← ARIA connection
        >
          <option value="" disabled>Select a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        
        {/* Error display */}
        <div id="customer-error" aria-live="polite" aria-atomic="true">
          {state.errors?.customerId &&
            state.errors.customerId.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>

      {/* Amount Field */}
      <div className="mb-4">
        <label htmlFor="amount" className="mb-2 block text-sm font-medium">
          Amount
        </label>
        
        <input
          id="amount"
          name="amount"
          type="number"
          placeholder="Enter USD amount"
          className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm"
          aria-describedby="amount-error"
        />
        
        <div id="amount-error" aria-live="polite" aria-atomic="true">
          {state.errors?.amount &&
            state.errors.amount.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>

      {/* Status Field */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">
          Set the invoice status
        </label>
        
        <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
          <div className="flex gap-4">
            <div className="flex items-center">
              <input
                id="pending"
                name="status"
                type="radio"
                value="pending"
                className="h-4 w-4"
                aria-describedby="status-error"
              />
              <label htmlFor="pending" className="ml-2">Pending</label>
            </div>
            
            <div className="flex items-center">
              <input
                id="paid"
                name="status"
                type="radio"
                value="paid"
                className="h-4 w-4"
                aria-describedby="status-error"
              />
              <label htmlFor="paid" className="ml-2">Paid</label>
            </div>
          </div>
        </div>
        
        <div id="status-error" aria-live="polite" aria-atomic="true">
          {state.errors?.status &&
            state.errors.status.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>

      {/* General message */}
      <div aria-live="polite" aria-atomic="true">
        {state.message && (
          <p className="mt-2 text-sm text-red-500">{state.message}</p>
        )}
      </div>

      {/* Submit button */}
      <button type="submit">Create Invoice</button>
    </form>
  );
}
```

---

## ♿ 8. ARIA Labels cho Accessibility

### 3 ARIA attributes quan trọng:

#### 1. aria-describedby

**Mục đích:** Link input với error message container

```tsx
<select
  id="customer"
  name="customerId"
  aria-describedby="customer-error"  // ← Points to error div
>
  {/* options */}
</select>

<div id="customer-error">  {/* ← Error container */}
  {state.errors?.customerId && (
    <p>{state.errors.customerId[0]}</p>
  )}
</div>
```

**Cách hoạt động:**
- Screen reader focuses vào `<select>`
- Reads: "Choose customer, select box" + error message (nếu có)
- User biết ngay có lỗi và lỗi gì

---

#### 2. aria-live

**Mục đích:** Announce dynamic content changes

```tsx
<div aria-live="polite" aria-atomic="true">
  {state.errors?.customerId && (
    <p>{state.errors.customerId[0]}</p>
  )}
</div>
```

**Values:**
- `"off"` - Don't announce (default)
- `"polite"` - Announce khi user idle (recommended)
- `"assertive"` - Announce immediately (for urgent messages)

**Use cases:**
- Form errors
- Success messages
- Loading states
- Notifications

---

#### 3. aria-atomic

**Mục đích:** Control how changes announced

```tsx
<div aria-live="polite" aria-atomic="true">
  <p>Error message here</p>
</div>
```

**Values:**
- `true` - Read entire region khi có changes
- `false` - Chỉ read phần changed

**Ví dụ:**

```tsx
// With aria-atomic="true"
<div aria-atomic="true">
  <p>Field: Customer</p>
  <p>Error: Please select a customer</p>  {/* New content */}
</div>
// Screen reader: "Field: Customer. Error: Please select a customer"

// With aria-atomic="false" (default)
// Screen reader: "Error: Please select a customer" (chỉ phần mới)
```

---

### Complete ARIA pattern:

```tsx
<div className="mb-4">
  {/* 1. Label with htmlFor */}
  <label htmlFor="amount" className="mb-2 block text-sm font-medium">
    Amount
  </label>
  
  {/* 2. Input with aria-describedby */}
  <input
    id="amount"
    name="amount"
    type="number"
    aria-describedby="amount-error"  // ← Connect to error
  />
  
  {/* 3. Error container with ARIA */}
  <div 
    id="amount-error"           // ← Matches aria-describedby
    aria-live="polite"          // ← Announce changes politely
    aria-atomic="true"          // ← Read entire content
  >
    {state.errors?.amount && (
      <p className="mt-2 text-sm text-red-500">
        {state.errors.amount[0]}
      </p>
    )}
  </div>
</div>
```

---

## 📊 9. Validation Flow với useActionState

### Complete flow from submit to error display:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User fills form and clicks Submit                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. formAction() called (from useActionState)                │
│    - Wraps createInvoice()                                  │
│    - Passes prevState automatically                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Server Action: createInvoice(prevState, formData)        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Zod safeParse() validation                                │
│    validatedFields = CreateInvoice.safeParse(data)          │
└─────────────────────────────────────────────────────────────┘
                    ↙         ↘
            Valid             Invalid
               ↓                 ↓
┌───────────────────────┐  ┌─────────────────────────────────┐
│ 5a. Continue to DB    │  │ 5b. Return errors immediately   │
│                       │  │ return {                        │
│                       │  │   errors: { ... },              │
│                       │  │   message: 'Failed'             │
│                       │  │ }                               │
└───────────────────────┘  └─────────────────────────────────┘
         ↓                             ↓
┌───────────────────────┐  ┌─────────────────────────────────┐
│ 6a. Database insert   │  │ 6b. useActionState updates      │
│ try/catch             │  │     state with errors           │
└───────────────────────┘  └─────────────────────────────────┘
    ↙          ↘                       ↓
Success      Error          ┌─────────────────────────────────┐
   ↓            ↓           │ 7. Component re-renders         │
┌──────┐  ┌──────────┐     │    - state.errors populated     │
│ 7a.  │  │ 7b.      │     │    - Error messages display     │
│Reval-│  │Database  │     └─────────────────────────────────┘
│idate │  │error     │                  ↓
│&     │  │return    │     ┌─────────────────────────────────┐
│Redir │  │{message} │     │ 8. Screen reader announces      │
│ect   │  └──────────┘     │    - aria-live="polite"         │
└──────┘        ↓           │    - "Error: Please select..."  │
                │           └─────────────────────────────────┘
                ↓                         ↓
    ┌──────────────────────────┐  ┌─────────────────────────┐
    │ 8. useActionState        │  │ 9. User corrects errors │
    │    updates state         │  │    - Fixes fields       │
    └──────────────────────────┘  │    - Submits again      │
                ↓                  └─────────────────────────┘
    ┌──────────────────────────┐            ↓
    │ 9. Error message shows   │    [Loop back to step 2]
    │    in form               │
    └──────────────────────────┘
```

---

## 💡 10. Best Practices

### ✅ DO's (Nên làm)

#### 1. **Always use server-side validation**

```typescript
// ✅ GOOD - Validate on server
export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({...});
  
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  
  // Continue with validated data
}
```

---

#### 2. **Provide field-specific errors**

```tsx
// ✅ GOOD - Specific errors per field
{state.errors?.customerId && (
  <p className="text-red-500">
    {state.errors.customerId[0]}
  </p>
)}

{state.errors?.amount && (
  <p className="text-red-500">
    {state.errors.amount[0]}
  </p>
)}
```

```tsx
// ❌ BAD - Generic error message
{state.message && (
  <p className="text-red-500">{state.message}</p>
)}
```

---

#### 3. **Use ARIA labels correctly**

```tsx
// ✅ GOOD - Complete ARIA setup
<input
  id="amount"
  aria-describedby="amount-error"  // Connect to error
/>
<div 
  id="amount-error"
  aria-live="polite"     // Announce changes
  aria-atomic="true"     // Read entire content
>
  {/* errors */}
</div>
```

---

#### 4. **Use semantic HTML**

```tsx
// ✅ GOOD
<form>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  <button type="submit">Submit</button>
</form>

// ❌ BAD
<div onClick={handleSubmit}>
  <span>Email</span>
  <div contentEditable />
  <div onClick={submit}>Submit</div>
</div>
```

---

#### 5. **Show friendly error messages**

```typescript
// ✅ GOOD - User-friendly
amount: z.coerce
  .number()
  .gt(0, { message: 'Please enter an amount greater than $0.' })

// ❌ BAD - Technical
amount: z.coerce
  .number()
  .gt(0, { message: 'ERR_AMOUNT_INVALID_GT_ZERO' })
```

---

#### 6. **Test with keyboard only**

```
Tab → Focus moves through fields
Enter → Submit form
Space → Toggle checkboxes/radios
Arrow keys → Navigate select options
Esc → Close modals
```

**All functionality phải accessible via keyboard!**

---

#### 7. **Run ESLint regularly**

```bash
# Before every commit
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

---

### ❌ DON'Ts (Không nên)

#### 1. **❌ Don't rely only on client-side validation**

```tsx
// ❌ BAD - Only client validation
<input 
  required 
  pattern="[0-9]+" 
  min="1"
/>
// Easy to bypass!

// ✅ GOOD - Server validation + optional client
<input required />  // Client hint
// + Server Action với Zod validation
```

---

#### 2. **❌ Don't remove focus outlines**

```css
/* ❌ BAD */
*:focus {
  outline: none;
}

/* ✅ GOOD */
*:focus {
  outline: 2px solid blue;
  outline-offset: 2px;
}

/* Or use custom focus styles */
input:focus {
  border-color: blue;
  box-shadow: 0 0 0 3px rgba(0,0,255,0.1);
}
```

---

#### 3. **❌ Don't use divs for everything**

```tsx
// ❌ BAD
<div onClick={handleSubmit}>
  <div>Name</div>
  <div contentEditable />
</div>

// ✅ GOOD
<form onSubmit={handleSubmit}>
  <label htmlFor="name">Name</label>
  <input id="name" />
</form>
```

---

#### 4. **❌ Don't ignore ESLint warnings**

```bash
# ❌ BAD - Ignore warnings
pnpm lint --quiet

# ✅ GOOD - Fix warnings
pnpm lint
# Then fix issues one by one
```

---

#### 5. **❌ Don't forget alt text**

```tsx
// ❌ BAD
<img src="/profile.jpg" />

// ✅ GOOD - Meaningful alt
<Image src="/profile.jpg" alt="John Doe's profile picture" />

// ✅ GOOD - Decorative image
<Image src="/decoration.jpg" alt="" />  // Empty string for decorative
```

---

## 🎨 11. Advanced Patterns

### Pattern 1: Real-time validation (optional)

```tsx
'use client';

import { useState } from 'react';
import { useActionState } from 'react';

export default function Form({ customers }) {
  const [state, formAction] = useActionState(createInvoice, initialState);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const validateAmount = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setAmountError('Amount must be greater than $0');
    } else {
      setAmountError('');
    }
  };

  return (
    <form action={formAction}>
      <input
        type="number"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          validateAmount(e.target.value);  // Client-side hint
        }}
        onBlur={(e) => validateAmount(e.target.value)}
        aria-describedby="amount-error"
      />
      
      <div id="amount-error" aria-live="polite">
        {/* Show client-side error immediately */}
        {amountError && <p className="text-red-500">{amountError}</p>}
        
        {/* Show server-side error after submit */}
        {state.errors?.amount && (
          <p className="text-red-500">{state.errors.amount[0]}</p>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

### Pattern 2: Loading states

```tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? 'Creating...' : 'Create Invoice'}
    </button>
  );
}

export default function Form({ customers }) {
  const [state, formAction] = useActionState(createInvoice, initialState);

  return (
    <form action={formAction}>
      {/* fields */}
      <SubmitButton />
    </form>
  );
}
```

---

### Pattern 3: Success messages

```typescript
// Server Action
export async function createInvoice(prevState: State, formData: FormData) {
  // ... validation ...
  
  try {
    await sql`INSERT INTO invoices ...`;
    
    return {
      message: 'Invoice created successfully!',  // Success message
      success: true,
    };
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
      success: false,
    };
  }
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

```tsx
// Component
<div aria-live="polite" aria-atomic="true">
  {state.message && (
    <p className={state.success ? 'text-green-500' : 'text-red-500'}>
      {state.message}
    </p>
  )}
</div>
```

---

### Pattern 4: Multi-step forms

```tsx
'use client';

import { useState } from 'react';
import { useActionState } from 'react';

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [state, formAction] = useActionState(createInvoice, initialState);

  return (
    <form action={formAction}>
      {/* Progress indicator */}
      <div role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        Step {step} of 3
      </div>

      {/* Step 1: Customer */}
      {step === 1 && (
        <div>
          <label htmlFor="customer">Customer</label>
          <select id="customer" name="customerId">
            {/* options */}
          </select>
          <button type="button" onClick={() => setStep(2)}>
            Next
          </button>
        </div>
      )}

      {/* Step 2: Amount */}
      {step === 2 && (
        <div>
          <label htmlFor="amount">Amount</label>
          <input id="amount" name="amount" type="number" />
          <button type="button" onClick={() => setStep(1)}>
            Back
          </button>
          <button type="button" onClick={() => setStep(3)}>
            Next
          </button>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div>
          <h3>Review</h3>
          {/* Show summary */}
          <button type="button" onClick={() => setStep(2)}>
            Back
          </button>
          <button type="submit">Submit</button>
        </div>
      )}

      {/* Errors */}
      {state.errors && (
        <div aria-live="polite">
          {Object.entries(state.errors).map(([field, errors]) => (
            <p key={field} className="text-red-500">
              {errors[0]}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
```

---

## 🧪 12. Testing Checklist

### Manual Testing:

- [ ] **Keyboard navigation**
  - Tab through all fields
  - Submit with Enter
  - Navigate select with Arrow keys
  
- [ ] **Screen reader testing**
  - Use NVDA (Windows) or VoiceOver (Mac)
  - Verify labels are read
  - Verify errors are announced
  
- [ ] **Validation testing**
  - Submit empty form → Errors show
  - Submit invalid data → Specific errors
  - Submit valid data → Success
  
- [ ] **Error display**
  - Field-specific errors visible
  - General message shows
  - Errors clear on retry
  
- [ ] **ARIA attributes**
  - aria-describedby connects correctly
  - aria-live announces changes
  - aria-atomic reads full content

---

### Automated Testing:

```typescript
// Example with Jest + Testing Library
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form from './create-form';

test('shows validation errors on submit', async () => {
  render(<Form customers={mockCustomers} />);
  
  // Submit empty form
  const submitButton = screen.getByRole('button', { name: /create invoice/i });
  await userEvent.click(submitButton);
  
  // Check errors appear
  await waitFor(() => {
    expect(screen.getByText(/please select a customer/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter an amount/i)).toBeInTheDocument();
  });
});

test('form has correct ARIA attributes', () => {
  render(<Form customers={mockCustomers} />);
  
  const customerSelect = screen.getByLabelText(/choose customer/i);
  expect(customerSelect).toHaveAttribute('aria-describedby', 'customer-error');
  
  const errorDiv = screen.getByRole('region', { name: /customer error/i });
  expect(errorDiv).toHaveAttribute('aria-live', 'polite');
});
```

---

## 📚 13. Thuật ngữ quan trọng

| Thuật ngữ | Giải nghĩa | Ví dụ |
|-----------|------------|-------|
| **Accessibility (a11y)** | Thiết kế cho mọi người, kể cả người khuyết tật | Screen readers, keyboard nav |
| **Assistive Technology (AT)** | Công nghệ hỗ trợ người khuyết tật | NVDA, JAWS, VoiceOver |
| **ARIA** | Accessible Rich Internet Applications | aria-label, aria-describedby |
| **Screen Reader** | Phần mềm đọc nội dung màn hình | NVDA, JAWS |
| **Semantic HTML** | HTML có ý nghĩa rõ ràng | `<button>` vs `<div>` |
| **useActionState** | React hook manage form state | Returns [state, formAction] |
| **safeParse()** | Zod validation không throw | Returns {success, data/error} |
| **Focus Outline** | Visual indicator của focused element | Blue border khi tab |
| **htmlFor** | Connects label to input | `<label htmlFor="email">` |

---

## 🎯 14. Key Takeaways

1. **Server-side validation is non-negotiable** - Cannot be bypassed
2. **useActionState** manages form state và errors elegantly
3. **Zod safeParse()** validates gracefully without throwing
4. **Field-specific errors** > generic messages
5. **ARIA labels** make forms accessible to screen readers
6. **Semantic HTML** is foundation of accessibility
7. **ESLint plugin** catches issues early
8. **Test with keyboard** và screen readers
9. **Focus outlines** are critical - don't remove!
10. **Validation separation** - Outside try/catch block

---

## 🚀 15. Production Checklist

### Before deploying:

**Validation:**
- [ ] Server-side validation implemented với Zod
- [ ] All fields validated với meaningful messages
- [ ] safeParse() used (not parse())
- [ ] Errors returned correctly from Server Actions

**Accessibility:**
- [ ] All images have alt text
- [ ] All form fields have labels với htmlFor
- [ ] ARIA attributes correctly applied
- [ ] aria-describedby connects errors
- [ ] aria-live="polite" on error containers
- [ ] Focus outlines visible

**Testing:**
- [ ] Tested with keyboard only
- [ ] Tested with screen reader
- [ ] ESLint passes without warnings
- [ ] All validation scenarios tested
- [ ] Error messages clear and helpful

**User Experience:**
- [ ] Field-specific errors show
- [ ] General messages show when needed
- [ ] Loading states during submit
- [ ] Success feedback after actions
- [ ] Forms work without JavaScript (progressive enhancement)

---

## 📖 16. Further Reading

### Official Documentation:
- [Next.js Accessibility](https://nextjs.org/docs/architecture/accessibility)
- [React useActionState](https://react.dev/reference/react/useActionState)
- [Zod Documentation](https://zod.dev/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Learning Resources:
- [web.dev Learn Accessibility](https://web.dev/learn/accessibility/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

### Tools:
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Includes a11y audit
- [NVDA](https://www.nvaccess.org/) - Free screen reader (Windows)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Built-in (Mac/iOS)

---

## 🎉 Summary

**Form validation và accessibility** là 2 yếu tố critical cho production apps:

### Validation Layers:
1. **Client-side** (optional) - Instant feedback
2. **Server-side** (required) - Security
3. **Zod** - Type-safe validation

### Accessibility Foundations:
1. **Semantic HTML** - Foundation
2. **Labels** - Context
3. **ARIA** - Enhanced support
4. **Testing** - Keyboard + Screen readers

**Master these concepts → Build inclusive, secure applications!** ♿✅

---

## 💻 Complete Example Code

```typescript
// Server Action
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const FormSchema = z.object({
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
});

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
```

```tsx
// Form Component
'use client';

import { useActionState } from 'react';
import { createInvoice, State } from '@/app/lib/actions';

export default function CreateInvoiceForm({ customers }) {
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(createInvoice, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {/* Customer */}
      <div>
        <label htmlFor="customer" className="mb-2 block text-sm font-medium">
          Choose customer
        </label>
        <select
          id="customer"
          name="customerId"
          className="block w-full rounded-md border p-2"
          defaultValue=""
          aria-describedby="customer-error"
        >
          <option value="" disabled>Select a customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div id="customer-error" aria-live="polite" aria-atomic="true">
          {state.errors?.customerId?.map((error) => (
            <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="mb-2 block text-sm font-medium">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          placeholder="Enter USD amount"
          className="block w-full rounded-md border p-2"
          aria-describedby="amount-error"
        />
        <div id="amount-error" aria-live="polite" aria-atomic="true">
          {state.errors?.amount?.map((error) => (
            <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-sm font-medium">Status</label>
        <div className="flex gap-4">
          <div>
            <input id="pending" name="status" type="radio" value="pending" />
            <label htmlFor="pending" className="ml-2">Pending</label>
          </div>
          <div>
            <input id="paid" name="status" type="radio" value="paid" />
            <label htmlFor="paid" className="ml-2">Paid</label>
          </div>
        </div>
        <div id="status-error" aria-live="polite" aria-atomic="true">
          {state.errors?.status?.map((error) => (
            <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
          ))}
        </div>
      </div>

      {/* General message */}
      <div aria-live="polite" aria-atomic="true">
        {state.message && (
          <p className="text-sm text-red-500">{state.message}</p>
        )}
      </div>

      <button type="submit" className="rounded-md bg-blue-500 px-4 py-2 text-white">
        Create Invoice
      </button>
    </form>
  );
}
```

Perfect code để start building accessible, validated forms! 🎊