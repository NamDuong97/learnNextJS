// Important: 'use server' directive
// Đặt ở đầu file → Tất cả exports là Server Actions
// Hoặc đặt trong function → Chỉ function đó là Server Action
// Functions không dùng sẽ tự động bị remove khỏi bundle
// file này giống như kiểu controller + service + repository của BE luôn rồi.

'use server';
import { z } from 'zod';
import postgres from 'postgres';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// 1. Define schema khớp với database -- định nghĩa kiểu cho các trường giống db
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),        // ← Tự động convert string → number
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

// 2. Omit các fields sẽ tự generate - hệ thống tự tạo 2 field id và date
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });


// ================================ CREATE =========================================================
export async function createInvoice(formData: FormData) {
    // Try Catch này để file error trong \app\dashboard\invoices\error.tsx bắt được và khởi chạy UI error.tsx
    try {
        // 'use server'; server action chỉ riêng action này thôi
        {
            // Method 1: .get() cho từng field
            // const rawFormData = {
            //     customerId: formData.get('customerId'),
            //     amount: formData.get('amount'),
            //     status: formData.get('status'),
            // };
            // Method 2: Dùng entries() cho nhiều fields
            // const rawFormData = Object.fromEntries(formData.entries());
        }

        // 3. Parse và validate
        const { customerId, amount, status } = CreateInvoice.parse({
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        });
        // Convert dollars → cents => $10.50 → 1050 cents
        const amountInCents = amount * 100;
        // Tạo date format: "YYYY-MM-DD" => "2025-12-05T14:30:00.000Z" → "2025-12-05"
        const date = new Date().toISOString().split('T')[0];

        // 4. Truy vấn và thêm vào CSDL
        // SQL query với template literals => Tự động escape, tránh SQL injection 
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        // We'll also log the error to the console for now
        console.error(error);
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    // 5. Clear cache cho route này => để làm mất dữ liệu cũ đã điền ép nextjs phải rerender lại route này
    revalidatePath('/dashboard/invoices');

    // 6. Redirect user về invoices page => Lần navigate tiếp theo sẽ fetch data mới
    redirect('/dashboard/invoices');
}
// Flow hoàn chỉnh:
// Submit form → Insert DB → revalidatePath() → redirect()
//                               ↓                   ↓
//                         Clear cache         Navigate to /invoices
//                               ↓                   ↓
//                         Fetch fresh data    Hiển thị data mới
//==================END=============================================================================


// ================================ UPDATE =========================================================
export async function updateInvoice(id: string, formData: FormData) {
    // Try Catch này để file error trong \app\dashboard\invoices\error.tsx bắt được và khởi chạy UI error.tsx
    try {
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
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
        // We'll also log the error to the console for now
        console.error(error);
        return { message: 'Database Error: Failed to Update Invoice.' };
    }

    // 4. Revalidate và redirect
    // Xoá (bust) cache của một route, để Next.js buộc server render lại dữ liệu mới lần tiếp theo route đó được truy cập
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');  // không redirect trong try vì redirect hoạt động bằng cách throw một error => Error này sẽ bị catch block bắt → không redirect được!
}
// Flow hoàn chỉnh:
// Submit form → updateInvoiceWithId → updateInvoice(id, formData) → Update DB → revalidatePath() →  redirect()
//                          ↓                    ↓                                   ↓                   ↓
//                      trong form       trong /app/lib/actions.ts               Clear cache        Navigate to /invoices
//                                                                                   ↓                   ↓
//                                                                              Fetch fresh data    Hiển thị data mới
//==================END=============================================================================


// ================================ DELETE =========================================================
export async function deleteInvoice(id: string) {
    try {
        // 1. Delete query
        await sql`DELETE FROM invoices WHERE id = ${id}`;

        // 2. Revalidate cache
        // Xoá (bust) cache của một route, để Next.js buộc server render lại dữ liệu mới lần tiếp theo route đó được truy cập
        revalidatePath('/dashboard/invoices');

        return { message: 'Invoice deleted successfully.' };
    } catch (err) {
        console.error(err);
        return { message: 'Database Error: Failed to Delete Invoice.' };
    }

    // 3. Không cần redirect vì đang ở trang invoices
}
//==================END=============================================================================
