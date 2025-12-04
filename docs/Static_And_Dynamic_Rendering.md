# Static và Dynamic Rendering

## 📌 Tổng quan
Bài học giải thích hai phương pháp render trong web development và cách chúng ảnh hưởng đến hiệu suất ứng dụng.

---

## 🔷 Static Rendering (Render Tĩnh)

### Định nghĩa
- Dữ liệu được fetch và render trên server tại **thời điểm build** (khi deploy) hoặc khi revalidate data
- Kết quả được **cache** và phục vụ cho mọi user

### Ưu điểm
✅ **Website nhanh hơn** - Nội dung được cache và phân phối toàn cầu qua CDN  
✅ **Giảm tải server** - Không cần generate content cho mỗi request  
✅ **Tốt cho SEO** - Nội dung đã có sẵn, dễ index bởi search engine  

### Khi nào dùng?
- UI không có data hoặc data dùng chung cho tất cả users
- Ví dụ: blog post tĩnh, trang sản phẩm

### Hạn chế
❌ **Không phù hợp với dashboard** - Không phản ánh được thay đổi dữ liệu mới nhất

---

## 🔶 Dynamic Rendering (Render Động)

### Định nghĩa
- Nội dung được render trên server cho **mỗi user tại thời điểm request** (khi user truy cập)

### Ưu điểm
✅ **Real-time data** - Hiển thị dữ liệu thời gian thực hoặc cập nhật thường xuyên  
✅ **Nội dung cá nhân hóa** - Dễ phục vụ dashboard, profile riêng cho từng user  
✅ **Truy cập thông tin request-time** - Có thể đọc cookies, URL parameters  

### Khi nào dùng?
- Ứng dụng cần dữ liệu thường xuyên thay đổi
- Nội dung phụ thuộc vào từng user cụ thể
- Cần thông tin chỉ có tại thời điểm request

---

## ⚠️ Vấn đề với Dynamic Rendering

### Slow Data Fetch
```javascript
// Ví dụ: thêm 3 giây delay giả lập
await new Promise((resolve) => setTimeout(resolve, 3000));
```

### Hậu quả
- **Toàn bộ trang bị block** trong khi chờ data
- Tốc độ ứng dụng = **tốc độ của data fetch chậm nhất**

### Bài học quan trọng
> "Với dynamic rendering, ứng dụng của bạn chỉ nhanh bằng data fetch chậm nhất"

---

## 📊 So sánh nhanh

| Tiêu chí | Static Rendering | Dynamic Rendering |
|----------|------------------|-------------------|
| **Thời điểm render** | Build time | Request time |
| **Tốc độ** | Rất nhanh (cached) | Phụ thuộc data fetch |
| **Data freshness** | Có thể cũ | Luôn mới nhất |
| **Use case** | Blog, landing page | Dashboard, user profile |
| **Server load** | Thấp | Cao hơn |

---

## 💡 Ghi chú
- Dashboard thường cần **dynamic rendering** vì data thay đổi thường xuyên
- Cần tối ưu data fetching để tránh blocking toàn bộ trang
- Trong production, tránh delay giả lập như trong ví dụ