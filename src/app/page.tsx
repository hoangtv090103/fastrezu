"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Redirect to login page instead of waitlist
    router.push("/login");
  };

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
            <a
              href="/login"
              className="btn-primary btn-text"
            >
              Đăng nhập
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="heading-main text-4xl lg:text-6xl text-gray-900 mb-6">
                Gửi 50 CV, nhận <span className="text-red-600">0 phản hồi</span>
                ?
              </h1>

              <h2 className="heading-sub text-xl lg:text-2xl text-gray-700 mb-6">
                Kinh nghiệm của bạn có thể rất tốt, nhưng CV của bạn có thể chưa
                &ldquo;vượt qua&rdquo; được hệ thống lọc tự động.
              </h2>

              <p className="body-text text-lg text-gray-600 mb-8">
                FastRezu là công cụ AI chuyên sâu, giúp bạn tối ưu CV
                &ldquo;chuẩn&rdquo; theo từng mô tả công việc. Chúng tôi không
                chỉ làm CV đẹp, chúng tôi làm CV được nhà tuyển dụng nhìn thấy.
              </p>

              <form
                onSubmit={handleSubmit}
                className="max-w-md mx-auto lg:mx-0"
              >
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    className="email-input flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm hover:border-gray-400 transition-colors duration-200"
                    required
                  />
                  <button
                    type="submit"
                    className="btn-primary btn-text whitespace-nowrap"
                  >
                    BẮT ĐẦU TẠO CV
                  </button>
                </div>
                <p className="small-text text-gray-500 text-center lg:text-left">
                  Đăng nhập để bắt đầu tạo CV được tối ưu cho ATS.
                </p>
              </form>
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md animate-fade-in-up">
                <div className="bg-gray-100 rounded-lg p-6 mb-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2 animate-pulse-slow">
                    92/100
                  </div>
                  <div className="text-sm text-gray-600">Điểm ATS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="heading-main text-3xl lg:text-4xl text-gray-900 mb-6">
              Hệ thống ATS là gì? <br />
              (Và tại sao nó lại lọc CV của bạn?)
            </h2>

            <p className="body-text text-gray-600 mb-8 max-w-4xl mx-auto text-center">
              Các công ty lớn (FPT, Techcombank, Shopee...) hiện dùng một hệ
              thống lọc CV tự động gọi là
              <br />
              <strong>ATS (Applicant Tracking System)</strong> để xử lý hàng
              ngàn hồ sơ.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4">
                Hệ thống quét CV trong 6 giây
              </h3>
              <p className="body-text text-gray-600">
                ATS không &ldquo;đọc&rdquo; CV như người. Nó &ldquo;quét&rdquo;
                hồ sơ của bạn để tìm kiếm các{" "}
                <strong>&ldquo;từ khóa&rdquo; (Keywords)</strong> liên quan trực
                tiếp đến mô tả công việc.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4">
                CV thiếu &ldquo;Từ khóa&rdquo; = Bị bỏ lỡ
              </h3>
              <p className="body-text text-gray-600">
                Nếu CV của bạn (dù kinh nghiệm tốt) không chứa đúng các từ khóa
                này, hệ thống sẽ xếp hạng bạn ở mức thấp. Nhà tuyển dụng có thể
                không bao giờ nhìn thấy hồ sơ của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Features Section */}
      <section className="bg-linear-to-br from-blue-50 to-indigo-100 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="heading-main text-3xl lg:text-4xl text-gray-900 mb-6">
              Giải pháp của FastRezu: Dùng AI để tối ưu cho AI
            </h2>

            <p className="body-text text-gray-600 mb-8 max-w-4xl mx-auto text-center">
              Các công cụ truyền thống giúp bạn có một CV đẹp về hình thức
              (Template).
              <br />
              FastRezu tập trung vào thứ quyết định bạn có được phỏng vấn hay
              không: <strong>Nội dung CV.</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4 text-center">
                AI Phân tích Mô tả Công việc (JD)
              </h3>
              <p className="body-text text-gray-600 text-center">
                Dán mô tả công việc (JD) bạn muốn ứng tuyển vào. AI của chúng
                tôi sẽ &ldquo;quét&rdquo; và chỉ ra chính xác các{" "}
                <strong>từ khóa &ldquo;vàng&rdquo;</strong> mà hệ thống ATS đang
                tìm kiếm.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4 text-center">
                AI Soạn thảo Nội dung CV
              </h3>
              <p className="body-text text-gray-600 text-center">
                Không còn &ldquo;bí&rdquo; từ. Dựa trên các từ khóa từ JD,
                FastRezu sẽ <strong>soạn thảo</strong> giúp bạn các gạch đầu
                dòng mô tả thành tích nhằm đảm bảo đạt điểm ATS cao nhất.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4 text-center">
                Chấm điểm CV theo thời gian thực
              </h3>
              <p className="body-text text-gray-600 text-center">
                Theo dõi điểm số CV của bạn tăng lên (ví dụ: từ 45/100 lên
                95/100) khi bạn thêm các từ khóa quan trọng. Tự tin 100% trước
                khi &ldquo;Nộp đơn&rdquo;.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gray-900 text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-main text-3xl lg:text-4xl mb-6">
              Sẵn sàng để CV của bạn được nhà tuyển dụng nhìn thấy.
            </h2>
            <p className="body-text text-xl text-gray-300 mb-8">
              Bạn chỉ cách công việc mơ ước một CV được tối ưu. Trở thành những
              người đầu tiên tại Việt Nam dùng AI để qua vòng lọc hồ sơ. Để lại
              email, chúng tôi sẽ gửi bạn vé mời.
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="email-input email-input-dark flex-1 px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-800 text-white shadow-sm hover:border-gray-500 transition-colors duration-200"
                  required
                />
                <button
                  type="submit"
                  className="btn-secondary btn-text whitespace-nowrap"
                >
                  BẮT ĐẦU TẠO CV
                </button>
              </div>
              <p className="small-text text-gray-400">
                Đăng nhập để bắt đầu tạo CV được tối ưu cho ATS.
              </p>
            </form>
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
