# Bàn giao Mora · cập nhật 28/09/2026

Tài liệu này dành cho chat hoặc lập trình viên tiếp nối công việc. **Không đưa nội dung tài liệu này lên giao diện sản phẩm.** Tên thương hiệu hiện tại là **Mora** của **Mour Studio**, tagline **Create & Connect** / “Nơi ý tưởng tìm thấy nhau”. Tên Kayo, Mayo và Marea chỉ còn là lịch sử dự án hoặc tên migration ban đầu. Logo hiện tại là chữ Mora thông thường, không có ngôi sao bốn cánh; nền kính mờ thuộc thẻ và panel giao diện.

## Nguồn và địa chỉ

- Repository đã được đổi tên trong lúc phát triển: `https://github.com/labmourstudio/Mora`, nhánh `main` triển khai qua `.github/workflows/deploy-pages.yml` tới `https://labmourstudio.github.io/Mora/`. Đã kiểm tra `/Mora/login`: trang tải JS tại `/Mora/assets/` và hiện màn hình chọn ngôn ngữ/đăng nhập. Đường dẫn Pages cũ `/Marea/login` trả về **404**.
- **Cần hoàn tất cài đặt Auth:** thêm `https://labmourstudio.github.io/Mora/**` trong Supabase Authentication → URL Configuration → Redirect URLs, đổi Site URL thành `https://labmourstudio.github.io/Mora/`. Chưa có quyền kiểm tra hoặc xác nhận các cài đặt này trên Supabase. Email cũ trỏ đến `/Marea/` không tự chuyển vì Pages cũ trả 404; người dùng cần xin lại link trên địa chỉ mới hoặc chủ repo triển khai redirect riêng.
- Vercel có `vercel.json` nhưng trang đang phục vụ qua **GitHub Pages**. Không tự nhận đã chuyển hosting.
- PR dự thảo [#2](https://github.com/labmourstudio/Mora/pull/2) chuẩn bị không gian dự án cộng tác trên Supabase; nhánh đã đồng bộ Feed mới nhưng **chưa merge** vì migration, quyền dữ liệu và luồng 2 tài khoản chưa được xác minh.

## Tình trạng chức năng ở bản này

| Phần | Tình trạng | Dữ liệu lưu ở đâu / lưu ý |
| --- | --- | --- |
| Đăng nhập, profile, Feed văn bản, Friends, Worlds, Learn, Admin | Có hạ tầng Supabase hiện tại; không thay schema cũ | Supabase Auth/Postgres/Storage với RLS từ `202609220001_initial_marea.sql`. Kiểm tra bằng tài khoản thật. |
| Trang đầu tiên chọn ngôn ngữ | Có | English mặc định nếu chưa chọn; người dùng cũ giữ lựa chọn đã lưu. Chọn lại trong Cài đặt. |
| Chế độ sáng/tối/theo hệ điều hành | Có | Lưu lựa chọn tại máy qua localStorage; dark mode tạo vùng đen/xanh tím. OLED có thể dùng ít điện hơn tùy độ sáng, không cam kết tỷ lệ tiết kiệm. |
| 11 tùy chọn ngôn ngữ | **Một phần** | Menu, Cài đặt, Feed và đăng nhập có bản dịch cốt lõi; onboarding EN/VI; các trang Worlds/Projects/Studio cũ còn tiếng Việt và chưa được dịch đầy đủ. Nội dung do người dùng đăng không tự dịch. |
| Feed ảnh | Code hỗ trợ upload 1 ảnh tối đa 8 MB lên `project-media` hiện tại, tạo bài thật và xóa file nếu ghi bài thất bại | Cần test sau đăng nhập qua Supabase. |
| Feed chủ đề và liên kết dự án | Code dùng cột `posts.hashtags`, `posts.project_id` hiện tại; chỉ chọn dự án **đã xuất bản công khai** | Người khác có thể liên kết dự án công khai; liên kết hiện ở thẻ bài và `/projects/:projectId/activity`. Gửi bài không tạo hay công bố dự án. |
| Like, bình luận, sao chép/chia sẻ, lưu bài | Code dùng reactions/comments hiện tại; lưu bài chỉ ở localStorage trên thiết bị | Cần test với hai tài khoản thật. |
| Bình chọn thật | **Chưa có trên Supabase live** | SQL `supabase/migrations/202609270001_mora_social_posts.sql` tạo options, votes, RLS, RPC kết quả. Trước khi chạy, UI báo thiếu migration và không đăng dữ liệu sai. |
| Video / âm thanh thật | **Chưa có trên Supabase live** | SQL mới tạo bucket công khai `post-media` (40 MB, MIME whitelist) và RLS theo owner. Trước khi chạy, UI báo thiếu migration. Tuyệt đối không giới thiệu là đã có audio thật trên Feed live. |
| Demo nhóm Mabi / Morimori | Có, chỉ tại `/demo` sau khi đăng nhập | Mabi và ba cộng sự, số theo dõi giả định, trạng thái bạn bè giả định, dự án nhóm, bài đăng và khóa học được đánh dấu **DEMO**, render trong React và không ghi Supabase. Bài bình chọn, quyền và lựa chọn công khai chỉ đổi state ở trang demo. File audio người dùng chọn chỉ tạo object URL cục bộ. |
| Dự án cá nhân hiện tại | Tạo/sửa bản nháp **trên thiết bị**, IndexedDB; JSON backup, canvas, PDF | Không dùng một link để chia sẻ bản nháp này. Không nhầm với public Projects hay dữ liệu được Supabase bảo vệ. |
| Gộp Thế giới và Dự án trên giao diện | Có, không xóa dữ liệu cũ | Nav không còn mục Thế giới riêng; `/worlds` chuyển tới `/studio/projects`. Chủ tài khoản có thể **sao chép** các records `worlds`, `characters`, `locations`, `factions`, `items`, `world_events` cũ sang bản dự án riêng trên máy; ảnh phải chọn/gắn lại. Bản gốc vẫn ở Supabase, đọc được ở `/studio/legacy-worlds`. Dữ liệu chỉ lưu ở máy không tự được mời/công khai. |
| Dự án cộng tác và xuất bản có kiểm soát | Mã ở PR #2, **chưa lên live** | Cần chạy migration `202609260001_mora_project_space.sql`, kiểm tra RLS, lời mời/thu hồi, ảnh riêng, owner/editor/viewer, đồng bộ và công khai trước merge. |

## Hiểu đúng Dự án / Feed

- **Dự án cá nhân**: một hồ sơ có cấu trúc cho game/truyện/comic, bao gồm bối cảnh/lore, nhân vật, vùng đất, nhóm và tài liệu. Dự án mới là riêng tư trên thiết bị. Dữ liệu `worlds` Supabase trước đây vẫn nguyên vẹn; nút sao chép tạo **bản mới** ở dự án local, không thay đổi dữ liệu cũ và không tự chuyển ảnh. Mục **Khám phá dự án** chỉ hiển thị dự án `published` và `public/showcase`.
- **Feed**: bài độc lập, không phải dự án; tác giả hoặc người xem có thể tự chọn gắn một bài công khai với một dự án công khai. Trang hoạt động của dự án liệt kê các bài *có liên kết thực sự*, giúp tác giả tìm đóng góp thuận tiện.
- `/demo` mô phỏng Mabi và ba người bạn cùng xây dựng Morimori; người xem đổi vai trò thử, chọn phần giới thiệu công khai, đọc bài Feed từng người, thử thích/bình chọn/bình luận. Không coi tên, lượt theo dõi, lore, khóa học, bài, lời mời hay quan hệ bạn bè mẫu là người dùng và dữ liệu thật.

## Mã cần biết

- `src/context/LanguageContext.jsx`: locale, từ điển và lựa chọn đầu tiên. `src/components/LanguageWelcome.jsx`: chọn lúc vào site; `src/pages/SettingsPage.jsx`: đổi sau này.
- `src/context/ThemeContext.jsx` và phần cuối `src/styles.css`: token màu và dark mode, hiệu ứng kính mờ; `src/context/SiteSettingsContext.jsx`: cài đặt diện mạo chung từ Supabase.
- `src/pages/FeedPage.jsx`: đăng bài, upload, bài gắn dự án, comment/poll, hoạt động dự án. `src/pages/DemoPage.jsx`: ví dụ riêng, không gửi DB.
- `src/pages/LocalProjectsPage.jsx`, `src/lib/legacyWorlds.js`, `src/pages/ProjectPages.jsx`, `src/lib/localProjects.js`, `src/components/ProjectCanvas.jsx`: bản nháp thiết bị và thao tác sao chép Thế giới cũ.
- `supabase/migrations/202609270001_mora_social_posts.sql`: migration Feed mới; **không seed dữ liệu**. Migration cloud của PR #2 độc lập với Feed; cần kiểm tra thứ tự áp dụng dựa trên schema thật trước khi chạy.
- `src/App.jsx`: tuyến `/settings`, `/demo`, `/projects/:projectId/activity`; Auth guard cho các tuyến riêng.

## Đưa lên môi trường thật một cách an toàn

1. Xác định SHA của `main`, kiểm tra GitHub Actions CI và Pages tại `/Mora/` sau khi đổi tên repository. Cập nhật Supabase Auth Redirect URLs và Site URL cho `/Mora/`, thử đăng ký/email xác minh/đặt lại mật khẩu. Sau khi chạy migration nào, xác nhận schema đã tồn tại tại chính dự án Supabase mà `VITE_SUPABASE_URL` trỏ tới. **Không chạy lại initial migration trên dữ liệu hiện có.**
2. Để bật poll/audio/video, áp dụng `202609270001_mora_social_posts.sql` qua quyền quản trị Supabase (SQL Editor) trên dự án hiện tại. Kiểm tra lỗi migration; sau đó làm mới schema cache nếu cần. Không đưa service-role key vào mã client hoặc GitHub.
3. Kiểm tra với **hai tài khoản thật**: người A đăng ảnh, video, audio và poll; người B xem, bình chọn, bình luận, gắn bài với dự án công khai A; A xem bài tại `/projects/{id}/activity`. Kiểm tra dự án riêng tư không có trong selector hoặc hoạt động công khai, bình chọn không được vote vào phương án của bài khác, file chỉ ghi dưới đường dẫn UID của người đăng.
4. Xác minh UI trên desktop/tablet/mobile, sáng/tối, reload thẳng các tuyến khi dùng GitHub Pages. Không tự công bố bài demo. Giữ PR #2 là draft cho đến khi test migration cộng tác độc lập.
5. Repo đã mang tên Mora; không coi việc đổi tên repo là hoàn tất chuyển địa chỉ đăng nhập. Nếu muốn hỗ trợ liên kết email cũ `/Marea/`, phải có nơi phục vụ redirect riêng; chỉ giữ URL trong cấu hình Auth không sửa được lỗi 404 của Pages.

## Ưu tiên tiếp theo

- Hoàn chỉnh bản dịch mọi trang còn hardcode tiếng Việt; hiện 11 locale là phần giao diện cốt lõi, chưa phải toàn website hoàn chỉnh.
- Test và khắc phục lỗi thật của Feed sau migration, phân trang, hạn chế spam và duyệt ảnh/video. Poll nên chốt thời hạn, không cho sửa lựa chọn sau khi vote; theo dõi storage quota gói miễn phí.
- Khi PR #2 đã có migration và kiểm chứng RLS/media, nối dự án local lên cloud với thao tác chủ động của chủ dự án, thêm project inbox cho bài liên kết và thông báo. Không phát hành giả định việc mời cộng tác vào bản nháp chỉ lưu trên thiết bị.
- Khóa học ví dụ cần nội dung và quyền Course Creator thật trước khi đăng. Hiện `/demo` chỉ giúp đánh giá bố cục, không tự gán khóa học vào chủ tài khoản.

## Kiểm tra nhanh

```bash
npm ci
npm run lint
GITHUB_ACTIONS=true GITHUB_REPOSITORY=labmourstudio/Mora npm run build
```

Frontend cần `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` của dự án hiện tại; GitHub Actions đã dùng secrets cho Pages. Bản chạy local sử dụng `.env.local` từ `.env.example`. Nếu không có quyền Supabase, có thể sửa giao diện và bản demo, nhưng ghi rõ rằng migration và các luồng gắn dữ liệu còn chờ xác minh.
