import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* sử dụng font đã custom */}
      {/* Phần children này sẽ được lấy từ layout của các trang con như dashboard, hoặc page.tsx ngang hàng với nó*/}
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
