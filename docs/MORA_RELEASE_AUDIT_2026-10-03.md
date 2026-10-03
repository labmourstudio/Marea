# Mora — rà soát tính năng và sửa lỗi 03/10/2026

Thương hiệu: **Mora**, sản phẩm của Mour Studio. Create & Connect — Nơi ý tưởng tìm thấy nhau.

Repository: https://github.com/labmourstudio/Mora

Website hiện tại: https://labmourstudio.github.io/Mora/

## Phạm vi kiểm tra

Đã đọc mã nguồn, luồng đăng nhập, giao diện, schema/migration, chính sách RLS và cấu hình triển khai của repository đang chạy. Giữ nền tảng React/Vite + Supabase và bố cục hiện tại; không viết lại dự án. Không có quyền truy cập SQL Editor hay phiên đăng nhập thật trong lượt làm việc này: **không coi migration trong git là migration đã chạy trên Supabase**. CI dùng PostgreSQL tạm thời với schema auth/storage mô phỏng; không thay thế kiểm tra Auth và Storage API trên Supabase thật.

Không thêm người dùng, bài đăng, dự án, khóa học hoặc số liệu mẫu vào database. Các hồ sơ minh họa Mabi/Morimori cũ vẫn nằm riêng ở `/community`; bỏ thẻ minh họa khỏi danh sách Feed/Learn thật.

## Danh sách tính năng cần có và tình trạng

| Nhóm | Phải có | Tình trạng bản cập nhật |
|---|---|---|
| Nhận diện/giao diện | Mora chữ thông thường; kính mờ; xanh dương/tím; sáng/tối/hệ thống; nav ngang và mobile | Tận dụng bản hiện tại; thêm CSS riêng cho luồng mới, sửa avatar/thống kê hồ sơ, focus bàn phím. |
| Đăng nhập | Email, đăng ký, xác minh, reset mật khẩu, onboarding, giữ link mời | Sửa race khi đổi tài khoản, lỗi tải hồ sơ, giữ đích sau đăng nhập và onboarding; OAuth có redirect callback. Cần cấu hình provider/redirect thực tế. |
| Feed | Thảo luận, ảnh/video/âm thanh, bình chọn, chủ đề, link dự án công khai | Có luồng thật; bình chọn và media video/audio chỉ bật sau migration. Không tự tạo dự án từ bài viết. |
| Tương tác | Like, bình luận, lưu/chia sẻ, sửa/xóa bài của mình, báo cáo | Bổ sung sửa/xóa/báo cáo, lưu theo tài khoản trên thiết bị, tải thêm, mở bài được chia sẻ ngoài 30 bài gần nhất. Chưa có bảng lọc Saved/Following riêng. |
| Hồ sơ | Xem người khác, kết bạn/theo dõi, portfolio, khóa học/bài viết thật | Bổ sung `/u/:username`, chỉnh hồ sơ/avatar/cover, privacy; thẻ bạn bè/tác giả dẫn đến hồ sơ. Chưa có tùy biến layout/màu riêng hoặc danh sách follower đầy đủ. |
| Bạn bè/nhóm | List bạn, lời mời, chỉ nhóm lưu/đã tham gia | Giữ bố cục gọn; nối nhóm riêng tư đến Studio khi backend sẵn sàng. Không liệt kê mọi nhóm. |
| Dự án công khai | Thể loại ngang, bộ lọc, poster 3:4, trang dự án và bài liên kết | Dùng view cho phép công khai đúng trường; khách chưa đăng nhập cũng xem được. Xếp hạng hiện tính trong danh sách đã tải, không gọi là thống kê toàn nền tảng. |
| Không gian cá nhân | Truyện/game/phim/sự kiện; lore, nhân vật, vùng đất, tham chiếu, bảng màu, mục tùy biến | Tận dụng các công cụ hiện có. Worlds cũ giữ nguyên, sao chép sang dự án; không cần tạo World mới. |
| Nhân vật/canvas | Thẻ 3:4, flashart 16:9, kéo thả/zoom/pan/nối quan hệ, vùng đất | Tận dụng canvas hiện có, sửa flashart cloud/public và đường liên kết đến nội dung không được công bố. |
| Game design | Tiền tệ, vật phẩm, skin/series, sự kiện, tính giá | Công cụ trên dự án đã có. Liên kết tướng/tiền tệ **giữa dự án của nhiều tài khoản** và cấp quyền từng thư viện chưa hoàn thiện; không giả vờ đã đồng bộ đa nhóm. |
| Lưu trữ | Local mặc định, autosave rõ trạng thái, backup; chia sẻ có chủ đích | Sửa mất thay đổi khi rời trang; lưu nối tiếp, báo lỗi và xuất dự phòng; backup cloud kèm ảnh. Dữ liệu trên máy không mở được qua link. |
| Cộng tác | Upload riêng tư, owner/editor/viewer, lời mời có hạn, thu hồi | Nối luồng cloud có kiểm tra capability. RPC lưu nguyên tử + version chống ghi đè; link một lần, hạn 7 ngày. Cần áp dụng SQL. Chưa có chỉnh sửa đồng thời realtime/merge tự động. |
| Công bố | Chọn phần đưa vào portfolio; giữ phần khác nội bộ | Snapshot và bản sao ảnh công khai tách khỏi ảnh riêng tư. Có ẩn/công bố lại. Ảnh công khai được phát hành trước đó có thể đã bị lưu/cache. |
| Liên hệ dự án | Cộng tác/chuyên môn/đầu tư và phản hồi | Form thật và inbox trong tab chia sẻ Studio; thông báo phản hồi. Không xử lý giao dịch đầu tư. |
| Learn | Khóa miễn phí, bài học/bài tập, quyền Course Creator, duyệt | Bổ sung đọc khóa và editor văn bản/bài tập; hiển thị media/tài liệu đã có. Sửa tự duyệt và chỉnh bài đã công bố. Upload video/PDF riêng tư cho bản nháp khóa học cần xây tiếp. |
| Thông báo | Bình luận, follow, kết bạn, lời nhắn/phản hồi dự án | Trang thật và trigger database. Chưa có badge realtime, email hay push. |
| Admin | Phân quyền server/database, MFA, duyệt, audit | Chặn UI trước migration; thêm TOTP; RLS/RPC bắt buộc AAL2; khóa đường nâng role ngoài RPC. Chưa có đầy đủ báo cáo/admin content, fresh reauthentication và TTL riêng. |
| PDF | Chọn nội dung, ngang 16:9, giữ ảnh/quan hệ | Luồng in/lưu PDF hiện có; loại dataURL/path khỏi văn bản nhân vật. Cần tiếp tục xử lý phân trang tự động với nội dung dài; bản hiện tại có thể cắt chữ vượt slide. |
| Ngôn ngữ | English mặc định, chọn đầu tiên, cài đặt, không tự dịch bài | Có 11 lựa chọn phần điều hướng; nhiều màn hình chuyên sâu vẫn tiếng Việt. Chưa hoàn tất dịch toàn bộ giao diện. |

## Những lỗi đã sửa trong mã

1. Phiên Auth có thể ghi hồ sơ của tài khoản cũ lên tài khoản mới; lỗi profile bị nhầm thành chưa onboarding.
2. Link mời bị mất sau đăng nhập/xác minh/onboarding.
3. Trang hồ sơ người khác và chi tiết khóa học chưa có; thẻ nội dung không mở được.
4. Lưu bài dùng một khóa chung trên máy; sửa thành theo tài khoản.
5. Link chia sẻ chỉ cuộn đến 30 bài mới nhất; bổ sung truy vấn đúng ID.
6. Feed ghép bảng projects riêng tư nên mất link khi siết RLS; dùng projection công khai riêng.
7. Autosave bị hủy lúc rời editor, cloud upsert nhiều bảng không nguyên tử, thiếu version và sai trường dữ liệu.
8. Bản local nhân bản dùng lại ID khi upload gây va chạm; tạo ID cloud mới và cập nhật tham chiếu.
9. Flashart/ảnh bìa cloud chưa nối đúng; ký URL ngắn hạn, làm mới và không chặn mở văn bản khi một ảnh hỏng.
10. Công bố bỏ sót cover/flashart hoặc giữ dây dẫn tới node riêng tư; chỉ sao chép media của nội dung được chọn.
11. Owner/admin có thể vượt luồng cấp vai trò hoặc requester tự chấp nhận kết bạn; bổ sung trigger kiểm tra.
12. Creator tự xuất bản khóa không qua duyệt; sửa trigger, chỉnh bài công khai quay lại review.
13. Notification có thể bị thay payload; chỉ cho cập nhật read_at.
14. Policy Storage cũ có thể cho viewer xóa file dự án dựa vào owner_id; giới hạn đúng bucket/thư mục và quyền dự án.
15. MIME ảnh có thể bị giả; kiểm tra signature/định dạng/dung lượng, chỉ giữ URL liên hệ http/https.
16. Bundle ban đầu lớn hơn 500 KB; tải editor và trang minh họa theo route.

## Việc cần làm trên Supabase để bật bản cloud

**Không đưa service-role key, mật khẩu database hay khóa MFA vào frontend hoặc chat.**

1. Vào project Supabase hiện đang dùng → SQL Editor. Kiểm tra các bảng/function ở `supabase/verify_release.sql`.
2. Schema gốc `202609220001_initial_marea.sql` đã có trên hệ thống thì **không chạy lại**. Không xóa bảng/seed để thay dữ liệu thật.
3. Chạy **các migration còn thiếu**, đúng thứ tự:
   - `supabase/migrations/202609260001_mora_project_space.sql`
   - `supabase/migrations/202609270001_mora_social_posts.sql`
   - `supabase/migrations/202610030001_mora_integrity.sql`
4. Kiểm tra `select public.mora_capabilities();` trả `version: 3` và bucket `project-drafts` là private.
5. Trên Auth → URL Configuration, Site URL là `https://labmourstudio.github.io/Mora/`; allowlist callback/reset tại `/Mora/auth/callback` và `/Mora/reset-password`. Nếu dùng Vercel, thêm đúng URL mới và callback tương ứng.
6. Owner/Admin thiết lập MFA ở Cài đặt → Xác thực hai bước. Đăng nhập AAL1 không có quyền Admin ở database. Khóa chính sách MFA chỉ hoạt động sau SQL bước 3.
7. Cấp Course Creator bằng Owner đã xác minh MFA. SQL Editor có thể bootstrap tài khoản Owner của chính chủ theo hướng dẫn gốc.
8. Dùng hai tài khoản thật kiểm tra: bản nháp riêng tư; owner mời viewer/editor; viewer không sửa/xuất nếu chưa cấp; editor lưu; thu hồi quyền; chọn công bố đúng một mục; xem bằng cửa sổ chưa đăng nhập; khóa học gửi duyệt; admin AAL1/AAL2; đăng bài/audio/poll; thông báo.

Bản frontend không thay Supabase URL hoặc key hiện có. GitHub Actions secrets vẫn là `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; chỉ dùng anon/publishable key. `VITE_ENABLE_GOOGLE_OAUTH` và `VITE_ENABLE_APPLE_OAUTH` chỉ bật nếu provider đã cấu hình.

Mọi script trong `supabase/tests/` là **CI-only**, không chạy trong Supabase thật.

## Giới hạn bảo mật cần nói đúng

- GitHub Pages là static SPA. Chặn route Admin ở UI không thể trả HTTP 401/403 thật cho request HTML; RLS/RPC bảo vệ dữ liệu tại Supabase. Cần gateway/server khi muốn đáp ứng kiểm tra server cho từng route/HTTP và session TTL riêng.
- Chữ/ảnh cho người được cấp quyền xem vẫn có thể bị ghi lại. Hạn chế Copy chỉ giảm thao tác trong UI, không chống screenshot tuyệt đối.
- Signed URL ảnh riêng tư sống tối đa 10 phút; thu hồi membership chặn cấp URL mới, URL đã ký vẫn có thể sống đến lúc hết hạn.
- Avatar/cover và `course-media` cũ là bucket public. Profile private không biến các file này thành private. Không upload tài liệu khóa học nháp nhạy cảm vào bucket này.
- Kiểm tra signature ở client cải thiện thao tác upload; người gọi trực tiếp Storage API có thể bỏ qua. Cần kiểm tra lại trên server/worker nếu mở upload rộng rãi.
- Cần log mọi thay đổi Admin, rà RPC/permission sau migration, định kỳ sao lưu và diễn tập restore. CI không mô phỏng hết Supabase JWT/Auth/Storage service.

## Ưu tiên tiếp theo trước khi mở cộng đồng rộng

**P0 — vận hành:** áp dụng/kiểm chứng SQL thật; test hai tài khoản; quản lý report và block; hạn mức/rate limit chống spam, CAPTCHA đăng ký; quy trình cấp/khôi phục MFA; backup/restore; xác minh quyền phần mềm/tài sản người dùng đăng.

**P1 — sản phẩm:** liên kết thư viện game theo quyền giữa các dự án; realtime/version history; tìm kiếm dự án/bài/khóa đầy đủ; Following/Saved Feed và chủ đề tùy ý; editor khóa upload riêng tư; upload nhiều media; tin nhắn trực tiếp; PDF dài không cắt; quản lý các file mồ côi/Storage quota.

**P2 — hoàn thiện:** bản địa hóa mọi màn hình; tối ưu CSS và lazy routes thêm; accessibility, E2E đa thiết bị; onboarding cho người xem và người làm dự án; xác minh coming soon/đã gọi vốn; xác nhận brand/domain trước công bố rộng.

Chưa triển khai thu phí, thanh toán, đầu tư trực tiếp hay AI quyết định canon. Không mua hosting/domain hoặc tạo dịch vụ tính phí trong lượt này.
