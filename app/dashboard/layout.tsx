import SideNav from '@/app/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
                <SideNav />
            </div>
            {/* Phần children này sẽ được lấy từ layout của các trang con như customers, invoices, hoặc page.tsx ngang hàng với nó*/}
            <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
        </div>
    );
}