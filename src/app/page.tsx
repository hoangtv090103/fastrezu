import CompanyCarousel from "@/components/ui/CompanyCarousel";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img 
                src="/fastrezu-logo/trans_bg.png"
                alt="FastRezu Logo"
                className="w-8 h-8 object-contain"
              />
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
              
              {/* === Tối ưu H1: Đánh thẳng vào đối thủ === */}
              <h1 className="heading-main text-3xl sm:text-4xl lg:text-6xl text-gray-900 mb-4 sm:mb-6">
                CV TopCV, Canva <span className="text-red-600">vẫn bị loại?</span>
                <br className="hidden lg:block" />
                <span className="text-blue-600">Đã đến lúc</span> tối ưu nội dung.
              </h1>

              {/* === Tối ưu H2: Nhấn mạnh 41% công ty dùng AI === */}
              <h2 className="heading-sub text-lg sm:text-xl lg:text-2xl text-gray-700 mb-4 sm:mb-6">
                Hơn 41% công ty Việt Nam đã dùng AI để sàng lọc CV. Template đẹp là chưa đủ.
                FastRezu giúp bạn <span className="font-semibold">viết nội dung thành tích</span> (VI/EN) đánh bại cả Máy (ATS) và Người.
              </h2>

              {/* === Tối ưu P: Khẳng định sự khác biệt (Viết hộ) === */}
              <p className="body-text text-base sm:text-lg text-gray-700 mb-6 sm:mb-8">
                Các công cụ khác giúp bạn &quot;check&quot; CV. FastRezu <span className="font-semibold">hướng dẫn bạn viết CV từ đầu</span>.
                Chúng tôi biến kinh nghiệm của bạn thành <span className="font-semibold">thành tích có số liệu</span>,
                tối ưu từ khóa JD, và giúp bạn nhận được lời mời phỏng vấn.
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
                  <div className="text-2xl sm:text-3xl font-bold text-green-500 mb-2 animate-pulse-slow">
                    95/100
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700">
                    Điểm Tương thích ATS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Carousel Section */}
      <section className="bg-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <p className="body-text text-gray-600 text-sm sm:text-base">
              Một số công ty đã và đang ứng dụng AI trong quy trình tuyển dụng
            </p>
          </div>
          <CompanyCarousel />
        </div>
      </section>

      {/* Pain Points Section (Giờ là "Bằng chứng Thị trường") */}
      <section className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              Bạn đang đối đầu với AI. <br className="hidden sm:block" />
              CV của bạn đã sẵn sàng chưa?
            </h2>
            <p className="body-text text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Theo khảo sát 2024, <span className="font-semibold text-blue-600">41% doanh nghiệp Việt Nam</span> đã dùng AI để tuyển dụng.
              Các hệ thống ATS (như Base, MISA, Talent Solution) đang tự động <span className="font-semibold text-red-600">đọc, chấm điểm, và xếp hạng</span> hồ sơ của bạn.
            </p>
          </div>
          {/* === Cập nhật 3 cột nỗi đau === */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* === Tối ưu Cột 1: Tập trung vào Nỗi đau chính === */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🏆</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                Khó diễn tả thành tích?
              </h3>
              <p className="body-text text-gray-700 text-sm sm:text-base">
                Khó khăn lớn nhất là biến &quot;nhiệm vụ&quot; thành &quot;thành tích có số liệu&quot;. AI của đối thủ có thể check, nhưng <span className="font-semibold">AI của FastRezu sẽ viết hộ bạn</span>.
              </p>
            </div>
            
            {/* === Tối ưu Cột 2: Tối ưu Từ khóa === */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🤖</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                Bị lọc vì thiếu từ khóa
              </h3>
              <p className="body-text text-gray-700 text-sm sm:text-base">
                CV của bạn (dù đẹp) bị loại vì thiếu từ khóa khớp với JD. FastRezu <span className="font-semibold">tự động quét JD</span> và tích hợp từ khóa vào nội dung CV cho bạn.
              </p>
            </div>
            
            {/* === Tối ưu Cột 3: Vấn đề Template (Đánh vào Canva/TopCV) === */}
            <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🎨</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                Template đẹp nhưng ATS không đọc được
              </h3>
              <p className="body-text text-gray-700 text-sm sm:text-base">
                Nhiều CV đẹp (từ Canva, TopCV) sử dụng cột, bảng, icon khiến máy ATS <span className="font-semibold">không thể đọc đúng nội dung</span>. FastRezu đảm bảo CV vừa đẹp vừa chuẩn ATS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Features Section */}
      <section className="bg-linear-to-br from-blue-50 to-indigo-100 py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            {/* === Tối ưu H2: Nhấn mạnh sự khác biệt === */}
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              CakeResume, JobsGO giúp bạn <span className="italic">Check</span>.
              <br className="hidden sm:block" />
              FastRezu <span className="font-bold text-blue-600">giúp bạn viết và tối ưu</span>.
            </h2>
            <p className="body-text text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              Chúng tôi không chỉ chấm điểm CV có sẵn. Chúng tôi cung cấp bộ công cụ AI toàn diện để <span className="font-semibold">tạo lập</span> CV (VI/EN) vượt trội, giải quyết nỗi đau &quot;bí từ&quot; và &quot;thể hiện thành tích&quot;.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Box 1: AI Viết Hộ (Cốt lõi) */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">✍️✨</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                AI <span className="font-semibold">làm nổi bật</span> thành Tích
              </h3>
              <p className="body-text text-gray-700 text-center text-sm sm:text-base">
                Giải quyết nỗi đau lớn nhất: Chỉ cần nhập vị trí, AI tự động <span className="font-semibold">soạn thảo các bullet point thành tích</span> (VI/EN) ấn tượng, sử dụng số liệu và động từ mạnh.
              </p>
            </div>
            
            {/* Box 2: JD Analysis */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🔍🎯</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                AI phân tích JD <span className="font-semibold">sâu</span>
              </h3>
              <p className="body-text text-gray-700 text-center text-sm sm:text-base">
                Tự động &quot;quét&quot; JD, chỉ ra <span className="font-semibold">từ khóa quan trọng</span>. Giúp bạn tùy chỉnh CV đúng trọng tâm công việc chỉ trong vài giây.
              </p>
            </div>

            {/* Box 3: Checker (Upload & Check) */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">📊✅</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                Check CV & <span className="font-semibold">Chấm điểm ATS</span>
              </h3>
              <p className="body-text text-gray-700 text-center text-sm sm:text-base">
                <span className="font-semibold">Tải CV có sẵn</span> (từ TopCV, Canva) để AI chấm điểm, phát hiện lỗi ATS, và gợi ý cải thiện cụ thể.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Giữ nguyên v4 */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-main text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6">
              Sẵn sàng để CV của bạn được nhà tuyển dụng chú ý.
            </h2>
            <p className="body-text text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8">
              Ngừng lãng phí thời gian và bỏ lỡ cơ hội. Hãy để AI giúp bạn tạo
              CV ấn tượng chỉ trong vài phút.
              <br /> Bắt đầu ngay hôm nay, hoàn toàn miễn phí.
            </p>
            {/* Nút CTA giữ nguyên */}
            <div className="max-w-md mx-auto">
              <a
                href="/login"
                className="btn-secondary btn-text w-full sm:w-auto inline-block text-center whitespace-nowrap px-6 py-3"
              >
                BẮT ĐẦU TẠO CV MIỄN PHÍ
              </a>
              <p className="small-text text-gray-500 mt-3">
                Đăng nhập hoặc đăng ký nhanh chóng bằng email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Giữ nguyên */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">
            © 2025 FastRezu. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
