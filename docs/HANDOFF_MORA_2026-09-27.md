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
| Tình huống Mabi / Morimori | Có ở `/community` (`/demo` chuyển về đây), một số thẻ mẫu tại Feed/Learn | Bốn người, số theo dõi, dự án, bài đăng và khóa học là **mẫu được gắn nhãn**, lưu trong `src/data/sampleCommunity.js`, không tạo bản ghi Supabase. Bạn bè và Khám phá dự án chỉ đọc dữ liệu thật. Tương tác mẫu chỉ đổi state trong phiên; không tạo bạn bè hay bình chọn thật. File audio người dùng chọn chỉ tạo object URL cục bộ. |
| Dự án cá nhân hiện tại | Tạo/sửa bản nháp **trên thiết bị**, IndexedDB; JSON backup, canvas, PDF | Không dùng một link để chia sẻ bản nháp này. Không nhầm với public Projects hay dữ liệu được Supabase bảo vệ. |
| Truyện và Game Design | Có trên bản nháp thiết bị | Truyện: lore, cốt truyện, nhân vật, địa điểm. Game: gameplay, tướng, kỹ năng, tiền tệ, vật phẩm, dòng skin, sự kiện và quan hệ/chi phí. Các mục game dùng `project_sections` có `section_type='custom'` và `content.category`, tránh đổi enum trong schema cũ. Ảnh canvas và phác thảo vẫn tự lưu trên máy. |
| Sự kiện tham chiếu game gốc | Có giới hạn trên cùng thiết bị và cùng tài khoản | Tạo loại `Game Event`, chọn game gốc, chọn tướng và tiền tệ được tham chiếu; thêm cốt truyện sự kiện, dòng skin và chi phí. Khi mở game gốc trên máy đó, mục Quan hệ & chi phí tóm tắt dòng skin, giá trong game, dự toán của sự kiện. Đây **không phải** lời mời/đồng bộ hoặc kiểm tra quyền server giữa hai tài khoản. Tải JSON riêng lẻ chưa đóng gói các bản nháp liên quan. |
| Gộp Thế giới và Dự án trên giao diện | Có, không xóa dữ liệu cũ | Nav không còn mục Thế giới riêng; `/worlds` chuyển tới `/studio/projects`. Chủ tài khoản có thể **sao chép** các records `worlds`, `characters`, `locations`, `factions`, `items`, `world_events` cũ sang bản dự án riêng trên máy; ảnh phải chọn/gắn lại. Bản gốc vẫn ở Supabase, đọc được ở `/studio/legacy-worlds`. Dữ liệu chỉ lưu ở máy không tự được mời/công khai. |
| Dự án cộng tác và xuất bản có kiểm soát | Mã ở PR #2, **chưa lên live** | Cần chạy migration `202609260001_mora_project_space.sql`, kiểm tra RLS, lời mời/thu hồi, ảnh riêng, owner/editor/viewer, đồng bộ và công khai trước merge. |

## Hiểu đúng Dự án / Feed

- **Dự án cá nhân**: một hồ sơ có cấu trúc cho game/truyện/comic, bao gồm bối cảnh/lore, nhân vật, vùng đất, nhóm và tài liệu. Dự án mới là riêng tư trên thiết bị. Dữ liệu `worlds` Supabase trước đây vẫn nguyên vẹn; nút sao chép tạo **bản mới** ở dự án local, không thay đổi dữ liệu cũ và không tự chuyển ảnh. Mục **Khám phá dự án** chỉ hiển thị dự án `published` và `public/showcase`.
- **Feed**: bài độc lập, không phải dự án; tác giả hoặc người xem có thể tự chọn gắn một bài công khai với một dự án công khai. Trang hoạt động của dự án liệt kê các bài *có liên kết thực sự*, giúp tác giả tìm đóng góp thuận tiện.
- Thẻ mẫu ở Feed/Learn dẫn tới `/community` để xem nhóm Morimori. Người xem đổi vai trò thử, chọn phần giới thiệu công khai, đọc bài từng người, thử thích/bình chọn/bình luận. Không coi tên, lượt theo dõi, lore, khóa học, bài, lời mời hay quan hệ bạn bè mẫu là người dùng và dữ liệu thật.
- **Legacy of Mour chỉ là tài liệu tham khảo để hiểu cấu trúc game. Không chỉnh mã, không nhập danh sách tướng từ Legacy vào Mora và không thay đổi repository Legacy.**

## Mã cần biết

- `src/context/LanguageContext.jsx`: locale, từ điển và lựa chọn đầu tiên. `src/components/LanguageWelcome.jsx`: chọn lúc vào site; `src/pages/SettingsPage.jsx`: đổi sau này.
- `src/context/ThemeContext.jsx` và phần cuối `src/styles.css`: token màu và dark mode, hiệu ứng kính mờ; `src/context/SiteSettingsContext.jsx`: cài đặt diện mạo chung từ Supabase.
- `src/pages/FeedPage.jsx`: đăng bài, upload, bài gắn dự án, comment/poll, hoạt động dự án. `src/data/sampleCommunity.js`, `src/components/CommunityPreview.jsx`, `src/pages/DemoPage.jsx`: tình huống mẫu tích hợp và trang xem sâu, không gửi DB.
- `src/pages/LocalProjectsPage.jsx`, `src/lib/legacyWorlds.js`, `src/pages/ProjectPages.jsx`, `src/lib/localProjects.js`, `src/components/ProjectCanvas.jsx`: bản nháp thiết bị và thao tác sao chép Thế giới cũ.
- `src/lib/projectWorkflows.js`: sơ đồ tab Truyện/Game/Sự kiện và ánh xạ `content.category`. `src/components/GameDesignPanel.jsx`, `src/lib/gameEconomy.js`: tài nguyên, dòng skin, tham chiếu sự kiện cùng máy, giá trong game và ngân sách sản xuất tách riêng.
- `supabase/migrations/202609270001_mora_social_posts.sql`: migration Feed mới; **không seed dữ liệu**. Migration cloud của PR #2 độc lập với Feed; cần kiểm tra thứ tự áp dụng dựa trên schema thật trước khi chạy.
- `src/App.jsx`: tuyến `/settings`, `/community` (`/demo` chuyển về đây), `/projects/:projectId/activity`; Auth guard cho các tuyến riêng.

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
- Nếu muốn sự kiện do người khác làm, cần bảng quan hệ sự kiện↔game trên Supabase, quyền theo từng tướng/tiền tệ, xác thực lời mời, kiểm tra RLS cả lúc cấp và thu hồi quyền, cập nhật game gốc, giải quyết xung đột và cơ chế sao lưu nhóm; không sao chép logic liên kết IndexedDB rồi tuyên bố đó là quyền thật.
- Khóa học ví dụ cần nội dung và quyền Course Creator thật trước khi đăng. Hiện `/demo` chỉ giúp đánh giá bố cục, không tự gán khóa học vào chủ tài khoản.

## Kiểm tra nhanh

```bash
npm ci
npm run lint
GITHUB_ACTIONS=true GITHUB_REPOSITORY=labmourstudio/Mora npm run build
```

Frontend cần `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` của dự án hiện tại; GitHub Actions đã dùng secrets cho Pages. Bản chạy local sử dụng `.env.local` từ `.env.example`. Nếu không có quyền Supabase, có thể sửa giao diện và bản demo, nhưng ghi rõ rằng migration và các luồng gắn dữ liệu còn chờ xác minh.

## Tiếp nối 29/09/2026: khám phá dự án và workspace

- `/projects`: danh sách dự án thật đã `published` với `visibility` public/showcase từ `public.projects`. Dải thể loại cuộn ngang, thẻ 3:4, lọc theo kết bạn và theo dõi của người đăng nhập, hoạt động bài công khai gắn `project_id`, tác giả có lượt theo dõi, đang tìm vốn. Thứ tự hoạt động dựa vào số bài công khai trong danh sách truy vấn có giới hạn; không phải điểm chất lượng hay số liệu giả. Chưa có trường/trình xác minh dự án gọi vốn thành công, nên bộ lọc này tắt. Morimori hiển thị riêng, ghi rõ là kịch bản mẫu.
- `/projects/:projectId`: đọc đúng dự án công khai qua RLS của `projects`; trang có mục lục bên trái, giới thiệu, hồ sơ nhân vật, vùng đất, mục nội dung, sự kiện và đường liên hệ nếu chủ dự án công khai `contact_links`. Nội dung chi tiết từ `project_showcases.public_snapshot` chỉ xuất hiện sau khi PR #2 và migration được triển khai; trước đó trang chỉ có thông tin công khai từ schema gốc. Trang không tải `project_sections`, canvas node hay file từ private bucket cho người xem.
- `/studio/projects`: bìa dự án 3:4 từ `cover_data` trên thiết bị. `/studio/projects/:id`: sidebar theo Game Design hoặc Truyện; toolbar thêm chữ, ô văn bản, khung tròn và dây nối trên bảng, hoặc thêm tướng/nhân vật và vùng đất. Bảng lưu các khối trong `sections` dưới `category:'board_element'`, tách khỏi mục ghi chú thường. Ảnh đại diện nhân vật ở card 3:4; hồ sơ chi tiết 16:9 có flashart, trường Game/Truyện, quan hệ trong canvas. Thay đổi tự lưu vào IndexedDB và được bao gồm trong bản sao lưu JSON. Flashart là `details.flashart_data` nội bộ, không có pipeline public cloud ở bản này.
- Chưa merge PR #2 (`project_showcases`, các bảng nội dung và lời mời). Cần kiểm tra migration, RLS cho hai tài khoản và file private/public trước khi mở đồng bộ, lời mời và công bố từng phần. Không suy diễn rằng bìa hay flashart chỉ có trên máy đã xuất bản được. Legacy of Mour chỉ là nguồn tham khảo về bố cục; repository đó không bị sửa.

## Giao diện gọn và Nhóm, cập nhật 29/09/2026

- Trang `/studio/projects` bỏ banner, lời giới thiệu và nút demo trên khung đầu; người dùng chọn Truyện, Game, Phim ảnh hoặc Sự kiện game, đặt tên và tạo bản nháp. Bản nháp ở phần cuộn tiếp theo. `Film` và `Animation` dùng workflow kịch bản/cảnh quay; dữ liệu vẫn chỉ lưu trên máy.
- `/projects` mở ngay dải thể loại có biểu tượng đơn giản và kết quả có bộ lọc. Dự án có hoạt động công khai được đưa xuống phần tiếp theo khi cuộn; kịch bản Morimori không nằm trong kết quả thật. Icon lưu trên dự án công khai dùng `src/lib/savedProjectGroups.js`, khóa localStorage theo user ID; nó không tự đồng bộ qua thiết bị.
- `/friends` chỉ hiện bạn bè đã chấp nhận, lời mời sau nút riêng, và tab Nhóm. Tab Nhóm truy vấn `project_members` của chính tài khoản cùng các dự án công khai đã lưu trên máy; không tải danh sách mọi nhóm. Dự án nhóm riêng tư chưa mở bằng quyền member trong schema chính hiện tại, nên chỉ hiện thông báo số mục không truy cập được, không tự mở RLS hoặc hiển thị nội dung riêng tư. Chưa có bảng nhóm độc lập và chưa có lời mời nhóm đồng bộ.
- Các phần màn hình ngoài Feed có `mora-screen`, cuộn gần từng khung theo chiều dọc ở desktop; header không phủ chữ, kích thước nhỏ tự dồn hàng. Tránh cố định chiều cao hoặc cắt chữ ở mobile, khi phóng to hay khi nội dung thật dài.
