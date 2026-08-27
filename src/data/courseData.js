/**
 * Dữ liệu môn học và chương trình đào tạo
 * Học phần: 4237010467 - Nhà máy điện và trạm biến áp
 */

export const COURSE_INFO = {
  code: "4237010467",
  name: "Nhà máy điện và trạm biến áp",
  credits: 3,
  academicYear: "2026 - 2027",
  semester: "HK1 (2026 - 2027)",
  faculty: "Khoa Công nghệ Điện",
  major: "Công nghệ kỹ thuật điện, điện tử",
  degree: "Đại học - Liên thông CĐ->ĐH VLVH",
  cohort: "DHDI21AVL",
  instructor: {
    name: "TS. Nguyễn Ngọc Tuyến",
    title: "Giảng viên",
    email: "nguyenngoctuyen@iuh.edu.vn",
    phone: "0908.xxx.xxx",
    office: "",
    avatar: "/instructor.jpg"
  },
  description: "Học phần trang bị cho sinh viên kiến thức chuyên sâu về sơ đồ nối điện chính, lựa chọn thiết bị điện cao áp trong nhà máy điện và trạm biến áp, tính toán dòng ngắn mạch, hệ thống tự dùng, chống sét và nối đất an toàn trong hệ thống điện công nghiệp và truyền tải.",
  totalStudents: 70,
  totalClasses: 5,
  sheetUrl: "https://docs.google.com/spreadsheets/d/14tqLynkXE4gAkya9wSJeBTfE8zGLyIt13GmNiO5JpOM/edit?usp=sharing",
  supportProgramUrl: "/mo-phong-chuong-3.html",
  supportVideoUrl: "https://youtu.be/nwzSas57CNo",
  supportVideoEmbed: "https://www.youtube.com/embed/nwzSas57CNo?autoplay=0&rel=0"
};

export const ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Thông báo về việc cập nhật Ảnh thẻ 3x4 và kích hoạt tài khoản E-Learning",
    date: "28/08/2026",
    badge: "Quan trọng",
    type: "important",
    author: "Ban Cán sự & Giảng viên",
    content: "Yêu cầu toàn bộ sinh viên 5 lớp thuộc khóa DHDI21AVL khẩn trương hoàn thiện đăng ký thông tin cá nhân và cập nhật ảnh thẻ 3x4 để Ban Quản trị phê duyệt và cấp quyền truy cập vào 'Chương trình hỗ trợ sư phạm'."
  }
];

export const CHAPTERS = [
  {
    id: 1,
    week: "Tuần 01 - 02",
    title: "Chương 1: Tổng quan về Nhà máy điện và Trạm biến áp",
    progress: 100,
    items: [
      { id: "1.1", type: "video", title: "Video Bài giảng: Phân loại nhà máy điện (Nhiệt điện, Thủy điện, Điện mặt trời, Điện gió)", duration: "45 phút", completed: true },
      { id: "1.2", type: "pdf", title: "Slide bài giảng Chương 1 - TS. Nguyễn Ngọc Tuyến", size: "4.8 MB", completed: true },
      { id: "1.3", type: "doc", title: "Tài liệu đọc thêm: Tiêu chuẩn thiết kế Trạm biến áp 110kV EVN", size: "2.1 MB", completed: true }
    ]
  },
  {
    id: 2,
    week: "Tuần 03 - 05",
    title: "Chương 2: Sơ đồ nối điện chính trong Nhà máy điện và Trạm biến áp",
    progress: 75,
    items: [
      { id: "2.1", type: "video", title: "Video Bài giảng: Sơ đồ một thanh góp, hai thanh góp, sơ đồ cầu, sơ đồ đa giác", duration: "60 phút", completed: true },
      { id: "2.2", type: "pdf", title: "Slide bài giảng Chương 2: Phân tích độ tin cậy cung cấp điện", size: "6.2 MB", completed: true },
      { id: "2.3", type: "quiz", title: "Trắc nghiệm kiểm tra nhanh kiến thức Chương 2 (15 câu)", duration: "20 phút", completed: false }
    ]
  },
  {
    id: 3,
    week: "Tuần 06 - 08",
    title: "Chương 3: Lựa chọn khí cụ điện và dây dẫn cao áp",
    progress: 30,
    items: [
      { id: "3.1", type: "video", title: "Video Bài giảng: Máy cắt điện cao áp SF6, Dao cách ly, TI, TU, Chống sét van", duration: "55 phút", completed: false },
      { id: "3.2", type: "pdf", title: "Slide bài giảng Chương 3: Kiểm tra ổn định nhiệt và ổn định lực điện động", size: "5.5 MB", completed: false },
      { id: "3.3", type: "exercise", title: "Bài tập 01: Tính toán chọn máy cắt và thanh cái trạm 110kV", deadline: "30/09/2026", completed: false }
    ]
  },
  {
    id: 4,
    week: "Tuần 09 - 11",
    title: "Chương 4: Hệ thống tự dùng trong NMĐ và TBA",
    progress: 0,
    items: [
      { id: "4.1", type: "video", title: "Hệ thống tự dùng xoay chiều (AC) và một chiều (DC / Ắc quy)", duration: "50 phút", completed: false },
      { id: "4.2", type: "pdf", title: "Slide bài giảng Chương 4", size: "3.9 MB", completed: false }
    ]
  },
  {
    id: 5,
    week: "Tuần 12 - 15",
    title: "Chương 5: Hệ thống nối đất và Chống sét bảo vệ công trình điện",
    progress: 0,
    items: [
      { id: "5.1", type: "video", title: "Thiết kế hệ thống nối đất an toàn và chống sét đánh trực tiếp", duration: "65 phút", completed: false },
      { id: "5.2", type: "exercise", title: "Bài tập lớn kết thúc học phần: Bản vẽ hoàn chỉnh TBA phân phối", deadline: "15/11/2026", completed: false }
    ]
  }
];

export const ASSIGNMENTS = [
  {
    id: "BTL-01",
    title: "Bài tập lớn số 01: Thiết kế sơ đồ nối điện chính và lựa chọn thiết bị cho Trạm biến áp 110/22kV",
    chapter: "Chương 2 & 3",
    status: "Đang mở",
    deadline: "23:59 - 30/09/2026",
    maxScore: 10,
    submitted: false,
    requirements: "File báo cáo định dạng PDF kèm bản vẽ AutoCAD (.dwg hoặc xuất PDF A3). Trình bày rõ ràng công thức tính toán dòng định mức, dòng ngắn mạch và bảng so sánh chọn thiết bị."
  },
  {
    id: "KTGK-01",
    title: "Bài kiểm tra giữa kỳ: Trắc nghiệm và Tự luận tổng hợp",
    chapter: "Chương 1, 2, 3",
    status: "Sắp mở",
    deadline: "19:00 - 15/10/2026",
    maxScore: 10,
    submitted: false,
    requirements: "Thời gian làm bài: 60 phút trực tuyến trên hệ thống E-Learning. Camera giám sát và xác thực bằng ảnh thẻ 3x4."
  }
];

export const SCHEDULE = [
  { day: "Thứ 7", time: "13:30 - 17:00", subject: "Nhà máy điện & TBA (Lý thuyết)", room: "Online Zoom / Giảng đường X3.01", status: "Tuần này" },
  { day: "Chủ nhật", time: "08:00 - 11:30", subject: "Nhà máy điện & TBA (Bài tập & Thảo luận)", room: "Phòng máy tính V11.02", status: "Tuần này" },
  { day: "Thứ 4", time: "19:00 - 21:00", subject: "Hướng dẫn Chương trình hỗ trợ sư phạm", room: "Online Webinar", status: "Sắp diễn ra" }
];
