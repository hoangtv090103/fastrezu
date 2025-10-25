export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="heading-feature text-xl text-gray-900">
                FastRezu
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* === Tối ưu H1: Thêm yếu tố thời gian & kết quả === */}
              <h1 className="heading-main text-3xl sm:text-4xl lg:text-6xl text-gray-900 mb-4 sm:mb-6">
                Tạo CV Chuẩn ATS <span className="text-blue-600">trong 5 phút</span>,
                <br className="hidden lg:block"/> Nhận phản hồi <span className="text-green-600">nhanh hơn</span>.
              </h1>

              {/* === Tối ưu H2: Nhấn mạnh AI viết hộ === */}
              <h2 className="heading-sub text-lg sm:text-xl lg:text-2xl text-gray-700 mb-4 sm:mb-6">
                Đừng để CV &quot;trống&quot; hay mô tả mờ nhạt cản bước bạn. AI của FastRezu <span className="font-semibold">viết hộ bạn</span> những thành tích ấn tượng nhất.
              </h2>

              {/* === Tối ưu P: Rõ ràng về VI/EN và kết quả === */}
              <p className="body-text text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                FastRezu là trợ lý AI <span className="font-semibold">duy nhất</span> bạn cần để tạo CV chuyên nghiệp (Tiếng Việt & Tiếng Anh). Chúng tôi giúp bạn <span className="font-semibold">viết nội dung chất lượng</span>, tối ưu từ khóa ATS, và tăng tốc hành trình đến buổi phỏng vấn mơ ước.
              </p>

              {/* Nút CTA giữ nguyên */}
              <div className="max-w-md mx-auto lg:mx-0">
                <a
                  href="/login"
                  className="btn-primary btn-text w-full sm:w-auto inline-block text-center whitespace-nowrap px-6 py-3"
                >
                  BẮT ĐẦU TẠO CV MIỄN PHÍ
                </a>
                <p className="small-text text-gray-500 text-center lg:text-left mt-3">
                  Đăng nhập hoặc đăng ký nhanh chóng bằng email.
                </p>
              </div>
            </div>

            {/* Mockup giữ nguyên */}
            <div className="flex justify-center order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md animate-fade-in-up">
                <div className="bg-gray-100 rounded-lg p-4 sm:p-6 mb-4">
                  <div className="h-3 sm:h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2 animate-pulse-slow">
                    95/100 {/* Tăng điểm lên chút để hấp dẫn hơn */}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Điểm Tương thích ATS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section - Giữ nguyên v4 vì đã rất tốt */}
      <section className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              Viết CV: Cuộc chiến với &ldquo;Trang giấy trắng&rdquo; và
              &ldquo;Thành tích mờ nhạt&rdquo;?
            </h2>
            <p className="body-text text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Khảo sát cho thấy, khó khăn lớn nhất là mô tả thành tích ấn tượng và việc tùy chỉnh CV tốn quá nhiều thời gian.
            </p>
          </div>
          {/* ... (Giữ nguyên 3 cột nỗi đau: Thành tích, Thời gian, ATS) ... */}
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🏆</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                Khó diễn tả thành tích?
              </h3>
              <p className="body-text text-gray-600 text-sm sm:text-base">
                Bạn biết mình làm được việc, nhưng không biết viết sao cho
                &ldquo;kêu&rdquo;, biến trách nhiệm thành kết quả đo lường được
                (số liệu, %) để thuyết phục nhà tuyển dụng.
              </p>
            </div>
            {/* ... (Giữ nguyên cột Thời gian) ... */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">⏳</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                Tốn giờ tùy chỉnh CV?
              </h3>
              <p className="body-text text-gray-600 text-sm sm:text-base">
                Mỗi công việc yêu cầu một CV khác nhau. Việc viết lại, chỉnh sửa
                lặp đi lặp lại khiến bạn mệt mỏi và tốn quá nhiều thời gian quý
                báu.
              </p>
            </div>
            {/* ... (Giữ nguyên cột ATS) ... */}
            <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🤖</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                Và &ldquo;cuộc chiến ngầm&rdquo; ATS?
              </h3>
              <p className="body-text text-gray-600 text-sm sm:text-base">
                Bạn có biết gần 70% CV bị máy lọc (ATS) loại trước khi đến tay
                người? Thiếu từ khóa phù hợp khiến CV của bạn &ldquo;vô
                hình&rdquo; dù rất tiềm năng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Features Section */}
      <section className="bg-linear-to-br from-blue-50 to-indigo-100 py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          {/* === Tối ưu H2: Nhấn mạnh sự dẫn dắt, khác biệt với "checker" === */}
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              FastRezu không chỉ <span className="italic">kiểm tra</span>, mà <span className="font-semibold text-blue-600">cùng bạn viết</span> CV hoàn hảo
            </h2>
            <p className="body-text text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Với hướng dẫn thông minh và AI tạo sinh nội dung (VI/EN), FastRezu dẫn dắt bạn từng bước, giải quyết mọi khó khăn từ &quot;bí từ&quot; đến tối ưu ATS.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
             {/* === Tối ưu Box 1: AI Soạn thảo - Nhấn mạnh viết hộ === */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">✍️✨</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                 AI <span className="font-semibold">Viết Hộ</span> Thành Tích
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Chỉ cần nhập vị trí, AI tự động <span className="font-semibold">soạn thảo các bullet point thành tích</span> (VI/EN) ấn tượng, sử dụng số liệu và động từ mạnh, tích hợp từ khóa JD.
              </p>
            </div>
            {/* === Tối ưu Box 2: JD Analysis - Nhấn mạnh tiết kiệm thời gian === */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🔍🎯</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                AI Phân Tích JD <span className="font-semibold">Trong Giây Lát</span>
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Dán JD vào, AI quét và <span className="font-semibold">chỉ ra ngay các từ khóa quan trọng</span>. Tiết kiệm hàng giờ nghiên cứu, giúp bạn tập trung vào nội dung CV.
              </p>
            </div>
             {/* === Tối ưu Box 3: Scoring - Nhấn mạnh sự tự tin === */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">📊✅</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                Chấm Điểm ATS & <span className="font-semibold">Tự Tin Nộp Đơn</span>
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Xem điểm CV tăng lên khi tối ưu. Nhận gợi ý cụ thể để đạt điểm cao, <span className="font-semibold">biết chắc CV của bạn sẵn sàng</span> trước khi gửi đi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Giữ nguyên v4 */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6">
              Sẵn sàng để CV của bạn được nhà tuyển dụng chú ý.
            </h2>
            <p className="body-text text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
              Ngừng lãng phí thời gian và bỏ lỡ cơ hội. Hãy để AI giúp bạn tạo CV ấn tượng chỉ trong vài phút. Bắt đầu ngay hôm nay, hoàn toàn miễn phí.
            </p>
             {/* Nút CTA giữ nguyên */}
            <div className="max-w-md mx-auto">
              <a
                href="/login"
                className="btn-secondary btn-text w-full sm:w-auto inline-block text-center whitespace-nowrap px-6 py-3"
              >
                BẮT ĐẦU TẠO CV MIỄN PHÍ
              </a>
              <p className="small-text text-gray-400 mt-3">
                Đăng nhập hoặc đăng ký nhanh chóng bằng email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Giữ nguyên */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 FastRezu. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}