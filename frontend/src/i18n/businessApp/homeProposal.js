import { homepageExtrasI18n } from './homepageExtras.js'

const ICON_VARIANTS = ['first', 'second', 'third', 'fourth']

const SUBJECT_EN = {
  'direct-scout': 'Direct Scout',
  'managed-scout': 'Managed Scout',
  'employer-branding': 'Employer Branding',
  'hr-partner-network': 'HR Partner',
}

export const homeProposalI18n = {
  vi: {
    titleLine1: 'Theo nhu cầu tuyển dụng và quy mô doanh nghiệp,',
    titleHighlight1: '4 dịch vụ',
    titleMid: ' tối ưu dành cho ',
    titleHighlight2: 'bạn',
    viewAllBtn: 'Xem tất cả dịch vụ',
  },
  en: {
    titleLine1: 'Based on your hiring needs and team setup,',
    titleHighlight1: '4 services',
    titleMid: ' tailored for ',
    titleHighlight2: 'your company',
    viewAllBtn: 'View all services',
  },
  ja: {
    titleLine1: '採用課題と社内体制に合わせて',
    titleHighlight1: '最適な4つの採用サービス',
    titleMid: 'を',
    titleHighlight2: 'ご提案',
    viewAllBtn: 'マッチング領域を全て見る',
  },
}

export function getHomeProposalCopy(language) {
  return homeProposalI18n[language] || homeProposalI18n.vi
}

export function getProposalItems(language) {
  const cards = homepageExtrasI18n[language]?.solutionCards || homepageExtrasI18n.vi.solutionCards

  return cards.map((card, index) => {
    const base = {
      href: card.path,
      iconVariant: ICON_VARIANTS[index],
      iconSrc: `/landing/business/assets/images/front-page/front-page-proposal-icon-0${index + 1}.svg`,
      tags: card.features,
    }

    if (language === 'ja') {
      return {
        ...base,
        subject: SUBJECT_EN[card.tagId] || card.title,
        subjectSubtitle: card.title,
      }
    }

    return {
      ...base,
      subject: card.title,
      subjectSubtitle: card.subtitle,
    }
  })
}
