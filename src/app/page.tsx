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
            {/* <a
              href="/login"
              className="btn-primary btn-text"
            >
              Đăng nhập
            </a> */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="heading-main text-3xl sm:text-4xl lg:text-6xl text-gray-900 mb-4 sm:mb-6">
                Gửi 50 CV, nhận <span className="text-red-600">0 phản hồi</span>
                ?
              </h1>

              <h2 className="heading-sub text-lg sm:text-xl lg:text-2xl text-gray-700 mb-4 sm:mb-6">
                Kinh nghiệm tốt nhưng CV không &ldquo;kêu&rdquo;? <br />
                AI giúp bạn mô tả thành tích ấn tượng &amp; vượt qua bộ lọc ATS.
              </h2>

              <p className="body-text text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                FastRezu là công cụ AI chuyên sâu giúp bạn biến kinh nghiệm
                thành <strong>thành tích quantifiable</strong>, tối ưu CV (cho
                cả <strong>Tiếng Việt & Tiếng Anh</strong>) chỉ trong vài phút.
                Không chỉ CV đẹp, chúng tôi làm CV được gọi phỏng vấn.
              </p>

              {/* Nút CTA mới */}
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

            <div className="flex justify-center order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md animate-fade-in-up">
                <div className="bg-gray-100 rounded-lg p-4 sm:p-6 mb-4">
                  <div className="h-3 sm:h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2 animate-pulse-slow">
                    92/100
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Điểm ATS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              Viết CV: Cuộc chiến với &ldquo;Trang giấy trắng&rdquo; và
              &ldquo;Thành tích mờ nhạt&rdquo;?
            </h2>

            <p className="body-text text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Khảo sát gần đây cho thấy, người tìm việc tại Việt Nam gặp khó
              khăn nhất khi mô tả thành tích và mất quá nhiều thời gian để tùy
              chỉnh CV.
            </p>
          </div>

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
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              FastRezu: Trợ lý AI giúp bạn viết CV &ldquo;chất&rdquo; và nhanh
              hơn
            </h2>

            <p className="body-text text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Chúng tôi không chỉ cung cấp template. AI của FastRezu tập trung
              giải quyết nỗi đau cốt lõi:{" "}
              <strong>viết nội dung thành tích</strong> và{" "}
              <strong>tối ưu từ khóa</strong> cho cả Tiếng Việt &amp; Tiếng Anh.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">✍️✨</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                AI Soạn thảo Thành tích ấn tượng
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Không còn &ldquo;bí&rdquo; từ! Chỉ cần nhập vị trí, AI sẽ tự
                động viết các gạch đầu dòng mô tả <strong>thành tích</strong>{" "}
                (VI/EN), sử dụng <strong>số liệu</strong> và{" "}
                <strong>động từ mạnh</strong>, tích hợp từ khóa từ JD.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🔍🎯</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                AI &ldquo;đọc vị&rdquo; JD &amp; tìm từ khóa vàng
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Dán JD vào, AI sẽ &ldquo;quét&rdquo; và chỉ ra chính xác các{" "}
                <strong>từ khóa quan trọng</strong> mà hệ thống ATS và nhà tuyển
                dụng đang tìm kiếm. Giúp bạn tùy chỉnh CV đúng trọng tâm.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">📊✅</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                Chấm điểm ATS & Gợi ý cải thiện
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Theo dõi điểm số CV tăng lên khi bạn tối ưu. Nhận gợi ý cụ thể
                để đạt điểm cao, tự tin nộp đơn và{" "}
                <strong>tăng cơ hội được gọi phỏng vấn</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6">
              Sẵn sàng để CV của bạn được nhà tuyển dụng nhìn thấy.
            </h2>
            <p className="body-text text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
              Ngừng lãng phí thời gian và bỏ lỡ cơ hội vì CV chưa đủ
              &ldquo;chất&rdquo;. Hãy để AI giúp bạn tạo CV ấn tượng chỉ trong
              vài phút. Bắt đầu ngay hôm nay, hoàn toàn miễn phí.
            </p>

            {/* Nút CTA mới */}
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

      {/* Footer */}
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
