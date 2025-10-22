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

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to thank you page for conversion tracking
        router.push("/thank-you");
      } else {
        alert(data.error || "Có lỗi xảy ra khi đăng ký");
      }
    } catch (error) {
      console.error("Error submitting email:", error);
      alert("Có lỗi xảy ra khi đăng ký");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="heading-main text-4xl lg:text-6xl text-gray-900 mb-6">
                CV của bạn đang bị{" "}
                <span className="text-red-600">loại bởi máy</span>?
              </h1>

              <h2 className="heading-sub text-xl lg:text-2xl text-gray-700 mb-6">
                Để AI của FastRezu giúp bạn viết CV &ldquo;chuẩn ATS&rdquo; chỉ
                trong 5 phút.
                <span className="text-green-600 font-bold">
                  {" "}
                  Tăng X3 cơ hội được gọi phỏng vấn.
                </span>
              </h2>

              <p className="body-text text-lg text-gray-600 mb-8">
                Hơn 75% CV tại Việt Nam bị loại bởi hệ thống lọc (ATS) trước khi
                đến tay nhà tuyển dụng. FastRezu là công cụ AI đầu tiên giúp bạn
                phân tích mô tả công việc, gợi ý từ khóa, và tự động viết nội
                dung CV giúp bạn &ldquo;đánh bại&rdquo; cỗ máy
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
                    ĐĂNG KÝ DÙNG THỬ SỚM (MIỄN PHÍ)
                  </button>
                </div>
                <p className="small-text text-gray-500 text-center lg:text-left">
                  Chúng tôi sẽ gửi email mời bạn ngay khi bản beta ra mắt.
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
              Tìm việc đã khó, viết CV còn khó hơn?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">😰</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4">
                Không biết viết gì?
              </h3>
              <p className="body-text text-gray-600">
                Bạn loay hoay cả ngày không biết phải mô tả kinh nghiệm của mình
                thế nào cho &ldquo;kêu&rdquo;, làm sao để biến &ldquo;trách
                nhiệm&rdquo; thành &ldquo;thành tích&rdquo;.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4">
                Không hiểu ATS là gì?
              </h3>
              <p className="body-text text-gray-600">
                Bạn không biết rằng CV của mình đang thiếu các &ldquo;từ
                khóa&rdquo; mà nhà tuyển dụng tìm kiếm, khiến bạn bị loại dù rất
                đủ năng lực.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">😴</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4">
                Mệt mỏi vì &ldquo;rải&rdquo; CV?
              </h3>
              <p className="body-text text-gray-600">
                Gửi 50 CV nhưng không nhận được phản hồi nào. Bạn tốn thời gian
                nhưng không biết mình đang sai ở đâu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Features Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="heading-main text-3xl lg:text-4xl text-gray-900 mb-6">
              FastRezu: Trợ lý AI viết CV của riêng bạn
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4 text-center">
                AI tự động viết nội dung
              </h3>
              <p className="body-text text-gray-600 text-center">
                Chỉ cần nhập tên công việc (ví dụ: &ldquo;Digital
                Marketing&rdquo;), AI của chúng tôi sẽ tạo ra 10+ gạch đầu dòng
                mô tả thành tích chuyên nghiệp, ấn tượng.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4 text-center">
                Phân tích mô tả công việc <br />
                (JD analyzer)
              </h3>
              <p className="body-text text-gray-600 text-center">
                Copy-paste mô tả công việc bạn muốn ứng tuyển. FastRezu sẽ
                &ldquo;quét&rdquo; và chỉ ra chính xác các từ khóa bạn CẦN PHẢI
                có trong CV.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="heading-feature text-xl text-gray-900 mb-4 text-center">
                Chấm điểm CV <br />
                (Real-time score)
              </h3>
              <p className="body-text text-gray-600 text-center">
                Theo dõi điểm số CV của bạn tăng lên theo thời gian thực khi bạn
                thêm các từ khóa quan trọng. Đảm bảo CV đạt trên 90 điểm trước
                khi gửi!
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
              Đừng để CV tệ cản trở sự nghiệp của bạn.
            </h2>
            <p className="body-text text-xl text-gray-300 mb-8">
              Trở thành một trong 200 người đầu tiên tại Việt Nam trải nghiệm
              sức mạnh của AI trong việc tạo CV. Hãy để chúng tôi giúp bạn có
              được công việc mơ ước.
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
                  NHẬN VÉ DÙNG THỬ MIỄN PHÍ
                </button>
              </div>
              <p className="small-text text-gray-400">
                Chúng tôi sẽ gửi email mời bạn ngay khi bản beta ra mắt.
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
