import { homepageExtrasI18n } from '../../../../../../../i18n/businessApp/homepageExtras.js'

const ICON_CLASSES = [
  'front-page-proposal__icon--first',
  'front-page-proposal__icon--second',
  'front-page-proposal__icon--third',
  'front-page-proposal__icon--fourth',
]

const SUBJECT_EN = {
  'direct-scout': 'Direct Scout',
  'managed-scout': 'Managed Scout',
  'employer-branding': 'Employer Branding',
  'hr-partner-network': 'HR Partner',
}

export const PROPOSAL_ITEMS = homepageExtrasI18n.ja.solutionCards.map((card, index) => ({
  href: card.path,
  icon: `/landing/business/assets/images/front-page/front-page-proposal-icon-0${index + 1}.svg`,
  iconClass: ICON_CLASSES[index],
  title: SUBJECT_EN[card.tagId] || card.title,
  subtitle: card.title,
}))
