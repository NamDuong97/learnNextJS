Next.js có thể lưu trữ các tài nguyên tĩnh , chẳng hạn như hình ảnh, trong thư mục cấp cao nhất /public. Các tệp bên trong /publiccó thể được tham chiếu trong ứng dụng của bạn.

Với HTML thông thường, bạn sẽ thêm hình ảnh như sau:
<img
  src="/hero.png"
  alt="Screenshots of the dashboard project showing desktop version"
/>

Tuy nhiên, điều này có nghĩa là bạn phải thực hiện thủ công:

Đảm bảo hình ảnh của bạn tương thích với nhiều kích thước màn hình khác nhau.
Chỉ định kích thước hình ảnh cho các thiết bị khác nhau.
Ngăn chặn việc thay đổi bố cục khi tải hình ảnh.
Tải chậm hình ảnh nằm ngoài tầm nhìn của người dùng.
Tối ưu hóa hình ảnh là một chủ đề lớn trong phát triển web, có thể được coi là một chuyên ngành riêng. Thay vì thực hiện các tối ưu hóa này theo cách thủ công, bạn có thể sử dụng next/imagethành phần này để tự động tối ưu hóa hình ảnh của mình.

Thành phần này <Image>là phần mở rộng của <img>thẻ HTML và đi kèm với tính năng tối ưu hóa hình ảnh tự động, chẳng hạn như:

Ngăn chặn việc thay đổi bố cục tự động khi tải hình ảnh.
Thay đổi kích thước hình ảnh để tránh chuyển hình ảnh lớn sang các thiết bị có cửa sổ xem nhỏ hơn.
Tải hình ảnh chậm theo mặc định (hình ảnh tải khi chúng vào khung nhìn).
Cung cấp hình ảnh ở các định dạng hiện đại, như WebPvà AVIF, khi trình duyệt hỗ trợ.