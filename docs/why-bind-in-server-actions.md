# Why We Must Use `.bind()` in Next.js Server Actions  
## Và tại sao `<form action={updateInvoice(id)}>` là sai

---

## ❌ 1. Vì sao `<form action={updateInvoice(id)}>` gây lỗi?

Trong JavaScript, khi bạn viết:

```jsx
<form action={updateInvoice(id)}>
```

Bạn đã **gọi hàm ngay lập tức** (`updateInvoice(id)`) trong lúc render component.

Nhưng **server action không được phép thực thi lúc render**.  
Next.js yêu cầu bạn truyền **function reference**, không phải kết quả trả về từ function.

---

## ✔ 2. `<form action={...}>` cần cái gì?

Next.js yêu cầu:

- `action` phải là một **function reference**
- không được gọi hàm trước
- khi user submit form, Next sẽ tự truyền **FormData** vào function

---

## ❓ 3. Nhưng server action của bạn lại cần thêm `id`?

Ví dụ:

```ts
export async function updateInvoice(id: string, formData: FormData) {
  ...
}
```

Form chỉ truyền được `formData`.  
Nó **không** truyền được `id`.

---

## 🟢 4. Giải pháp: dùng `.bind()` để “khóa” giá trị `id`

```ts
const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
```

`.bind()` tạo một function mới **mà không chạy ngay**.  
Function mới này khi chạy sẽ thực thi:

```ts
updateInvoice(invoice.id, formData)
```

---

## 🤓 5. `.bind()` hoạt động như thế nào?

`.bind(thisArg, arg1, arg2...)` tạo ra một hàm mới mà:

- `this = null`
- tham số đầu tiên luôn = `arg1`
- các tham số còn lại sẽ được truyền khi form submit

---

## 🧪 6. Minh hoạ trực quan

### ❌ Sai
```jsx
<form action={updateInvoice(123)}> // gọi hàm khi render → lỗi
```

### ✅ Đúng
```jsx
<form action={updateInvoice.bind(null, 123)}>
```

---

## 🧠 7. Tóm tắt lý do

| Lý do | Giải thích |
|------|------------|
| `updateInvoice(id)` gọi hàm ngay khi render | server action không được phép chạy lúc render |
| `<form action={...}>` yêu cầu function reference | bạn truyền kết quả thực thi, không phải function |
| Form chỉ truyền được `FormData` | bạn cần `.bind()` để truyền trước `id` |
| `.bind()` tạo ra một function mới với id đã cố định | hợp lệ cho server action |

## Cách hoạt động:

updateInvoice.bind(null, invoice.id)
    ↓
Tạo function mới: (formData) => updateInvoice(invoice.id, formData)
