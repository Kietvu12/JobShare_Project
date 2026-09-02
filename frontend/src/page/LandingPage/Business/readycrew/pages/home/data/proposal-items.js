import { homepageExtrasI18n } from '../../../../../../../i18n/businessApp/homepageExtras.js'

const ICON_VARIANTS = ['first', 'second', 'third', 'fourth']

const SUBJECT_EN = {
  'direct-scout': 'Direct Scout',
  'managed-scout': 'Managed Scout',
  'employer-branding': 'Employer Branding',
  'hr-partner-network': 'HR Partner',
}

export const ProposalItems = homepageExtrasI18n.ja.solutionCards.map((card, index) => ({
  href: card.path,
  iconVariant: ICON_VARIANTS[index],
  iconSrc: `/landing/business/assets/images/front-page/front-page-proposal-icon-0${index + 1}.svg`,
  subject: SUBJECT_EN[card.tagId] || card.title,
  subjectJp: card.title,
  tags: card.features,
}))
