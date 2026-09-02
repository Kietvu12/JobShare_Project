export const KNOWN_MORE_ITEMS = [
  { href: '/#reason', image: '/landing/business/assets/images/pages/m-known-more-bnr-01.png', label: 'Ready Crewが選ばれる理由' },
  { href: '/#thought', image: '/landing/business/assets/images/pages/m-known-more-bnr-02.png', label: 'Ready Crewの想い' },
  { href: '/manga/', image: '/landing/business/assets/images/pages/m-known-more-bnr-03.png', label: 'マンガで知るReady Crew' },
  { href: '/#faq', image: '/landing/business/assets/images/pages/m-known-more-bnr-04.png', label: 'よくあるご質問' },
] 

export const PAGINATION = {
  currentPage: 1,
  totalPages: 9,
  totalItems: 126,
  showingFrom: 1,
  showingTo: 9,
  pages: [
    { page: 1, current: true },
    { page: 2, href: '/results/page/2/' },
    { page: 3, href: '/results/page/3/' },
    { page: 4, href: '/results/page/4/' },
    { page: 5, href: '/results/page/5/' },
    { type: 'dots'  },
    { page: 9, href: '/results/page/9/' },
  ],
  nextHref: '/results/page/2/',
} 
