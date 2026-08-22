/**
 * Detailed Lecture Materials & Curriculum Database
 * Học phần: 4237010467 - Nhà máy điện và trạm biến áp
 * Trường Đại học Công nghiệp TP. Hồ Chí Minh (IUH)
 * Giảng viên: TS. Nguyễn Ngọc Tuyến
 */

export const LECTURE_MATERIALS = {
  "1.1": {
    id: "1.1",
    chapterId: 1,
    title: "Video Bài giảng: Phân loại nhà máy điện (Nhiệt điện, Thủy điện, Điện mặt trời, Điện gió)",
    type: "video",
    duration: "45 phút",
    videoUrl: "https://www.youtube.com/watch?v=bgNL3jnVJVg",
    videoEmbedUrl: "https://www.youtube.com/embed/bgNL3jnVJVg",
    description: "Bài giảng cung cấp kiến thức nền tảng về cấu trúc hệ thống điện quốc gia, nguyên lý làm việc và so sánh các loại nhà máy điện: Nhiệt điện, Thủy điện, Điện mặt trời và Điện gió tại Việt Nam.",
    sections: [
      {
        heading: "1. Cấu trúc Hệ thống Điện Quốc gia Việt Nam",
        content: `
          Hệ thống điện bao gồm các khâu: <strong>Sản xuất (Nguồn điện) &rarr; Truyền tải &rarr; Phân phối &rarr; Tiêu thụ</strong>.
          <ul>
            <li><strong>Lưới điện Siêu cao áp:</strong> 500 kV (Trục xương sống Bắc - Nam liên kết hệ thống toàn quốc).</li>
            <li><strong>Lưới điện Cao áp:</strong> 220 kV và 110 kV (Truyền tải từ nhà máy điện đến các trung tâm phụ tải khu vực).</li>
            <li><strong>Lưới điện Trung áp:</strong> 22 kV (Cấp điện áp phân phối chuẩn tại Việt Nam).</li>
            <li><strong>Lưới điện Hạ áp:</strong> 380 V / 220 V (Cấp điện áp trực tiếp cho sinh hoạt và công nghiệp nhẹ).</li>
          </ul>
        `
      },
      {
        heading: "2. Phân loại các Nhà máy điện chính",
        content: `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 10px;">
            <div style="background: var(--bg-glass-strong); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <h5 style="color: #2563eb; margin-bottom: 6px;"><i class="fa-solid fa-water"></i> Thủy điện (Hydro Power)</h5>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">Sử dụng thế năng của nước để quay turbine thủy lực kéo máy phát điện. Ưu điểm: Khởi động nhanh (3 - 5 phút), giá thành vận hành rẻ, tham gia điều tần và phủ đỉnh biểu đồ phụ tải. Các NMĐ lớn: Sơn La (2.400 MW), Hòa Bình (1.920 MW), Lai Châu (1.200 MW).</p>
            </div>
            <div style="background: var(--bg-glass-strong); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <h5 style="color: #d97706; margin-bottom: 6px;"><i class="fa-solid fa-fire-flame-curved"></i> Nhiệt điện Than & Khí (Thermal / Gas)</h5>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">Chuyển hóa nhiệt năng từ đốt than / khí gas thành cơ năng qua turbine hơi / khí. Đóng vai trò cung cấp phụ tải đáy liên tục và ổn định công suất nền cho hệ thống điện.</p>
            </div>
            <div style="background: var(--bg-glass-strong); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <h5 style="color: #059669; margin-bottom: 6px;"><i class="fa-solid fa-solar-panel"></i> Năng lượng tái tạo (Solar & Wind)</h5>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">Điện mặt trời và Điện gió phát triển mạnh tại miền Trung và Tây Nguyên. Đặc điểm: Phụ thuộc thời tiết, biến thiên công suất lớn, đòi hỏi hệ thống lưu trữ năng lượng BESS và điều độ linh hoạt.</p>
            </div>
          </div>
        `
      },
      {
        heading: "3. Vai trò của Trạm biến áp trong Hệ thống điện",
        content: `
          <p style="line-height: 1.7;">
            Trạm biến áp (TBA) có chức năng biến đổi điện áp từ cấp này sang cấp khác để giảm tổn thất công suất truyền tải:
            <br>
            <span class="formula-box"><strong>&Delta;P = [ (P<sup>2</sup> + Q<sup>2</sup>) / U<sup>2</sup> ] &times; R</strong></span>
            <br>
            Khi tăng điện áp truyền tải lên <strong>n</strong> lần thì tổn thất công suất giảm <strong>n<sup>2</sup></strong> lần, đồng thời trạm biến áp giúp phân phối điện năng an toàn, tin cậy.
          </p>
        `
      }
    ]
  },

  "1.2": {
    id: "1.2",
    chapterId: 1,
    title: "Slide Giáo Trình Chương 1: Tổng Quan NMĐ & Trạm Biến Áp",
    type: "pdf",
    author: "TS. Nguyễn Ngọc Tuyến - Khoa Công nghệ Điện",
    size: "4.8 MB",
    pages: 36,
    contentSummary: `
      <h3>TÓM TẮT GIÁO TRÌNH LÝ THUYẾT CHƯƠNG 1</h3>
      <div style="margin-top: 14px; line-height: 1.7; font-size: 0.92rem; color: var(--text-secondary);">
        <h4>1.1 Khái niệm cơ bản</h4>
        <p>Hệ thống điện là tập hợp các nhà máy điện, trạm biến áp, đường dây truyền tải và phân phối, cùng các thiết bị tiêu thụ điện được liên kết với nhau bằng một quá trình sản xuất, truyền tải và tiêu thụ điện năng liên tục và đồng thời.</p>
        
        <h4>1.2 Các chỉ tiêu chất lượng điện năng cơ bản</h4>
        <ul>
          <li><strong>Điện áp (U):</strong> Độ lệch điện áp cho phép trong chế độ bình thường là <strong>&plusmn;5% U<sub>đm</sub></strong>, chế độ sự cố cho phép từ <strong>+5% đến -10% U<sub>đm</sub></strong>.</li>
          <li><strong>Tần số (f):</strong> Tần số định mức của hệ thống điện Việt Nam là <strong>50 Hz</strong>. Độ lệch tần số cho phép trong điều kiện vận hành bình thường là <strong>50 &plusmn; 0,2 Hz</strong>.</li>
          <li><strong>Độ sóng điều hòa (THD):</strong> Tổng độ biến dạng sóng hài điện áp không vượt quá giới hạn theo Thông tư 25/2016/TT-BCT và Thông tư 39/2015/TT-BCT của Bộ Công Thương.</li>
        </ul>

        <h4>1.3 Phân loại Hộ tiêu thụ điện</h4>
        <ul>
          <li><strong>Hộ loại 1:</strong> Phụ tải đặc biệt quan trọng (Bệnh viện cấp cứu, trung tâm điều hành quốc gia, lò luyện kim...). Mất điện gây nguy hiểm tính mạng con người hoặc thiệt hại kinh tế đặc biệt nghiêm trọng. <em>Yêu cầu cấp điện liên tục từ ít nhất 2 nguồn độc lập và có hệ thống tự động chuyển nguồn (ATS).</em></li>
          <li><strong>Hộ loại 2:</strong> Phụ tải quan trọng (Nhà máy xí nghiệp sản xuất công nghiệp, khu công nghiệp tập trung...). Mất điện gây hư hỏng sản phẩm, đình trệ dây chuyền sản xuất lớn.</li>
          <li><strong>Hộ loại 3:</strong> Phụ tải sinh hoạt và công cộng thông thường, cho phép mất điện trong thời gian ngắn để sửa chữa, bảo dưỡng thiết bị.</li>
        </ul>
      </div>
    `
  },

  "1.3": {
    id: "1.3",
    chapterId: 1,
    title: "Tài liệu đọc thêm: Tiêu chuẩn Thiết kế Trạm biến áp 110kV EVN",
    type: "doc",
    size: "2.1 MB",
    fileUrl: "https://drive.google.com/file/d/1eKhmjW95N36Ll1Ie8SMJmgAvfYgIrlEN/view?usp=sharing",
    downloadUrl: "https://drive.google.com/uc?export=download&id=1eKhmjW95N36Ll1Ie8SMJmgAvfYgIrlEN",
    contentSummary: `
      <!-- Direct Embedded Google Drive PDF Document Viewer -->
      <div style="margin-bottom: 20px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-subtle); background: var(--bg-card); box-shadow: var(--shadow-md);">
        <div style="padding: 10px 16px; background: var(--bg-glass-strong); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-title);"><i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> Đọc trực tiếp File: Tiêu chuẩn thiết kế Trạm biến áp 110kV EVN</span>
          <a href="https://drive.google.com/file/d/1eKhmjW95N36Ll1Ie8SMJmgAvfYgIrlEN/view?usp=sharing" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 4px 12px;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở toàn màn hình
          </a>
        </div>
        <iframe 
          src="https://drive.google.com/file/d/1eKhmjW95N36Ll1Ie8SMJmgAvfYgIrlEN/preview" 
          style="width: 100%; height: 520px; border: none; background: #ffffff;" 
          allow="autoplay"
          title="Tài liệu thiết kế TBA 110kV EVN">
        </iframe>
      </div>

      <h3>TỔNG KẾT QUY CHUẨN KỸ THUẬT QUỐC GIA & QUY ĐỊNH EVN VỀ TRẠM BIẾN ÁP 110kV</h3>
      <div style="margin-top: 14px; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
        <p><strong>1. Tiêu chuẩn áp dụng:</strong> QCVN QTĐ-5:2009/BCT (Quy chuẩn kỹ thuật điện - Kiểm định trang thiết bị trạm biến áp), IEC 60076 (Máy biến áp lực), IEC 62271 (Khí cụ điện cao áp), Quy định kỹ thuật Tập đoàn Điện lực Việt Nam (EVN).</p>
        <p><strong>2. Khoảng cách an toàn điện cao áp cấp 110 kV ngoài trời:</strong></p>
        <ul>
          <li>Khoảng cách từ phần mang điện trần đến đất: Tối thiểu <strong>1.100 mm (1,1 m)</strong>.</li>
          <li>Khoảng cách pha - pha giữa các dây dẫn trần: Tối thiểu <strong>1.100 mm (1,1 m)</strong>.</li>
          <li>Khoảng cách từ phần mang điện đến hàng rào bảo vệ trạm: Tối thiểu <strong>2.600 mm (2,6 m)</strong>.</li>
          <li>Khoảng cách từ điểm võng thấp nhất của dây dẫn qua đường nội bộ: Tối thiểu <strong>7.000 mm (7,0 m)</strong>.</li>
        </ul>
        <p><strong>3. Hệ thống SCADA & Điều khiển từ xa không người trực:</strong> Toàn bộ TBA 110 kV xây dựng mới bắt buộc trang bị hệ thống tự động hóa trạm theo chuẩn <strong>IEC 61850</strong>, truyền tín hiệu về Trung tâm Điều độ Hệ thống điện Miền.</p>
      </div>
    `
  },

  "2.1": {
    id: "2.1",
    chapterId: 2,
    title: "Video Bài giảng: Sơ đồ một thanh góp, hai thanh góp, sơ đồ cầu, sơ đồ đa giác",
    type: "video",
    duration: "60 phút",
    videoUrl: "https://www.youtube.com/watch?v=tzuGEn5-y5Y",
    videoEmbedUrl: "https://www.youtube.com/embed/tzuGEn5-y5Y",
    description: "Phân tích nguyên lý hoạt động, ưu nhược điểm và phạm vi ứng dụng của các dạng sơ đồ nối điện chính: Sơ đồ một thanh góp (thanh cái), hai thanh góp, sơ đồ cầu và sơ đồ đa giác trong Nhà máy điện và Trạm biến áp.",
    sections: [
      {
        heading: "1. Sơ đồ một hệ thống thanh cái (Single Busbar)",
        content: `
          <p>Sơ đồ gồm một thanh cái duy nhất cấp điện cho tất cả các nhánh vào và ra. Có thể phân đoạn thanh cái bằng máy cắt phân đoạn (MC-PĐ) hoặc dao cách ly phân đoạn (DCL-PĐ).</p>
          <ul>
            <li><strong>Ưu điểm:</strong> Kết cấu đơn giản, chi phí đầu tư thấp, thao tác vận hành dễ dàng, diện tích chiếm chỗ nhỏ.</li>
            <li><strong>Nhược điểm:</strong> Khi bảo dưỡng hoặc sự cố thanh cái phải ngừng cấp điện toàn bộ trạm (đối với sơ đồ không phân đoạn).</li>
            <li><strong>Khắc phục:</strong> Sử dụng sơ đồ 1 thanh cái phân đoạn 2 phía kèm nguồn cấp tự động đóng (ATS).</li>
          </ul>
        `
      },
      {
        heading: "2. Sơ đồ hai hệ thống thanh cái (Double Busbar)",
        content: `
          <p>Gồm 2 thanh cái: Thanh cái làm việc (W1) và Thanh cái dự phòng (W2). Các xuất tuyến được nối với cả 2 thanh cái thông qua 2 dao cách ly thanh cái (DCL-W1 và DCL-W2), liên kết bởi máy cắt liên lạc (MC-LL).</p>
          <ul>
            <li><strong>Ưu điểm:</strong> Rất linh hoạt, có thể sửa chữa lần lượt từng thanh cái mà không làm mất điện các lộ ra; khi sự cố 1 thanh cái chỉ cần chuyển các lộ sang thanh cái còn lại.</li>
            <li><strong>Nhược điểm:</strong> Vốn đầu tư lớn, số lượng dao cách ly nhiều, nguy cơ thao tác nhầm dao cách ly dưới tải nếu không có khóa liên động liên hoàn.</li>
          </ul>
        `
      },
      {
        heading: "3. Sơ đồ cầu (Bridge Configuration)",
        content: `
          <p>Thường dùng cho trạm biến áp trung gian 110 kV có 2 đường dây đến và 2 máy biến áp lực:</p>
          <ul>
            <li><strong>Sơ đồ Cầu trong (Inner Bridge):</strong> Máy cắt cầu đặt ở phía máy biến áp. Thích hợp cho trạm có đường dây dài, máy biến áp ít khi phải đóng cắt.</li>
            <li><strong>Sơ đồ Cầu ngoài (Outer Bridge):</strong> Máy cắt cầu đặt ở phía đường dây. Thích hợp cho trạm có đường dây ngắn, máy biến áp thường xuyên đóng cắt theo chế độ phụ tải.</li>
          </ul>
        `
      }
    ]
  },

  "2.2": {
    id: "2.2",
    chapterId: 2,
    title: "Slide Giáo Trình Chương 2: Phân Tích Độ Tin Cậy Cung Cấp Điện",
    type: "pdf",
    author: "TS. Nguyễn Ngọc Tuyến - Khoa Công nghệ Điện",
    size: "6.2 MB",
    pages: 42,
    contentSummary: `
      <h3>PHƯƠNG PHÁP TÍNH TOÁN & SO SÁNH PHƯƠNG ÁN KỸ THUẬT NỐI ĐIỆN</h3>
      <div style="margin-top: 14px; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
        <h4>2.1 Tiêu chí lựa chọn phương án sơ đồ nối điện chính</h4>
        <ol>
          <li><strong>Độ tin cậy cung cấp điện:</strong> Đảm bảo cấp điện liên tục phù hợp với cấp độ phụ tải (Hộ loại 1, loại 2).</li>
          <li><strong>Tính linh hoạt trong vận hành:</strong> Dễ dàng cô lập thiết bị để bảo trì, sửa chữa, thay thế mà không gây mất điện lan rộng.</li>
          <li><strong>Tính kinh tế:</strong> Tổng chi phí tính toán quy đổi hàng năm:
            <br>
            <span class="formula-box"><strong>Z = a<sub>tc</sub> &times; K + C + Y<sub>th</sub> &rarr; min</strong></span>
            <br>
            <em>Trong đó:</em> <strong>K</strong> là vốn đầu tư xây dựng ban đầu, <strong>C</strong> là chi phí vận hành hàng năm (tổn thất điện năng, bảo dưỡng), <strong>a<sub>tc</sub></strong> là hệ số hiệu quả định mức, <strong>Y<sub>th</sub></strong> là tổn thất do ngừng cấp điện gây ra cho phụ tải.
          </li>
          <li><strong>Khả năng mở rộng phát triển:</strong> Thuận tiện mở rộng thêm ngăn lộ trong tương lai khi phụ tải tăng trưởng.</li>
        </ol>

        <h4>2.2 Bảng so sánh các dạng sơ đồ thanh cái 110 kV</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.88rem;">
          <tr style="background: var(--bg-glass-strong); color: var(--text-title); text-align: left;">
            <th style="padding: 10px; border: 1px solid var(--border-subtle);">Loại sơ đồ</th>
            <th style="padding: 10px; border: 1px solid var(--border-subtle);">Độ tin cậy</th>
            <th style="padding: 10px; border: 1px solid var(--border-subtle);">Vốn đầu tư tương đối</th>
            <th style="padding: 10px; border: 1px solid var(--border-subtle);">Phạm vi áp dụng phổ biến</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);"><strong>1 Thanh cái phân đoạn</strong></td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle); color: #f59e0b;">Trung bình</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">Thấp (Hệ số 1,0)</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">TBA phân phối 22 kV, phụ tải loại 2 và 3</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);"><strong>2 Thanh cái có MC liên lạc</strong></td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle); color: #2563eb;">Cao</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">Trung bình (Hệ số 1,4)</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">TBA 110 kV / 220 kV khu vực trọng điểm</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);"><strong>2 Thanh cái có Thanh cái vòng</strong></td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle); color: #059669;">Rất cao</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">Cao (Hệ số 1,7)</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">TBA nút 110 kV, NMĐ công suất lớn</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);"><strong>Sơ đồ 3/2 (Breaker-and-a-half)</strong></td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle); color: #10b981;">Tối ưu tuyệt đối</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">Rất cao (Hệ số 2,2)</td>
            <td style="padding: 10px; border: 1px solid var(--border-subtle);">TBA Siêu cao áp 500 kV / 220 kV</td>
          </tr>
        </table>
      </div>
    `
  },

  "2.3": {
    id: "2.3",
    chapterId: 2,
    title: "Trắc Nghiệm Ôn Tập Kiến Thức Chương 2 (10 Câu Có Chấm Điểm)",
    type: "quiz",
    duration: "15 phút",
    totalQuestions: 10,
    questions: [
      {
        id: 1,
        question: "Trong hệ thống điện Việt Nam, cấp điện áp nào sau đây được coi là cấp điện áp truyền tải Siêu cao áp?",
        options: ["110 kV", "220 kV", "500 kV", "35 kV"],
        correctIndex: 2,
        explanation: "500 kV là cấp điện áp siêu cao áp truyền tải trục xương sống quốc gia Bắc - Nam."
      },
      {
        id: 2,
        question: "Mục đích chính của việc tăng điện áp lên cấp cao áp trước khi truyền tải điện năng đi xa là gì?",
        options: [
          "Tăng công suất phát của turbine nhà máy điện",
          "Giảm dòng điện trên đường dây, từ đó giảm tổn thất công suất và tổn thất điện áp",
          "Làm cho máy biến áp làm việc mát hơn",
          "Tăng tần số của hệ thống điện"
        ],
        correctIndex: 1,
        explanation: "Công thức tổn thất công suất ΔP = [ (P² + Q²) / U² ] * R. Khi tăng điện áp U lên n lần thì tổn thất công suất giảm n² lần."
      },
      {
        id: 3,
        question: "Sơ đồ Cầu Trong (Inner Bridge) ở trạm biến áp 110 kV thích hợp nhất trong trường hợp nào?",
        options: [
          "Đường dây ngắn, máy biến áp thường xuyên đóng cắt",
          "Đường dây dài, máy biến áp ít khi phải đóng cắt",
          "Trạm có nhiều hơn 6 lộ đường dây ra",
          "Trạm chỉ có duy nhất 1 máy biến áp"
        ],
        correctIndex: 1,
        explanation: "Sơ đồ cầu trong có máy cắt cầu đặt phía máy biến áp, khi đóng cắt đường dây không ảnh hưởng đến MBA nên tối ưu cho đường dây dài."
      },
      {
        id: 4,
        question: "Phụ tải điện loại 1 (Hộ tiêu thụ loại 1) bắt buộc phải được cung cấp điện như thế nào?",
        options: [
          "Từ ít nhất 2 nguồn độc lập và có hệ thống tự động đóng nguồn dự phòng (ATS)",
          "Từ 1 nguồn duy nhất với máy cắt tự đóng lại",
          "Cấp điện qua máy phát điện chạy dầu diesel độc lập không nối lưới",
          "Chỉ được cấp điện vào ban ngày"
        ],
        correctIndex: 0,
        explanation: "Hộ loại 1 mất điện sẽ gây nguy hiểm tính mạng hoặc thiệt hại kinh tế nghiêm trọng nên bắt buộc phải có ít nhất 2 nguồn độc lập kèm ATS."
      },
      {
        id: 5,
        question: "Tại sao trong vận hành Máy biến dòng điện (CT) nghiêm cấm tuyệt đối việc để hở mạch cuộn thứ cấp?",
        options: [
          "Vì sẽ làm hỏng đồng hồ đo ampe kế",
          "Vì từ thông trong lõi thép tăng vọt gây quá nhiệt cháy lõi thép và sinh điện áp cảm ứng cao áp hàng ngàn volt nguy hiểm tính mạng",
          "Vì làm giảm công suất phát của máy phát điện",
          "Vì làm dòng điện sơ cấp giảm về 0"
        ],
        correctIndex: 1,
        explanation: "Khi hở mạch thứ cấp, toàn bộ dòng sơ cấp trở thành dòng từ hóa tạo từ thông cực lớn trong lõi thép, sinh sức điện động cảm ứng cực cao (hàng kV) gây nguy hiểm chết người."
      },
      {
        id: 6,
        question: "Khí SF6 (Sulfur Hexafluoride) được sử dụng phổ biến trong Máy cắt cao áp hiện đại vì lý do gì?",
        options: [
          "Khí có màu xanh đẹp mắt",
          "Khí có khả năng cách điện và dập tắt hồ quang điện cực kỳ xuất sắc, không bắt lửa, độ bền điện môi cao gấp 2.5 - 3 lần không khí",
          "Khí nhẹ hơn không khí nên máy cắt nhẹ hơn",
          "Giá thành rẻ hơn dầu máy biến áp"
        ],
        correctIndex: 1,
        explanation: "SF6 là chất khí trơ, không độc, độ bền điện môi cao gấp 3 lần không khí và khả năng dập hồ quang gấp 100 lần không khí."
      },
      {
        id: 7,
        question: "Điều kiện kiểm tra Ổn định nhiệt của khí cụ điện và dây dẫn khi có dòng ngắn mạch chạy qua là gì?",
        options: [
          "Nhiệt độ môi trường không vượt quá 40°C",
          "Xung lượng nhiệt của dòng ngắn mạch B_N không vượt quá khả năng chịu nhiệt định mức I²_nđm * t_nđm của khí cụ",
          "Điện áp ngắn mạch phải bằng 0",
          "Thời gian cắt ngắn mạch phải lớn hơn 10 giây"
        ],
        correctIndex: 1,
        explanation: "Điều kiện ổn định nhiệt: B_N ≤ I²_nđm * t_nđm hoặc diện tích tiết diện S ≥ (I_∞ * √t_qđ) / C."
      },
      {
        id: 8,
        question: "Chức năng chính của Dao cách ly (DS) trong trạm biến áp là gì?",
        options: [
          "Dập hồ quang và cắt dòng điện ngắn mạch",
          "Tạo ra khoảng cách cách điện nhìn thấy được bằng mắt thường để đảm bảo an toàn tuyệt đối cho nhân viên khi sửa chữa thiết bị",
          "Tăng hệ số công suất cosφ",
          "Biến đổi điện áp từ 110 kV xuống 22 kV"
        ],
        correctIndex: 1,
        explanation: "Dao cách ly không có bộ phận dập hồ quang (nghiêm cấm đóng cắt dưới tải), nhiệm vụ tạo khoảng cách an toàn nhìn thấy được."
      },
      {
        id: 9,
        question: "Hệ số quá tải sự cố cho phép thông thường của Máy biến áp dầu theo tiêu chuẩn thiết kế là bao nhiêu trong thời gian xử lý sự cố?",
        options: [
          "10% (k_sc = 1.1)",
          "40% (k_sc = 1.4)",
          "100% (k_sc = 2.0)",
          "Không cho phép quá tải"
        ],
        correctIndex: 1,
        explanation: "Trong chế độ sự cố 1 máy biến áp ngừng hoạt động, máy biến áp còn lại được phép quá tải tối đa 40% (k_sc = 1.4) trong tối đa 5 ngày đêm với thời gian quá tải mỗi ngày không quá 6 giờ."
      },
      {
        id: 10,
        question: "Thiết bị chống sét van (Surge Arrester - SA) thường được lắp đặt ở vị trí nào trong trạm biến áp 110 kV?",
        options: [
          "Nối tiếp trên đường dây trung áp",
          "Mắc song song giữa dây pha và đất ngay trước đầu cực máy biến áp lực để bảo vệ cách điện máy biến áp",
          "Mắc ở phía cuộn thứ cấp của máy biến dòng CT",
          "Đặt trong phòng điều khiển trung tâm"
        ],
        correctIndex: 1,
        explanation: "Chống sét van mắc song song giữa pha và đất càng gần đầu cực máy biến áp càng tốt để thoát sóng sét xuống đất, hạn chế quá điện áp khí quyển."
      }
    ]
  },

  "3.3": {
    id: "3.3",
    chapterId: 3,
    title: "Bài tập 01: Tính toán chọn Máy cắt & Dây dẫn Thanh cái TBA 110kV",
    type: "exercise",
    deadline: "30/09/2026",
    maxScore: "10.0",
    specification: `
      <h3>ĐỀ BÀI BÀI TẬP SỐ 01: TÍNH CHỌN KHÍ CỤ ĐIỆN VÀ THANH CÁI TBA 110/22kV</h3>
      <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7; margin-top: 12px;">
        <p><strong>1. Thông số ban đầu:</strong></p>
        <ul>
          <li>Điện áp danh định phía cao: <strong>U<sub>cao</sub> = 110 kV</strong>; Phía hạ: <strong>U<sub>hạ</sub> = 22 kV</strong>.</li>
          <li>Công suất trạm: 2 máy biến áp lực <strong>2 &times; 40 MVA</strong>, <strong>U<sub>N</sub>% = 10,5%</strong>.</li>
          <li>Dòng ngắn mạch 3 pha phía 110 kV: <strong>I<sub>N</sub> = 25 kA</strong>, dòng xung kích <strong>i<sub>xk</sub> = 63,7 kA</strong>, thời gian cắt <strong>t<sub>c</sub> = 0,15 s</strong>.</li>
          <li>Nhiệt độ môi trường cực đại: <strong>&theta;<sub>mt</sub> = 40&deg;C</strong>.</li>
        </ul>
        <p><strong>2. Nhiệm vụ yêu cầu:</strong></p>
        <ol>
          <li>Tính dòng điện làm việc cực đại <strong>I<sub>lv.max</sub></strong> qua nhánh máy cắt tổng 110 kV và thanh cái 110 kV.</li>
          <li>Lựa chọn mã hiệu Máy cắt SF6 110 kV và Dao cách ly 110 kV theo catalog ABB / Siemens / Schneider.</li>
          <li>Kiểm tra máy cắt theo 5 điều kiện: <strong>U<sub>đm</sub></strong>, <strong>I<sub>đm</sub></strong>, <strong>I<sub>c.đm</sub></strong>, <strong>i<sub>đm</sub> (ổn định động)</strong> và <strong>I<sub>n.đm</sub><sup>2</sup> &times; t (ổn định nhiệt)</strong>.</li>
          <li>Lựa chọn tiết diện dây nhôm lõi thép ACSR làm thanh cái mềm 110 kV ngoài trời và kiểm tra điều kiện vầng quang điện <strong>(U<sub>vq</sub> &ge; 1,07 &times; U<sub>đm</sub>)</strong>.</li>
        </ol>
      </div>
    `
  }
};
