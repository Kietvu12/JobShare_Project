import React from 'react';
import { A, ArrowSvg } from './businessShared.jsx';
import useBusinessLandingCopy from '../hooks/useBusinessLandingCopy';

function FooterSitemapLink({ item }) {
  return (
    <a href={item.href} className="relative block pb-5 h-full text-[#282c32] hover:text-[#0576b6] transition-colors">
      <span className="block text-[20px] lg:text-[18px] xl:text-[22px] font-black leading-[1.4]">{item.label}</span>
      <span className="block text-[16px] lg:text-[14px] xl:text-[18px] font-semibold leading-[1.4] text-[#0576b6]">{item.sub}</span>
      <span className="absolute bottom-0 left-0 right-0 h-px bg-[#d3d6d8]" />
    </a>
  );
}

export default function BusinessFooter() {
  const { t, navItems } = useBusinessLandingCopy();
  const footerCells = [
    navItems[0],
    null,
    navItems[1],
    null,
    navItems[2],
    null,
    navItems[3],
    navItems[4],
  ];

  return (
    <footer className="mt-[85px] lg:mt-[120px] mb-[40px] lg:mb-[76px]">
      <div className="px-[6.667vw] lg:px-[35px] pb-[40px] lg:pb-[80px]">
        <div className="flex flex-wrap justify-between items-start gap-x-[170px] gap-y-12 lg:gap-y-14 border-b border-[#d3d6d8] pb-14 lg:pb-20 mb-8">
          <div className="w-full lg:w-[calc(100%-410px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 min-[1440px]:grid-cols-4! gap-x-[30px] gap-y-8">
              {footerCells.map((item, i) =>
                item ? (
                  <FooterSitemapLink key={item.href} item={item} />
                ) : (
                  <span key={`sp-${i}`} aria-hidden="true" className="hidden lg:block" />
                ),
              )}
            </div>
          </div>

          <div className="w-full max-w-[240px]">
            <img src={`${A}jobshare-logo.png`} alt="JobShare Business" className="h-10 w-auto object-contain" />
            <dl className="mt-6">
              <dt className="text-[16px] lg:text-[15px] xl:text-[18px] font-bold leading-[1.4] text-[#282c32]">
                <span className="block text-[11px] font-medium text-[#282c32]/60 mb-1">{t.footer.operatorLabel}</span>
                Workstation Co. Ltd.
              </dt>
              <dd className="mt-3 text-[13px] leading-[1.8] text-[#282c32]/70 whitespace-pre-line">
                {t.footer.address}
              </dd>
            </dl>
            <ul className="mt-5 space-y-2">
              <li>
                <a href="#" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#282c32] hover:text-[#0576b6] transition-colors">
                  {t.footer.corporateSite} <ArrowSvg />
                </a>
              </li>
              <li>
                <a href="https://recruit.frontier-gr.jp/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#282c32] hover:text-[#0576b6] transition-colors">
                  {t.footer.recruitingSite} <ArrowSvg />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
          <img src={`${A}common-nav-lower-catch.svg`} alt={t.footer.catchAlt} className="h-6 w-auto" />
          <ol className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[14px] font-bold">
            {t.footer.legal.map((label) => (
              <li key={label}>
                <a href="#" className="text-[#282c32] hover:text-[#0576b6] transition-colors">{label}</a>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center gap-4">
          {[
            { href: '#', label: 'Facebook' },
            { href: '#', label: 'X' },
            { href: '#', label: 'Instagram' },
            { href: 'https://note.com/rc_marketing', label: 'Note' },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="w-11 h-11 rounded-full border border-[#d3d6d8] flex items-center justify-center text-[12px] font-black text-[#282c32] hover:border-[#0576b6] hover:text-[#0576b6] transition-colors"
              aria-label={s.label}
            >
              {s.label === 'Facebook' ? 'f' : s.label === 'Note' ? 'note' : s.label}
            </a>
          ))}
        </div>

        <p className="mt-8 text-[12px] font-bold text-[#282c32]/60">{t.footer.copyright}</p>
      </div>
    </footer>
  );
}
