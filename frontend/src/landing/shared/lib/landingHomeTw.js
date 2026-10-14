import {
  landingBtnPrimary,
  landingBtnQuiet,
  landingContainer,
  landingKicker,
  landingSection,
  landingSectionTitle,
} from './landingUi';

/** Tailwind thay cho class template V3 (hero, section, card, …) */
export const tw = {
  container: landingContainer,
  btnPrimary: landingBtnPrimary,
  btnQuiet: landingBtnQuiet,
  section: landingSection,
  kicker: landingKicker,
  sectionTitle: landingSectionTitle,

  hero: 'relative overflow-hidden border-b border-[#dae4e9] bg-gradient-to-br from-white via-[#f8fbff] to-[#eaf5fc]',
  heroGrid:
    'mx-auto grid w-full max-w-[1200px] items-center gap-8 px-4 py-14 sm:px-8 lg:min-h-[560px] lg:grid-cols-2 lg:gap-10 lg:py-16',
  heroCopy: 'relative z-[1]',
  heroTitle: 'text-[clamp(2rem,4.2vw,3.25rem)] font-black leading-[1.14] tracking-tight text-[#112f3d]',
  heroLine: 'block',
  heroLineAccent: 'block text-[#ed212f]',
  heroLead: 'mt-5 max-w-lg text-lg leading-relaxed text-[#2f4d5c]',
  heroActions: 'mt-7 flex flex-wrap items-center gap-3',
  heroMedia: 'relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none',
  heroMediaImg: 'w-full rounded-xl shadow-[0_24px_65px_#123c5a21]',

  sectionNumber:
    'mb-4 flex items-center gap-3 text-sm font-bold tracking-widest text-[#ed212f] before:h-0.5 before:w-9 before:bg-current',
  sectionHead: 'mb-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end',
  sourceSectionHead: 'mb-10 max-w-3xl',
  semanticLine: 'block',

  communityGrid: 'grid gap-0 border-l border-t border-[#112f3d] sm:grid-cols-2 lg:grid-cols-3',
  communityCard:
    'border-b border-r border-[#dae4e9] bg-white p-6 transition hover:-translate-y-1 hover:bg-[#f8fbfe] hover:shadow-lg sm:p-7',
  cardTop: 'mb-5 flex items-center justify-between text-[#ed212f]',
  cardNumber: 'font-black text-4xl leading-none text-[#ed212f]',

  whyGrid: 'grid gap-5 sm:grid-cols-2',
  whyCard:
    'rounded-md border border-[#dae4e9] bg-white p-6 transition hover:-translate-y-1 hover:bg-[#f8fbfe] hover:shadow-lg sm:p-7',

  split: 'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
  mediaFrame: 'overflow-hidden rounded-lg shadow-[0_20px_45px_#123c5a18]',
  mediaImg: 'h-auto w-full',

  flowBoard: 'grid border-l border-[#abc2d0] lg:grid-cols-3',
  flowStep:
    'relative border-b border-r border-[#dae4e9] bg-white p-6 sm:p-7 lg:border-l-0 lg:first:border-l',
  stepTop: 'mb-5 flex items-center justify-between text-[#ed212f]',
  stepNo: 'text-4xl font-semibold leading-none',

  platformIntro: 'mb-10 grid items-center gap-10 lg:grid-cols-[0.83fr_1.17fr]',
  features: 'grid gap-5 lg:grid-cols-2',
  feature: 'rounded-md border border-[#dae4e9] bg-[#f2f8fc] p-6',
  featureHeading: 'mb-4 flex items-start gap-4',
  checkList: 'mt-3 space-y-2 text-base text-[#2f4d5c]',
  checkItem: 'relative pl-6 before:absolute before:left-0 before:font-bold before:text-[#ed212f] before:content-["✓"]',

  partnerLead: 'mt-4 max-w-xl text-base leading-relaxed text-[#2f4d5c]',
  partnerGrid: 'grid grid-cols-3 border-l border-t border-[#dae4e9] sm:grid-cols-4 lg:grid-cols-6',
  partner:
    'flex h-24 items-center justify-center border-b border-r border-[#dae4e9] bg-white p-4 sm:h-[100px]',

  jobsGrid: 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
  jobCard:
    'flex min-h-[230px] flex-col rounded-md border border-[#dae4e9] bg-white p-6 transition hover:-translate-y-1 hover:border-[#c7d6de] hover:shadow-lg',
  jobCardTop: 'mb-4 flex items-start justify-between gap-3',
  jobCompany: 'text-sm font-bold text-[#617782]',
  jobArrow:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dae4e9] text-lg text-[#be1824]',
  jobMeta: 'mt-auto flex flex-wrap items-center gap-3 border-t border-[#dae4e9] pt-4 text-sm',
  jobSalary: 'font-extrabold text-[#be1824]',
  jobType: 'text-[#617782]',
  jobMoreCard:
    'flex min-h-[230px] flex-col justify-between rounded-md border border-[#d91d2a] bg-gradient-to-br from-[#ed212f] via-[#d91d2a] to-[#be1824] p-6 text-white shadow-lg transition hover:-translate-y-1',
  jobMoreTop: 'flex items-center justify-between text-xs font-bold uppercase tracking-wide text-white/90',
  jobMoreArrow: 'flex h-9 w-9 items-center justify-center rounded-full border border-white/40',

  newsGrid: 'grid gap-6 sm:grid-cols-2',
  newsCard:
    'flex flex-col overflow-hidden rounded-lg border border-[#dae4e9] bg-white transition hover:-translate-y-1 hover:shadow-lg',
  newsImage: 'aspect-video overflow-hidden bg-[#f2f8fc]',
  newsBody: 'flex flex-1 flex-col p-5',
  newsMeta: 'mb-3 flex flex-wrap gap-2 text-sm text-[#617782]',
  textLink:
    'inline-block border-b border-[#ed212f66] pb-0.5 text-sm font-bold text-[#be1824] hover:text-[#ed212f]',

  final: 'bg-white py-16 sm:py-20',
  finalBox: 'grid overflow-hidden rounded-xl border border-[#dae4e9] bg-[#f4f9fc] lg:grid-cols-2',
  finalMedia: 'min-h-[280px] lg:min-h-[420px]',
  finalMediaImg: 'h-full w-full object-cover',
  finalCopy: 'flex flex-col justify-center p-8 sm:p-10 lg:p-11',
  finalTitle: 'text-3xl font-black leading-tight text-[#112f3d] sm:text-4xl',
  finalTitleAccent: 'text-[#ed212f]',

  sectionH2: 'text-[clamp(1.65rem,3vw,2.35rem)] font-black leading-tight text-[#112f3d]',
  cardTitle: 'text-xl font-bold text-[#112f3d]',
  cardDesc: 'mt-2 text-base leading-relaxed text-[#2f4d5c]',
  cardIcon: 'h-7 w-7 shrink-0 text-[#ed212f]',
  splitCopy: 'flex flex-col justify-center',
};

export const landingSiteRoot =
  'flex min-h-screen flex-col bg-white font-[Barlow,"Segoe_UI",Arial,sans-serif] text-[17px] leading-relaxed text-[#112f3d] antialiased';

export const landingMain = 'flex min-h-0 flex-1 flex-col';

export const candidateSolidCta =
  '!text-white visited:!text-white hover:!text-white focus:!text-white';
