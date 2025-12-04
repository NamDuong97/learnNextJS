// /app/dashboard/loading.tsx
// file này dùng để hiển thị thay thế cho page dashboard trong khi gọi api, có api thì sẽ hiển thị page chính

import { DashboardSkeleton } from '@/app/ui/skeletons';

export default function Loading() {
    return <DashboardSkeleton />;
}

// Next.js tự động tạo <Suspense> boundary cho toàn bộ page dashboard
//Suspense = Bộ khung chờ + Khi component sẵn sàng → thay thế UI thật vào.

// export default function Loading() {
//     return <p>Test loading...</p>;
// }