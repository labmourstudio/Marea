# Mayo: kiến trúc dữ liệu và quyền truy cập

Ứng dụng tiếp tục dùng Supabase Auth, Postgres RLS và Supabase Storage. Schema gốc giữ nguyên trong `202609220001_initial_marea.sql`; migration Mayo là `202609260001_mayo_project_space.sql`. Giao diện đặt trên GitHub Pages chỉ là client, nên việc ẩn một nút hay một đường dẫn không cấp quyền.

## Ranh giới dữ liệu dự án

`projects` chứa metadata có thể có thông tin nội bộ như `description`, `contact_links`, `media_paths`, `share_token`. RLS cho phép chủ dự án, thành viên được mời và nhân sự được phép đọc hàng này. View `project_showcases` chỉ chứa các trường đã chỉ định và snapshot công khai, đồng thời chỉ hiển thị dự án đã xuất bản từ chủ tài khoản đang hoạt động. `project_sections`, `project_canvas_nodes`, `project_canvas_links`, `project_events` và bucket `project-drafts` chỉ được truy cập qua chính sách thành viên dự án. Feed có bảng `posts` và bucket `feed-media` riêng; đăng bài không tạo dự án.

Lời mời là token ngẫu nhiên dùng một lần, hết hạn sau bảy ngày, chấp nhận qua `accept_project_invitation()`. Hàm xác minh tài khoản hoạt động và nhập người dùng vào `project_members`. Chủ dự án có thể thu hồi lời mời chưa dùng bằng `revoke_project_invitation()`. Role `viewer` xem được nội dung riêng của dự án; `editor` sửa được. Chỉ chủ dự án sửa metadata và công bố dự án.

Bucket `project-media` cũ vẫn là bucket công khai và chỉ dùng cho ảnh **được tác giả chọn** ở bản giới thiệu. Ảnh nội bộ mới phải nằm trong bucket `project-drafts`. Khi chuyển dữ liệu của một dự án đã tồn tại trước migration, kiểm tra object trong `project-media` trước khi coi ảnh là riêng tư. Tại thời điểm kiểm kê cho lần đổi tên, số dự án, thành viên và object trong bucket cũ đều bằng 0; đây là ảnh chụp trạng thái, không phải ràng buộc vĩnh viễn.

## Giới hạn kỹ thuật

- IndexedDB trên máy không được đồng bộ, mã hóa riêng hoặc sao lưu tự động ngoài trình duyệt. Người dùng chủ động xuất JSON để dự phòng và xác nhận toàn bộ dữ liệu sẽ lên cloud trước khi mời cộng tác.
- Storage có RLS cho quyền xem và tải bản riêng tư. Khi một người đã được cấp quyền xem ảnh trong trình duyệt, ứng dụng không thể ngăn họ lưu byte ảnh hay chụp màn hình. Cờ `allow_export` chỉ chi phối nút xuất PDF trong giao diện và không phải DRM.
- Bản PDF dùng CSS `@page` 320 × 180 mm và chức năng Print/Save as PDF của trình duyệt. Cách chọn khổ, tỉ lệ hoặc in nền tùy trình duyệt và hệ điều hành.
- Các lời nhắn hỏi đầu tư chỉ là trao đổi liên hệ; ứng dụng không xử lý đầu tư, thanh toán hoặc cam kết tài chính.

## Quản trị

Auth, quyền Owner/Admin và nhật ký thay đổi của Marea vẫn được giữ. Các thao tác quản trị hiện có dùng RPC kiểm tra quyền tại database và ghi audit. GitHub Pages không phải máy chủ có phiên Admin riêng; yêu cầu 401/403 tại lớp HTTP cho route `/admin`, MFA bắt buộc, phiên Admin ngắn, tái xác minh hành động quan trọng, phục hồi giao diện, sao lưu và báo cáo vẫn cần backend/gateway và cấu hình Supabase bổ sung trước khi tuyên bố đạt chuẩn vận hành. Đừng gọi chức năng giao diện hiện có là cơ chế thực thi các kiểm soát chưa triển khai.
