import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">✅</span>
          </div>
          
          {/* Main Message */}
          <h1 className="heading-main text-3xl lg:text-4xl text-gray-900 mb-6">
            Cảm ơn bạn đã đăng ký!
          </h1>
          
          <p className="body-text text-lg text-gray-600 mb-8 leading-relaxed">
            FastRezu sẽ gửi email cho bạn ngay khi ra mắt. 
            <br/>
            Chúng tôi sẽ thông báo sớm nhất khi phiên bản beta sẵn sàng!
          </p>
          
          {/* Additional Info */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="heading-sub text-xl text-gray-900 mb-4">
              Những gì bạn sẽ nhận được:
            </h2>
            <ul className="body-text text-gray-600 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Quyền truy cập sớm vào FastRezu
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Hướng dẫn sử dụng chi tiết
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Ưu đãi đặc biệt cho người dùng đầu tiên
              </li>
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="btn-primary btn-text px-8 py-3"
            >
              VỀ TRANG CHỦ
            </Link>
            {/* <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary btn-text px-8 py-3"
            >
              THEO DÕI FACEBOOK
            </a> */}
          </div>
          
          {/* Footer Note */}
          {/* <p className="small-text text-gray-500 mt-8">
            Có câu hỏi? Liên hệ chúng tôi tại support@fastrezu.com
          </p> */}
        </div>
      </div>
    </div>
  );
}
