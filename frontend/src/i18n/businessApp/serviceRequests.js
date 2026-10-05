/** Service requests catalog & detail pages (business) */

function resolveLang(language) {
  if (language === 'en' || language === 'ja') return language;
  return 'vi';
}

const serviceFields = {
  credit_topup: {
    vi: {
      title: 'Yêu cầu nạp credit',
      shortDesc: 'Nạp thêm credit vào tài khoản để sử dụng các dịch vụ trên JobShare.',
      description:
        'Gửi yêu cầu nạp credit vào ví doanh nghiệp. WS sẽ xác nhận số lượng, hướng dẫn thanh toán và cộng credit sau khi đối soát. Credit dùng cho Scout Trực Tiếp và các tính năng trả phí trên nền tảng.',
      ctaLabel: 'Nạp Credit',
      breadcrumb: 'Nạp credit',
    },
    en: {
      title: 'Credit top-up request',
      shortDesc: 'Add credits to your account to use JobShare services.',
      description:
        'Request credits for your company wallet. WS confirms the amount, payment instructions, and adds credits after reconciliation. Credits power Scout and other paid features.',
      ctaLabel: 'Top up credits',
      breadcrumb: 'Credit top-up',
    },
    ja: {
      title: 'クレジットチャージ依頼',
      shortDesc: 'JobShareのサービス利用のためアカウントにクレジットを追加します。',
      description:
        '企業ウォレットへのチャージを依頼します。WSが数量・入金案内を確認し、照合後にクレジットを付与します。Scout等の有料機能に使用します。',
      ctaLabel: 'クレジットチャージ',
      breadcrumb: 'クレジットチャージ',
    },
  },
  landing_page_premium: {
    vi: {
      title: 'Yêu cầu Landing Page premium',
      shortDesc: 'Sở hữu landing page tuyển dụng chuyên nghiệp – tối ưu chuyển đổi ứng viên.',
      description:
        'WS thiết kế và triển khai landing page tuyển dụng theo brand doanh nghiệp: bố cục chuẩn conversion, form ứng tuyển, tích hợp tracking và tối ưu mobile. Phù hợp chiến dịch employer branding hoặc tuyển dụng hàng loạt.',
      ctaLabel: 'Yêu cầu Landing Page',
      breadcrumb: 'Landing Page premium',
      intro: [
        'Doanh nghiệp có thể sử dụng landing page miễn phí trên JobShare, hoặc yêu cầu thiết kế landing page premium theo nhu cầu riêng — phù hợp chiến dịch employer branding và tuyển dụng hàng loạt.',
        'Đội ngũ marketing Workstation có kinh nghiệm thiết kế landing page tuyển dụng chuyên nghiệp, nhấn mạnh tầm nhìn thương hiệu và thu hút ứng viên chất lượng.',
      ],
      benefitsTitle: 'Lợi ích khi thiết kế Landing Page premium',
      benefits: [
        'Giao diện chuyên nghiệp, thiết kế theo branding công ty.',
        'Nội dung tập trung giá trị cốt lõi, tầm nhìn và văn hóa DN.',
        'Tối ưu trải nghiệm ứng viên, tăng tỷ lệ ứng tuyển.',
        'Tích hợp form ứng tuyển, kết nối trực tiếp JobShare.',
      ],
      docDescription: 'Tải brochure quy trình, giao diện mẫu và bảng giá tham khảo trước khi gửi yêu cầu.',
      docDownloadLabel: 'Download tài liệu (PDF · 2.4 MB)',
      defaultNote: 'Yêu cầu tư vấn & triển khai Landing Page premium',
    },
    en: {
      title: 'Premium landing page request',
      shortDesc: 'Professional recruiting landing pages optimized for candidate conversion.',
      description:
        'WS designs and launches employer-branded landing pages: conversion layout, application forms, tracking, and mobile optimization. Ideal for branding campaigns or high-volume hiring.',
      ctaLabel: 'Request landing page',
      breadcrumb: 'Premium landing page',
      intro: [
        'Use JobShare’s free landing pages or request a custom premium page for branding campaigns and bulk hiring.',
        'Workstation’s marketing team builds professional recruiting landings that highlight your brand and attract quality candidates.',
      ],
      benefitsTitle: 'Benefits of a premium landing page',
      benefits: [
        'Professional design aligned with your brand.',
        'Content focused on vision, culture, and value.',
        'Better candidate experience and apply rates.',
        'Application forms integrated with JobShare.',
      ],
      docDescription: 'Download the process brochure, sample layouts, and pricing guide before submitting.',
      docDownloadLabel: 'Download brochure (PDF · 2.4 MB)',
      defaultNote: 'Consultation & premium landing page delivery',
    },
    ja: {
      title: 'プレミアムLanding Page依頼',
      shortDesc: '候補者コンバージョンに最適化した採用LPを提供します。',
      description:
        'WSがブランドに合わせた採用LPを設計・公開。コンバージョン設計、応募フォーム、トラッキング、モバイル最適化。Employer brandingや大量採用向け。',
      ctaLabel: 'Landing Pageを依頼',
      breadcrumb: 'Landing Page premium',
      intro: [
        'JobShareの無料LPを利用するか、ブランディング・大量採用向けにプレミアムLPを依頼できます。',
        'Workstationマーケティングがブランド訴求と質の高い候補者獲得に強い採用LPを制作します。',
      ],
      benefitsTitle: 'プレミアムLPのメリット',
      benefits: [
        'ブランドに沿ったプロフェッショナルなデザイン',
        'ビジョン・文化・価値に焦点を当てたコンテンツ',
        '候補者体験と応募率の向上',
        'JobShare連携の応募フォーム',
      ],
      docDescription: '依頼前にプロセス資料、サンプル、参考価格表（PDF）をダウンロードできます。',
      docDownloadLabel: '資料ダウンロード (PDF · 2.4 MB)',
      defaultNote: 'プレミアムLanding Pageの相談・制作依頼',
    },
  },
  recruitment_ads: {
    vi: {
      title: 'Yêu cầu chạy quảng cáo tuyển dụng',
      shortDesc: 'Tiếp cận đúng ứng viên tiềm năng qua FB, Google, LinkedIn…',
      description:
        'WS tư vấn chiến lược, setup và vận hành quảng cáo tuyển dụng đa kênh (Meta, Google, LinkedIn…). Bao gồm brief mục tiêu, ngân sách gợi ý, creative và báo cáo hiệu quả định kỳ.',
      ctaLabel: 'Yêu cầu chạy quảng cáo',
      breadcrumb: 'Quảng cáo tuyển dụng',
      intro: [
        'Dịch vụ giúp doanh nghiệp tiếp cận ứng viên tiềm năng trên Facebook, Instagram, Google, LinkedIn và các nền tảng phù hợp với ngành nghề, khu vực tuyển dụng.',
        'Đội ngũ marketing Workstation tư vấn chiến lược, setup và vận hành chiến dịch quảng cáo tuyển dụng — từ brief mục tiêu, ngân sách đến báo cáo hiệu quả định kỳ.',
      ],
      benefitsTitle: 'Lợi ích khi sử dụng dịch vụ chạy quảng cáo tuyển dụng',
      benefits: [
        'Tiếp cận đúng tệp ứng viên theo khu vực, ngành nghề và địa bàn.',
        'Tăng số lượng ứng viên chất lượng phù hợp JD.',
        'Tối ưu chi phí quảng cáo theo mục tiêu chiến dịch.',
        'Báo cáo hiệu quả chi tiết, minh bạch theo từng kênh.',
        'Đội ngũ Workstation hỗ trợ triển khai từ A–Z.',
      ],
      docDescription: 'Tải brochure quy trình, phạm vi dịch vụ, bảng giá tham khảo và case study trước khi gửi yêu cầu.',
      docDownloadLabel: 'Download tài liệu (PDF · 2.6 MB)',
    },
    en: {
      title: 'Recruitment advertising request',
      shortDesc: 'Reach the right candidates on Meta, Google, LinkedIn, and more.',
      description:
        'WS advises, sets up, and runs multi-channel recruiting ads. Includes goals brief, budget guidance, creatives, and periodic performance reports.',
      ctaLabel: 'Request ad campaign',
      breadcrumb: 'Recruitment ads',
      intro: [
        'Reach potential candidates on Facebook, Instagram, Google, LinkedIn, and other platforms matched to your industry and hiring region.',
        'Workstation marketing advises, launches, and operates recruiting ad campaigns—from goals and budget to recurring performance reports.',
      ],
      benefitsTitle: 'Benefits of recruitment advertising',
      benefits: [
        'Target candidates by region, role, and location.',
        'More quality applicants aligned with your JD.',
        'Optimize spend against campaign goals.',
        'Transparent channel-level reporting.',
        'End-to-end support from Workstation.',
      ],
      docDescription: 'Download the process brochure, scope, pricing guide, and case studies before submitting.',
      docDownloadLabel: 'Download brochure (PDF · 2.6 MB)',
    },
    ja: {
      title: '採用広告依頼',
      shortDesc: 'Meta、Google、LinkedIn等で適切な候補者にリーチ。',
      description:
        'WSがマルチチャネル採用広告を提案・設定・運用。目標ブリーフ、予算目安、クリエイティブ、定期レポートを含みます。',
      ctaLabel: '広告を依頼',
      breadcrumb: '採用広告',
      intro: [
        'Facebook、Instagram、Google、LinkedInなど、業界・採用地域に合ったプラットフォームで候補者にリーチ。',
        'Workstationマーケが目標・予算から定期レポートまで採用広告を支援します。',
      ],
      benefitsTitle: '採用広告サービスのメリット',
      benefits: [
        '地域・職種・エリアでターゲティング',
        'JDに合う質の高い応募者を増やす',
        'キャンペーン目標に沿ったコスト最適化',
        'チャネル別の透明なレポート',
        'WorkstationがA–Zでサポート',
      ],
      docDescription: '依頼前にプロセス、サービス範囲、参考価格、事例（PDF）をダウンロード。',
      docDownloadLabel: '資料ダウンロード (PDF · 2.6 MB)',
    },
  },
  seminar_campaign: {
    vi: {
      title: 'Yêu cầu tổ chức Seminar, Campaign tuyển dụng',
      shortDesc: 'Tổ chức sự kiện, seminar, campaign tuyển dụng theo nhu cầu doanh nghiệp.',
      description:
        'Lên kế hoạch và đồng hành tổ chức seminar offline/online, job fair mini, campaign tuyển dụng theo mùa. WS hỗ trợ nội dung, logistics cơ bản và kết nối ứng viên phù hợp.',
      ctaLabel: 'Yêu cầu tổ chức Seminar/Campaign',
      breadcrumb: 'Seminar & Campaign',
      intro: [
        'Dịch vụ giúp doanh nghiệp kết nối trực tiếp với ứng viên tiềm năng thông qua các sự kiện, seminar và campaign tuyển dụng chuyên nghiệp.',
        'Workstation đồng hành từ khâu lên ý tưởng, lập kế hoạch, truyền thông, triển khai đến báo cáo kết quả sau chương trình.',
      ],
      benefitsTitle: 'Lợi ích khi tổ chức Seminar & Campaign tuyển dụng',
      benefits: [
        'Tiếp cận trực tiếp ứng viên chất lượng cao.',
        'Tăng độ nhận diện thương hiệu tuyển dụng của doanh nghiệp.',
        'Sự kiện được thiết kế chuyên nghiệp, phù hợp mục tiêu tuyển dụng.',
        'Hỗ trợ truyền thông đa kênh, thu hút ứng viên tham gia.',
        'Báo cáo chi tiết, đánh giá hiệu quả sau chương trình.',
        'Đội ngũ giàu kinh nghiệm, hỗ trợ toàn diện từ A–Z.',
      ],
      docDescription: 'Tải brochure quy trình, checklist sự kiện và bảng giá tham khảo trước khi gửi yêu cầu.',
      docDownloadLabel: 'Download tài liệu (PDF · 2.3 MB)',
    },
    en: {
      title: 'Seminar & recruiting campaign request',
      shortDesc: 'Events, seminars, and hiring campaigns tailored to your company.',
      description:
        'Plan and run offline/online seminars, mini job fairs, and seasonal hiring campaigns. WS supports content, basic logistics, and candidate matching.',
      ctaLabel: 'Request seminar/campaign',
      breadcrumb: 'Seminar & Campaign',
      intro: [
        'Connect directly with candidates through professional events, seminars, and recruiting campaigns.',
        'Workstation supports ideation, planning, promotion, execution, and post-event reporting.',
      ],
      benefitsTitle: 'Benefits of seminars & campaigns',
      benefits: [
        'Direct access to high-quality candidates.',
        'Stronger employer brand visibility.',
        'Events designed for your hiring goals.',
        'Multi-channel promotion to drive attendance.',
        'Detailed post-event effectiveness reports.',
        'Experienced team supporting end to end.',
      ],
      docDescription: 'Download the process brochure, event checklist, and pricing guide before submitting.',
      docDownloadLabel: 'Download brochure (PDF · 2.3 MB)',
    },
    ja: {
      title: 'セミナー・採用キャンペーン依頼',
      shortDesc: 'イベント、セミナー、採用キャンペーンを企業ニーズに合わせて企画。',
      description:
        'オンライン/オフラインセミナー、ミニジョブフェア、季節キャンペーンを企画・運営。WSがコンテンツ、基本ロジ、候補者マッチングを支援。',
      ctaLabel: 'セミナー/キャンペーンを依頼',
      breadcrumb: 'Seminar & Campaign',
      intro: [
        'プロのイベント・セミナー・採用キャンペーンで候補者と直接つながります。',
        'Workstationが企画、PR、実施、事後レポートまで伴走します。',
      ],
      benefitsTitle: 'セミナー・キャンペーンのメリット',
      benefits: [
        '質の高い候補者への直接リーチ',
        '採用ブランド認知の向上',
        '採用目標に合ったプロのイベント設計',
        'マルチチャネルPRで参加者を獲得',
        '事後の詳細効果レポート',
        '経験豊富なチームのフルサポート',
      ],
      docDescription: '依頼前にプロセス、チェックリスト、参考価格（PDF）をダウンロード。',
      docDownloadLabel: '資料ダウンロード (PDF · 2.3 MB)',
    },
  },
  company_profile: {
    vi: {
      title: 'Yêu cầu thiết kế profile company',
      shortDesc: 'Thiết kế profile công ty chuyên nghiệp, tạo ấn tượng với ứng viên tiềm năng.',
      description:
        'WS biên tập và thiết kế profile công ty (deck/PDF/web snippet) thống nhất visual: giới thiệu công ty, văn hóa, phúc lợi, hình ảnh JD. Dùng cho Saiyo Branding, Scout và kênh tuyển dụng khác.',
      ctaLabel: 'Yêu cầu thiết kế Company Profile',
      breadcrumb: 'Profile company',
      intro: [
        'Profile công ty chuyên nghiệp giúp doanh nghiệp tạo ấn tượng mạnh mẽ với ứng viên tiềm năng, thể hiện rõ văn hóa, phúc lợi và giá trị cốt lõi.',
        'Workstation biên tập nội dung và thiết kế profile (deck, PDF hoặc web snippet) thống nhất visual — dùng đồng bộ trên Saiyo Branding, Scout và các kênh tuyển dụng.',
      ],
      benefitsTitle: 'Lợi ích khi sử dụng dịch vụ thiết kế profile company',
      benefits: [
        'Profile chuyên nghiệp, thống nhất visual theo brand công ty.',
        'Tăng ấn tượng và niềm tin với ứng viên tiềm năng.',
        'Trình bày rõ văn hóa, phúc lợi và giá trị cốt lõi doanh nghiệp.',
        'Dùng đồng bộ trên Saiyo Branding, Scout và các kênh tuyển dụng.',
        'WS biên tập nội dung và thiết kế deck/PDF/web snippet.',
      ],
      docDescription: 'Tải brochure quy trình, mẫu profile và bảng giá tham khảo trước khi gửi yêu cầu.',
      docDownloadLabel: 'Download tài liệu (PDF · 2.1 MB)',
    },
    en: {
      title: 'Company profile design request',
      shortDesc: 'Professional company profiles that impress potential candidates.',
      description:
        'WS edits and designs company profiles (deck/PDF/web snippet) with consistent visuals: about us, culture, benefits, and JD imagery—for Branding, Scout, and other channels.',
      ctaLabel: 'Request company profile',
      breadcrumb: 'Company profile',
      intro: [
        'A polished company profile builds trust with candidates and clearly communicates culture, benefits, and values.',
        'Workstation creates consistent profile assets (deck, PDF, or web snippet) for Saiyo Branding, Scout, and your hiring channels.',
      ],
      benefitsTitle: 'Benefits of company profile design',
      benefits: [
        'On-brand, professional visual identity.',
        'Stronger first impression and trust.',
        'Clear culture, benefits, and values.',
        'Reuse across Branding, Scout, and channels.',
        'WS handles copy and deck/PDF/web design.',
      ],
      docDescription: 'Download the process brochure, samples, and pricing guide before submitting.',
      docDownloadLabel: 'Download brochure (PDF · 2.1 MB)',
    },
    ja: {
      title: '会社プロフィール制作依頼',
      shortDesc: '候補者に好印象を与えるプロの会社プロフィール。',
      description:
        'WSが会社紹介・文化・福利厚生・JDビジュアルを統一デザイン（deck/PDF/web）。Saiyo Branding、Scout等で利用。',
      ctaLabel: 'Company Profileを依頼',
      breadcrumb: 'Company profile',
      intro: [
        'プロの会社プロフィールで文化・福利厚生・価値を明確に伝え、候補者の信頼を得ます。',
        'Workstationがdeck/PDF/webスニペットを統一ビジュアルで制作し、各チャネルで活用できます。',
      ],
      benefitsTitle: '会社プロフィール制作のメリット',
      benefits: [
        'ブランドに沿った統一ビジュアル',
        '候補者への信頼と第一印象の向上',
        '文化・福利厚生・価値の明確な提示',
        'Branding・Scout等で横展開',
        'WSが文案とデザインを担当',
      ],
      docDescription: '依頼前にプロセス、サンプル、参考価格（PDF）をダウンロード。',
      docDownloadLabel: '資料ダウンロード (PDF · 2.1 MB)',
    },
  },
  other_service: {
    vi: {
      title: 'Yêu cầu khác',
      shortDesc: 'Các yêu cầu dịch vụ khác theo nhu cầu riêng của doanh nghiệp.',
      description:
        'Mô tả nhu cầu cụ thể của doanh nghiệp. WS sẽ review, báo giá/phạm vi hỗ trợ và phản hồi qua tin nhắn trong vòng 1–2 ngày làm việc.',
      ctaLabel: 'Gửi yêu cầu khác',
    },
    en: {
      title: 'Other request',
      shortDesc: 'Custom service requests for your specific needs.',
      description:
        'Describe your needs. WS will review, quote scope, and reply via message within 1–2 business days.',
      ctaLabel: 'Submit other request',
    },
    ja: {
      title: 'その他の依頼',
      shortDesc: '企業の個別ニーズに合わせたサービス依頼。',
      description:
        '具体的なニーズを記載してください。WSが確認・見積もりし、1–2営業日以内にメッセージで返信します。',
      ctaLabel: 'その他を依頼',
    },
  },
};

export const serviceRequestsI18n = {
  vi: {
    breadcrumb: 'Yêu cầu dịch vụ',
    pageTitle: 'Chọn dịch vụ bạn muốn yêu cầu',
    pageIntro:
      'Tạo yêu cầu mới và theo dõi tiến độ tại đây. Các dịch vụ branding (Landing Page, quảng cáo, seminar…) vẫn quản lý nội dung trong Thương hiệu tuyển dụng — màn này là nơi gửi và theo dõi yêu cầu tới WS.',
    noteLabel: 'Lưu ý:',
    noteBody: 'Thời gian xử lý 1–2 ngày làm việc. WS liên hệ xác nhận sau khi tiếp nhận.',
    loading: 'Đang tải...',
    successSent: 'Đã gửi yêu cầu. WS sẽ liên hệ xác nhận trong thời gian sớm nhất.',
    continueCta: 'Tiếp tục',
    otherServicesHeading: 'Các yêu cầu dịch vụ nổi bật khác',
    sidebar: {
      account: 'Tài khoản:',
      processing: (n) => `${n} yêu cầu đang xử lý`,
      recentTitle: 'Yêu cầu gần đây',
      viewAll: 'Xem tất cả',
      empty: 'Chưa có yêu cầu. Chọn dịch vụ bên trái để bắt đầu.',
      billingLink: 'Quản lý trên Billing',
      allModalTitle: 'Tất cả yêu cầu gần đây',
      billingCta: 'Mở trang Billing & yêu cầu',
    },
    intake: {
      docSectionTitle: 'Tài liệu giới thiệu chi tiết',
      submit: 'Gửi yêu cầu →',
      submitting: 'Đang gửi…',
    },
    modal: {
      currentCredit: 'Credit hiện tại:',
      amountLabel: 'Số credit cần nạp',
      amountPlaceholder: 'VD: 2000',
      noteLabel: 'Ghi chú / mô tả thêm',
      noteOptional: '(tuỳ chọn)',
      notePlaceholderCredit: 'VD: Cần nạp gấp cho chiến dịch Scout tháng này…',
      notePlaceholderService: 'Mô tả nhu cầu, timeline, ngân sách dự kiến (nếu có)…',
      close: 'Đóng',
      submit: 'Gửi yêu cầu',
      errAmount: 'Vui lòng nhập số credit cần nạp (lớn hơn 0).',
      errCredit: 'Không thể gửi yêu cầu nạp credit',
      errService: 'Không thể gửi yêu cầu dịch vụ',
      errGeneric: 'Không thể gửi yêu cầu. Vui lòng thử lại.',
    },
  },
  en: {
    breadcrumb: 'Service requests',
    pageTitle: 'Choose a service to request',
    pageIntro:
      'Create new requests and track progress here. Branding content (landing pages, ads, seminars…) is still managed under Employer Branding—this hub is for submitting and tracking requests to WS.',
    noteLabel: 'Note:',
    noteBody: 'Processing takes 1–2 business days. WS will contact you to confirm after receipt.',
    loading: 'Loading...',
    successSent: 'Request sent. WS will confirm with you shortly.',
    continueCta: 'Continue',
    otherServicesHeading: 'Other featured service requests',
    sidebar: {
      account: 'Account:',
      processing: (n) => `${n} request(s) in progress`,
      recentTitle: 'Recent requests',
      viewAll: 'View all',
      empty: 'No requests yet. Pick a service on the left to get started.',
      billingLink: 'Manage in Billing',
      allModalTitle: 'All recent requests',
      billingCta: 'Open Billing & requests',
    },
    intake: {
      docSectionTitle: 'Detailed brochure',
      submit: 'Submit request →',
      submitting: 'Sending…',
    },
    modal: {
      currentCredit: 'Current credits:',
      amountLabel: 'Credits to add',
      amountPlaceholder: 'e.g. 2000',
      noteLabel: 'Notes / details',
      noteOptional: '(optional)',
      notePlaceholderCredit: 'e.g. Need credits urgently for this month’s Scout campaign…',
      notePlaceholderService: 'Describe needs, timeline, expected budget (if any)…',
      close: 'Close',
      submit: 'Submit request',
      errAmount: 'Enter credits to add (greater than 0).',
      errCredit: 'Could not send credit request',
      errService: 'Could not send service request',
      errGeneric: 'Could not send request. Please try again.',
    },
  },
  ja: {
    breadcrumb: 'サービス依頼',
    pageTitle: '依頼するサービスを選択',
    pageIntro:
      '新規依頼の作成と進捗確認はこちら。Landing Page・広告・セミナー等のブランディングコンテンツは「Employer Branding」で管理—この画面はWSへの依頼送信・追跡用です。',
    noteLabel: '注意:',
    noteBody: '処理は1–2営業日。受付後にWSが確認の連絡をします。',
    loading: '読み込み中...',
    successSent: '依頼を送信しました。WSが確認連絡をします。',
    continueCta: '続ける',
    otherServicesHeading: 'その他のおすすめサービス依頼',
    sidebar: {
      account: 'アカウント:',
      processing: (n) => `処理中 ${n} 件`,
      recentTitle: '最近の依頼',
      viewAll: 'すべて見る',
      empty: '依頼はまだありません。左からサービスを選択してください。',
      billingLink: 'Billingで管理',
      allModalTitle: '最近の依頼一覧',
      billingCta: 'Billing & 依頼を開く',
    },
    intake: {
      docSectionTitle: '詳細資料',
      submit: '依頼を送信 →',
      submitting: '送信中…',
    },
    modal: {
      currentCredit: '現在のクレジット:',
      amountLabel: 'チャージするクレジット',
      amountPlaceholder: '例: 2000',
      noteLabel: 'メモ / 詳細',
      noteOptional: '（任意）',
      notePlaceholderCredit: '例: 今月のScoutキャンペーン用に急ぎで…',
      notePlaceholderService: 'ニーズ、スケジュール、予算目安など…',
      close: '閉じる',
      submit: '依頼を送信',
      errAmount: 'チャージするクレジット（0より大）を入力してください。',
      errCredit: 'クレジット依頼を送信できませんでした',
      errService: 'サービス依頼を送信できませんでした',
      errGeneric: '依頼を送信できませんでした。再度お試しください。',
    },
  },
};

export function getServiceRequestsCopy(language = 'vi') {
  return serviceRequestsI18n[resolveLang(language)] || serviceRequestsI18n.vi;
}

export function getServiceRequestFields(key, language = 'vi') {
  const lang = resolveLang(language);
  const block = serviceFields[key];
  if (!block) return null;
  return block[lang] || block.vi;
}

export function getServiceRequestDetailCopy(serviceKey, language = 'vi') {
  return getServiceRequestFields(serviceKey, language) || {};
}
