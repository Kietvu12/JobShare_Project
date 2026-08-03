import {
  Coins,
  LayoutTemplate,
  Megaphone,
  Users,
  Building2,
  MoreHorizontal,
} from 'lucide-react';

/** Catalog dịch vụ DN có thể gửi yêu cầu tới WS. */
export const BUSINESS_SERVICE_REQUEST_CATALOG = [
  {
    key: 'credit_topup',
    title: 'Yêu cầu nạp credit',
    shortDesc: 'Nạp thêm credit vào tài khoản để sử dụng các dịch vụ trên JobShare.',
    description:
      'Gửi yêu cầu nạp credit vào ví doanh nghiệp. WS sẽ xác nhận số lượng, hướng dẫn thanh toán và cộng credit sau khi đối soát. Credit dùng cho Scout Credit, các tính năng trả phí trên nền tảng.',
    icon: Coins,
    iconBg: '#e8f4fa',
    iconColor: '#0077B6',
    requiresAmount: true,
    apiType: 'credit',
    detailPath: '/business/service-requests/credit',
  },
  {
    key: 'landing_page_premium',
    title: 'Yêu cầu Landing Page premium',
    shortDesc: 'Sở hữu landing page tuyển dụng chuyên nghiệp – tối ưu chuyển đổi ứng viên.',
    description:
      'WS thiết kế và triển khai landing page tuyển dụng theo brand doanh nghiệp: bố cục chuẩn conversion, form ứng tuyển, tích hợp tracking và tối ưu mobile. Phù hợp chiến dịch employer branding hoặc tuyển dụng hàng loạt.',
    icon: LayoutTemplate,
    iconBg: '#fce7f3',
    iconColor: '#db2777',
    apiType: 'service',
    detailPath: '/business/service-requests/landing-page',
  },
  {
    key: 'recruitment_ads',
    title: 'Yêu cầu chạy quảng cáo tuyển dụng',
    shortDesc: 'Tiếp cận đúng ứng viên tiềm năng qua FB, Google, LinkedIn…',
    description:
      'WS tư vấn chiến lược, setup và vận hành quảng cáo tuyển dụng đa kênh (Meta, Google, LinkedIn…). Bao gồm brief mục tiêu, ngân sách gợi ý, creative và báo cáo hiệu quả định kỳ.',
    icon: Megaphone,
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    apiType: 'service',
    detailPath: '/business/service-requests/recruitment-ads',
  },
  {
    key: 'seminar_campaign',
    title: 'Yêu cầu tổ chức Seminar, Campaign tuyển dụng',
    shortDesc: 'Tổ chức sự kiện, seminar, campaign tuyển dụng theo nhu cầu doanh nghiệp.',
    description:
      'Lên kế hoạch và đồng hành tổ chức seminar offline/online, job fair mini, campaign tuyển dụng theo mùa. WS hỗ trợ nội dung, logistics cơ bản và kết nối ứng viên phù hợp.',
    icon: Users,
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    apiType: 'service',
    detailPath: '/business/service-requests/seminar-campaign',
  },
  {
    key: 'company_profile',
    title: 'Yêu cầu thiết kế profile company',
    shortDesc: 'Thiết kế profile công ty chuyên nghiệp, tạo ấn tượng với ứng viên tiềm năng.',
    description:
      'WS biên tập và thiết kế profile công ty (deck/PDF/web snippet) thống nhất visual: giới thiệu công ty, văn hóa, phúc lợi, hình ảnh JD. Dùng cho Saiyo Branding, Scout và kênh tuyển dụng khác.',
    icon: Building2,
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
    apiType: 'service',
    detailPath: '/business/service-requests/company-profile',
  },
  {
    key: 'other_service',
    title: 'Yêu cầu khác',
    shortDesc: 'Các yêu cầu dịch vụ khác theo nhu cầu riêng của doanh nghiệp.',
    description:
      'Mô tả nhu cầu cụ thể của doanh nghiệp. WS sẽ review, báo giá/phạm vi hỗ trợ và phản hồi qua tin nhắn trong vòng 1–2 ngày làm việc.',
    icon: MoreHorizontal,
    iconBg: '#f1f5f9',
    iconColor: '#64748b',
    apiType: 'service',
  },
];

export function getServiceByKey(key) {
  return BUSINESS_SERVICE_REQUEST_CATALOG.find((s) => s.key === key) || null;
}
