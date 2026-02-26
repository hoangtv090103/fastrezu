# Product Requirements Document (PRD)
**Project Name:** FastRezu 2.0 - The Career OS
**Document Status:** Approved / V1.0
**Target Release:** MVP 2.0

## 1. Tổng quan Sản phẩm (Product Overview)
FastRezu 2.0 không còn là một công cụ tạo CV (Resume Builder) truyền thống. Nó được tái định vị thành một **"Hệ điều hành Sự nghiệp" (Career OS)** hay một **"Trợ lý Tuyển dụng AI Cá nhân" (Personal AI Headhunter)**. 

Thay vì bắt người dùng điền form thủ công để có 1 bản PDF tĩnh, FastRezu 2.0 hoạt động như một cỗ máy xử lý dữ liệu: Nó lưu trữ toàn bộ lịch sử sự nghiệp của người dùng, phân tích các cơ hội việc làm (Job Descriptions - JD) trên thị trường, và tự động "may đo" (tailor) ra các phiên bản CV tối ưu nhất cho từng vị trí cụ thể chỉ với 1 cú click.

**Giá trị cốt lõi (Core Value Proposition):** Tối đa hóa tỷ lệ chuyển đổi từ ứng tuyển sang phỏng vấn (Interview Conversion Rate) trong thời gian ngắn nhất, với nỗ lực ít nhất.

## 2. Vấn đề cốt lõi & Giải pháp (Problem & Solution)
### 2.1. Nỗi đau của người dùng (Pain Points)
* **Tailoring Fatigue:** Biết là phải sửa CV cho khớp từng JD, nhưng không có thời gian và sức lực để làm thủ công cho 50 công ty khác nhau.
* **The Black Box:** Nộp CV bị loại nhưng không biết lý do (thiếu từ khóa? sai định dạng? kinh nghiệm chưa đủ?).
* **Rào cản ngôn ngữ & Văn hóa (Thị trường VN):** Khó khăn khi viết CV tiếng Anh chuẩn bản xứ; bối rối trong việc xử lý ảnh đại diện sao cho chuyên nghiệp để vượt qua vòng lọc CV tại Việt Nam.

### 2.2. Giải pháp của FastRezu 2.0 (The Solutions)
* **1-Click Tailoring:** Tự động hóa hoàn toàn quá trình xào nấu, tinh chỉnh câu chữ trong CV để khớp 90%+ với từ khóa của bất kỳ JD nào.
* **Transparent Gap Analysis:** AI phân tích và chỉ ra chính xác ứng viên đang thiếu kỹ năng gì so với JD trước khi nộp.
* **Bilingual Contextual AI & Headshot AI:** Dịch thuật và tối ưu ngữ cảnh Anh-Việt chuẩn xác; hỗ trợ xử lý hình ảnh cá nhân đạt chuẩn chuyên nghiệp.

## 3. Chân dung Khách hàng (Target Audience)
* **Nhóm A (Nhóm tạo doanh thu chính):** Người đã đi làm (Mid-level/Senior) đang muốn nhảy việc tăng lương. Nỗi đau lớn nhất của họ là thời gian và cách thể hiện giá trị. (Sẵn sàng chi trả mức độ cao).
* **Nhóm B (Nhóm ngách giá trị cao):** Dân Tech/IT ứng tuyển các công ty Global/FDI. Cần độ chính xác về kỹ năng (hard skills) và tiếng Anh chuyên nghiệp.
* **Nhóm C (Nhóm tạo Growth/Viral):** Sinh viên mới ra trường (Fresher). Bị hội chứng "trang giấy trắng", không biết viết gì. (Chi trả thấp, nhưng mang lại traffic và dữ liệu lớn).

## 4. Bốn Trụ cột Tính năng Cốt lõi (The 4 Pillars - In Scope for MVP)

### 4.1. Pillar 1: The Vault (Kho dữ liệu Gốc)
* **Mô tả:** Nơi lưu trữ "Sự thật duy nhất" (Single Source of Truth) về sự nghiệp của người dùng. Không quan tâm định dạng, chỉ quan tâm dữ liệu.
* **Tính năng:**
  * Import dữ liệu từ CV cũ (PDF/DOCX) bằng AI (Smart Parse).
  * Giao diện nhập liệu thô (Raw input) cho Kinh nghiệm, Học vấn, Kỹ năng, Dự án.
  * Hỗ trợ lưu trữ đa ngôn ngữ (VI/EN) dưới dạng thô.

### 4.2. Pillar 2: The Intel (Bộ Phân Tích Cơ Hội)
* **Mô tả:** Công cụ trinh sát yêu cầu tuyển dụng.
* **Tính năng:**
  * Dán text JD hoặc Link JD (hỗ trợ TopCV, LinkedIn).
  * AI trích xuất yêu cầu cốt lõi (Hard skills, Soft skills, Experience).
  * Chấm điểm độ khớp (Match Score: 0-100%) giữa The Vault và The Intel.
  * Phân tích lỗ hổng (Gap Analysis) và đưa ra cảnh báo.

### 4.3. Pillar 3: The Tailor (Xưởng Sản xuất Ứng tuyển)
* **Mô tả:** Động cơ AI tạo ra bản CV cuối cùng.
* **Tính năng:**
  * Action: "Optimize for this Job".
  * AI Contextual Rewrite: Viết lại bullet points từ The Vault để match với từ khóa của The Intel.
  * Preview và xuất file định dạng PDF chuẩn ATS (3 template tối giản: Clean, Modern, Executive).

### 4.4. Pillar 4: The War Room (Trung tâm Chỉ huy Tuyển dụng)
* **Mô tả:** Bảng theo dõi tiến độ ứng tuyển (Kanban Board).
* **Tính năng:**
  * Quản lý các Job theo các cột trạng thái: Saved -> Optimized -> Applied -> Interview -> Offer/Rejected.
  * Mỗi thẻ Job đính kèm một bản Snapshot của CV đã được "tailor" riêng cho Job đó.

## 5. Ngoài phạm vi MVP (Out of Scope / Anti-Goals)
*KHÔNG phát triển các tính năng sau trong giai đoạn MVP để bảo vệ nguồn lực:*
* Xây dựng Marketplace cho hàng trăm Template CV màu mè.
* Tính năng Mạng xã hội, kết bạn, follow giữa các người dùng.
* Cổng thông tin tìm kiếm việc làm (Job Board) riêng.
* Auto-Apply bot (Tự động điền form trên các trang khác).
* Tích hợp Voice AI cho phỏng vấn thử (Đẩy lùi sang Phase 2 do chi phí cao).

## 6. Mô hình Kinh doanh (Monetization Strategy)
Thiết kế theo triết lý "Sản phẩm dùng ngắn hạn" (The Sprint), đánh vào tâm lý "Tiền trao cháo múc" của thị trường Việt Nam.
* **Mô hình Hybrid (Freemium + One-time Pass):**
  * **Free Tier:** Tạo The Vault, parse 1 CV cũ, analyze 3 Jobs/ngày, xuất 1 PDF General (có watermark).
  * **Sprint Pass (Ví dụ: 99.000đ/30 ngày):** Mở khóa Full AI Tailor không giới hạn, lưu Job không giới hạn, tắt watermark, chọn template Premium. 
  * Cổng thanh toán: Ưu tiên VietQR / MoMo cho Local, Stripe cho Global.

## 7. Tiêu chí Thành công (Success Metrics)
* **Activation Rate:** % người dùng hoàn thiện The Vault sau khi đăng ký (>60%).
* **"Aha" Moment:** % người dùng sử dụng tính năng "AI Tailor" lần đầu tiên tạo ra bản PDF có ATS Score > 80%.
* **Sprint Conversion Rate:** % người dùng Free chuyển đổi sang mua Sprint Pass trong 7 ngày đầu.
* **System Performance:** Thời gian AI parse JD và Tailor CV < 10 giây để đảm bảo trải nghiệm mượt mà.