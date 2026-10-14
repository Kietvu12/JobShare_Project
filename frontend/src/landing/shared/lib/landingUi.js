/** Class Tailwind dùng chung — JobShare public landing (CTV + ứng viên). */
export const landingContainer = 'mx-auto w-full max-w-[1200px] px-4 sm:px-8';

export const landingBtnPrimary =
  'inline-flex min-h-[54px] items-center justify-center rounded-md border border-[#ed212f] bg-[#ed212f] px-6 py-3 text-center text-base font-bold text-white shadow-[0_5px_0_#be182422] transition hover:-translate-y-0.5 hover:bg-[#be1824]';

export const landingBtnQuiet =
  'inline-flex min-h-[54px] items-center justify-center rounded-md border border-[#b5c6cf] bg-transparent px-6 py-3 text-center text-base font-bold text-[#112f3d] transition hover:-translate-y-0.5 hover:shadow-md';

export const landingSection = 'py-16 sm:py-20 lg:py-24';

export const landingKicker =
  'mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-[#be1824] before:h-0.5 before:w-9 before:bg-current';

export const landingSectionTitle =
  'text-[clamp(1.75rem,3.5vw,2.25rem)] font-black leading-tight tracking-tight text-[#112f3d]';

/** @deprecated Dùng landingContainer */
export const ctvContainer = landingContainer;

/** @deprecated Dùng landingBtnPrimary */
export const ctvBtnPrimary = landingBtnPrimary;

/** @deprecated Dùng landingBtnQuiet */
export const ctvBtnQuiet = landingBtnQuiet;

/** @deprecated Dùng landingSection */
export const ctvSection = landingSection;

/** @deprecated Dùng landingKicker */
export const ctvKicker = landingKicker;

/** @deprecated Dùng landingSectionTitle */
export const ctvSectionTitle = landingSectionTitle;
