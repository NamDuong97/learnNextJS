import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import CardWrapper from '@/app/ui/dashboard/cards';
import { lusitana } from '@/app/ui/fonts';
import { fetchLatestInvoices } from '@/app/lib/data';
import { Suspense } from 'react';
import { RevenueChartSkeleton, CardsSkeleton, LatestInvoicesSkeleton } from '@/app/ui/skeletons';
import { auth } from '@/auth';

export default async function Page() {
    // 3 lời gọi api này dẫn tới việc phải đợi fetchRevenue xong mới gọi đến fetchLatestInvoices cuối cùng
    // mới gọi fetchCardData => điều này k xấu, nhưng hiệu xuất k tốt, chậm
    // 3 lời gọi api này bị thay thế để sử dụng Suspense streaming
    // const revenue = await fetchRevenue();
    // const latestInvoices = await fetchLatestInvoices();
    // const { numberOfCustomers, numberOfInvoices, totalPaidInvoices, totalPendingInvoices } = await fetchCardData();
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <main>
            <h1>Welcome, {session.user.email}!</h1>
            <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
                Dashboard
            </h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Suspense fallback={<CardsSkeleton />}>
                    <CardWrapper />  {/* Wrap tất cả cards */}
                </Suspense>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
                <Suspense fallback={<RevenueChartSkeleton />}>
                    <RevenueChart />
                </Suspense>

                <Suspense fallback={<LatestInvoicesSkeleton />}>
                    <LatestInvoices />
                </Suspense>
            </div>
        </main>
    );
}