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
              <span className="heading-feature text-xl text-gray-900">FastRezu</span>
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
                Kinh nghiệm của bạn có thể rất tốt, nhưng CV của bạn có thể chưa
                &ldquo;vượt qua&rdquo; được hệ thống lọc tự động.
              </h2>

              <p className="body-text text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                FastRezu là công cụ AI chuyên sâu, giúp bạn tối ưu CV
                &ldquo;chuẩn&rdquo; (cho cả <strong>Tiếng Việt & Tiếng Anh</strong>) theo từng mô tả công việc. Chúng tôi không
                chỉ làm CV đẹp, chúng tôi làm CV được nhà tuyển dụng nhìn thấy.
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
                  <div className="text-xs sm:text-sm text-gray-600">Điểm ATS</div>
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
              Hệ thống ATS là gì? <br className="hidden sm:block" />
              <span className="block sm:inline">(Và tại sao nó lại lọc CV của bạn?)</span>
            </h2>

            <p className="body-text text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Các công ty lớn (FPT, Techcombank, Shopee...) hiện dùng một hệ
              thống lọc CV tự động gọi là
              <br className="hidden sm:block" />
              <strong>ATS (Applicant Tracking System)</strong> để xử lý hàng
              ngàn hồ sơ.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">⚡</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                Hệ thống quét CV trong 6 giây
              </h3>
              <p className="body-text text-gray-600 text-sm sm:text-base">
                ATS không &ldquo;đọc&rdquo; CV như người. Nó &ldquo;quét&rdquo;
                hồ sơ của bạn để tìm kiếm các{" "}
                <strong>&ldquo;từ khóa&rdquo; (Keywords)</strong> liên quan trực
                tiếp đến mô tả công việc.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🗑️</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                CV thiếu &ldquo;Từ khóa&rdquo; = Bị bỏ lỡ
              </h3>
              <p className="body-text text-gray-600 text-sm sm:text-base">
                Nếu CV của bạn (dù kinh nghiệm tốt) không chứa đúng các từ khóa
                này, hệ thống sẽ xếp hạng bạn ở mức thấp. Nhà tuyển dụng có thể
                không bao giờ nhìn thấy hồ sơ của bạn.
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
              Giải pháp của FastRezu: Dùng AI để tối ưu cho AI
            </h2>

            <p className="body-text text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Các công cụ truyền thống giúp bạn có một CV đẹp về hình thức
              (Template).
              <br className="hidden sm:block" />
              FastRezu tập trung vào thứ quyết định bạn có được phỏng vấn hay
              không: <strong>Nội dung CV.</strong>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">✍️</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                AI Phân tích Mô tả công việc (JD)
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Dán mô tả công việc (JD) bạn muốn ứng tuyển vào. AI của chúng
                tôi sẽ &ldquo;quét&rdquo; và chỉ ra chính xác các{" "}
                <strong>từ khóa &ldquo;vàng&rdquo;</strong> mà hệ thống ATS đang
                tìm kiếm.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🔍</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                AI Soạn thảo Nội dung CV
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Không còn &ldquo;bí&rdquo; từ. Dựa trên các từ khóa từ JD,
                FastRezu sẽ <strong>soạn thảo</strong> giúp bạn các gạch đầu
                dòng mô tả thành tích (bằng <strong>Tiếng Việt hoặc Tiếng Anh</strong>) nhằm đảm bảo đạt điểm ATS cao nhất.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">📊</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                Chấm điểm CV theo thời gian thực
              </h3>
              <p className="body-text text-gray-600 text-center text-sm sm:text-base">
                Theo dõi điểm số CV của bạn tăng lên (ví dụ: từ 45/100 lên
                95/100) khi bạn thêm các từ khóa quan trọng. Tự tin 100% trước
                khi &ldquo;Nộp đơn&rdquo;.
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
              Bạn chỉ cách công việc mơ ước một CV được tối ưu. Trở thành những
              người đầu tiên tại Việt Nam dùng AI để qua vòng lọc hồ sơ. Bắt đầu
              ngay hôm nay, hoàn toàn miễn phí.
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
