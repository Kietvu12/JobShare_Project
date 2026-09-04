const NAV_PATHS = ['/price', '/proposal', '/seminar', '/news', '/about-us']

export const landingHeaderI18n = {
  vi: {
    menu: 'Menu',
    registerLines: ['Đăng ký'],
    loginLines: ['Đăng nhập'],
    navLabels: [
      'Về JobShare',
      'Dịch vụ',
      'Sự kiện',
      'Tin tức',
      'Công ty',
    ],
    operatorLabel: 'Công ty vận hành',
    downloadMaterials: 'Tải tài liệu',
    contact: 'Liên hệ',
    corporateSite: 'Trang công ty',
    recruitingSite: 'Trang tuyển dụng',
    businessHours: '10:00 – 18:00 (T2–T6)',
    copyright: '© FRONTIER Co. Ltd. All Rights Reserved.',
  },
  en: {
    menu: 'Menu',
    registerLines: ['Register'],
    loginLines: ['Log in'],
    navLabels: [
      'About JobShare Business',
      'Services',
      'Seminars & Events',
      'News',
      'Company',
    ],
    operatorLabel: 'Operator',
    downloadMaterials: 'Download brochure',
    contact: 'Contact us',
    corporateSite: 'Corporate Site',
    recruitingSite: 'Recruiting Site',
    businessHours: '10:00 – 18:00 (Weekdays)',
    copyright: '© FRONTIER Co. Ltd. All Rights Reserved.',
  },
  ja: {
    menu: 'Menu',
    registerLines: ['無料登録'],
    loginLines: ['ログイン'],
    navLabels: [
      'JobShare Businessとは',
      '各サービス',
      'セミナー・イベント',
      'ニュース',
      '会社概要',
    ],
    operatorLabel: '運営会社',
    downloadMaterials: '資料ダウンロード',
    contact: 'お問い合わせ',
    corporateSite: 'Corporate Site',
    recruitingSite: 'Recruiting Site',
    businessHours: '10:00 〜 18:00 (平日)',
    copyright: '© FRONTIER Co. Ltd. All Rights Reserved.',
  },
}

export function getLandingHeaderCopy(language) {
  const copy = landingHeaderI18n[language] || landingHeaderI18n.vi
  const registerLines = copy.registerLines?.length
    ? copy.registerLines
    : copy.register
      ? [copy.register]
      : landingHeaderI18n.ja.registerLines
  const loginLines = copy.loginLines?.length
    ? copy.loginLines
    : copy.login
      ? [copy.login]
      : landingHeaderI18n.ja.loginLines

  return {
    ...copy,
    registerLines,
    loginLines,
    register: registerLines.join(' '),
    login: loginLines.join(' '),
    navLinks: NAV_PATHS.map((path, index) => ({
      path,
      label: copy.navLabels[index],
    })),
  }
}
