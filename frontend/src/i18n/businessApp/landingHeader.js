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
    companyName: 'Công ty Cổ phần Workstation',
    addressLines: ['Tầng 3, số 82 phố Tuệ Tĩnh, quận Hai Bà Trưng, Hà Nội, Việt Nam'],
    downloadMaterials: 'Tải tài liệu',
    contact: 'Liên hệ',
    corporateSite: 'Trang công ty',
    recruitingSite: 'Trang tuyển dụng',
    businessHours: '10:00 – 18:00 (T2–T6)',
    copyright: '© Công ty Cổ phần Workstation. All Rights Reserved.',
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
    companyName: 'Workstation Joint Stock Company',
    addressLines: ['3F, 82 Tue Tinh Street, Hai Ba Trung District, Hanoi, Vietnam'],
    downloadMaterials: 'Download brochure',
    contact: 'Contact us',
    corporateSite: 'Corporate Site',
    recruitingSite: 'Recruiting Site',
    businessHours: '10:00 – 18:00 (Weekdays)',
    copyright: '© Workstation Joint Stock Company. All Rights Reserved.',
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
    companyName: '株式会社ワークステーション',
    addressLines: ['ベトナム・ハノイ市ハイバーチュン区トゥエティン通り82番地 3階'],
    downloadMaterials: '資料ダウンロード',
    contact: 'お問い合わせ',
    corporateSite: 'Corporate Site',
    recruitingSite: 'Recruiting Site',
    businessHours: '10:00 〜 18:00 (平日)',
    copyright: '© 株式会社ワークステーション. All Rights Reserved.',
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
    addressLines: copy.addressLines?.length
      ? copy.addressLines
      : landingHeaderI18n.ja.addressLines,
    companyName: copy.companyName || landingHeaderI18n.ja.companyName,
    navLinks: NAV_PATHS.map((path, index) => ({
      path,
      label: copy.navLabels[index],
    })),
  }
}
