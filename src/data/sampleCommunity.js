// Editorial scenario shown in the interface. No account, friendship, follow,
// course, post or project is created in Supabase by this module.
export const samplePeople = [
  { id: 'mabi', name: 'Mabi', handle: '@mabi_preview', role: 'Chủ dự án · Thiết kế game', color: '#4967d3', followers: '12.800', bio: 'Đang phát triển game Morimori, chia sẻ quá trình sáng tạo và một khóa học miễn phí trong kịch bản này.' },
  { id: 'mina', name: 'Mina', handle: '@mina_preview', role: 'Thiết kế nhân vật', color: '#9464bb', bio: 'Phác họa nhân vật và thử biểu cảm, dáng hình cho dự án.' },
  { id: 'an', name: 'An Nhiên', handle: '@annhien_preview', role: 'Biên kịch · Lore', color: '#387a9d', bio: 'Ghi cốt truyện, bối cảnh và mối liên hệ giữa các nhân vật.' },
  { id: 'lam', name: 'Bảo Lam', handle: '@baolam_preview', role: 'Chiến lược dự án', color: '#5d71aa', bio: 'Lên kế hoạch tổng thể, đưa câu hỏi ra cộng đồng để thử ý tưởng.' },
]

export const sampleProjectTabs = [
  { id: 'overview', title: 'Tổng quan', owner: 'Mabi', text: 'Một dự án game chung: nhóm lưu kế hoạch, nhân vật và bối cảnh ở cùng một nơi. Không có “Thế giới” tách rời dự án.', detail: 'Bản làm việc có thể chứa cả phần nội bộ lẫn phần được chọn để giới thiệu.' },
  { id: 'character', title: 'Nhân vật', owner: 'Mina', text: 'Mina đang phác thảo Heo con: hình dáng, biểu cảm, ghi chú tạo hình và một đoạn thoại thử.', detail: 'Ảnh phác và ghi chú vẫn riêng tư cho đến khi nhóm chọn công bố.' },
  { id: 'lore', title: 'Bối cảnh & lore', owner: 'An Nhiên', text: 'An Nhiên sắp xếp bối cảnh, câu chuyện và quan hệ nhân vật ngay trong Morimori.', detail: 'Canvas nhân vật và vùng đất thuộc dự án này, không cần tạo một world khác.' },
  { id: 'strategy', title: 'Kế hoạch', owner: 'Bảo Lam', text: 'Bảo Lam theo dõi hướng phát triển game, cách giới thiệu và câu hỏi cần đưa ra cộng đồng.', detail: 'Nhóm có thể đăng một câu hỏi lên Feed mà không công khai toàn bộ tài liệu.' },
]

export const samplePosts = [
  { id: 'mabi', author: 'Mabi', title: 'Cập nhật nhóm Morimori', text: 'Bọn mình vừa gom nhân vật, cốt truyện và kế hoạch phát triển vào cùng một dự án. Tuần này sẽ chia sẻ phần mà cả nhóm đã đồng ý công bố.', tag: 'Tiến độ' },
  { id: 'mina', author: 'Mina', title: 'Nhân vật Heo con', text: 'Mình đang thử vài biểu cảm cho Heo con. Mọi người muốn xem bản phác hay thử giọng nói trước?', tag: 'Thiết kế nhân vật' },
  { id: 'an', author: 'An Nhiên', title: 'Viết lore cùng nhóm', text: 'Mình đang nối các mốc câu chuyện với thiết kế nhân vật để người xem hiểu vì sao Heo con lại hành động như vậy.', tag: 'Lore' },
  { id: 'lam', author: 'Bảo Lam', title: 'Hỏi ý kiến khán giả', text: 'Nếu theo dõi quá trình làm game, mọi người muốn đội ngũ chia sẻ nội dung nào trước?', tag: 'Bình chọn' },
]

export const sampleCourse = {
  title: 'Từ ý tưởng nhân vật đến dự án game',
  description: 'Mabi chia sẻ cách biến phác thảo thành hồ sơ nhân vật, đưa lore vào dự án và trình bày phần đã được nhóm chọn công khai.',
  chapters: ['Tìm hình dáng và vai trò nhân vật', 'Gắn nhân vật với lore và gameplay', 'Chọn nội dung để giới thiệu dự án'],
}
