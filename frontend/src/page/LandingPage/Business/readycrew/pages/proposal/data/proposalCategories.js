import { homepageExtrasI18n } from '../../../../../../../i18n/businessApp/homepageExtras.js'

const SUBJECT_EN = {
  'direct-scout': 'Direct Scout',
  'managed-scout': 'Managed Scout',
  'employer-branding': 'Employer Branding',
  'hr-partner-network': 'HR Partner',
}

const ICON_VARIANTS = ['first', 'second', 'third', 'fourth']

export const PROPOSAL_CATEGORIES = homepageExtrasI18n.ja.solutionCards.map((card, index) => ({
  href: card.path,
  title: SUBJECT_EN[card.tagId] || card.title,
  subtitle: card.title,
  countLabel: card.suitableFor,
  tags: card.features,
  linkLabel: `${card.title}の詳細`,
  iconSrc: `/landing/business/assets/images/front-page/front-page-proposal-icon-0${index + 1}.svg`,
  iconVariant: ICON_VARIANTS[index],
}))
