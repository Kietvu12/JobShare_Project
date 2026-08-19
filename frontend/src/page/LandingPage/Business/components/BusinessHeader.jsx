import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { A, ArrowSvg, TelIcon } from './businessShared.jsx';
import useBusinessLandingCopy from '../hooks/useBusinessLandingCopy';
import BusinessLanguageSwitcher from './BusinessLanguageSwitcher';

export default function BusinessHeader() {
  const { t, navItems } = useBusinessLandingCopy();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="hidden xl:block absolute inset-x-[21px] top-[15px] z-10">
        <div className="flex items-center justify-end text-white">
          <a href="tel:0120-311-532" className="flex items-center mr-3 text-[22px] font-bold leading-none">
            <span className="text-[#0576b6] mr-[5px]">
              <TelIcon />
            </span>
            0120-311-532
          </a>
          <p className="text-[12px] font-bold leading-none pr-[17px] mr-[17px] border-r border-white/20">{t.header.businessHours}</p>
          <a href="#" className="flex items-center gap-1.5 underline text-[13px]">
            <ArrowSvg white />
            {t.header.vendorLink}
          </a>
        </div>
      </div>

      <div className="px-[2.667vw] lg:px-[1.389vw] pt-[2.667vw] lg:pt-[15px] xl:pt-[55px]">
        <div className="bg-white rounded-[6px] px-2.5 py-[11px] lg:px-4 xl:px-5 lg:py-[11px] xl:py-[17px] shadow-[0_10px_10px_0_rgba(0,0,0,0.1)] lg:shadow-none">
          <div className="flex items-center justify-between gap-x-3 xl:gap-x-[3%]">
            <a href="/landing/business" className="flex items-center shrink-0 min-w-0">
              <img src={`${A}jobshare-logo.png`} alt="JobShare Business" className="h-9 lg:h-10 xl:h-11 w-auto max-w-[140px] lg:max-w-[160px] xl:max-w-[220px] object-contain" />
            </a>

            <nav className="hidden xl:flex items-center justify-end flex-1 gap-x-[2%] min-w-0">
              <ol className="flex items-center justify-end gap-x-[1.5%] flex-1 min-w-0">
                {navItems.map((item) => (
                  <li key={item.href} className="text-center min-w-0">
                    <a href={item.href} className="text-[13px] 2xl:text-[14px] font-black text-[#282c32] leading-none hover:text-[#0576b6] transition-colors whitespace-nowrap">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                <BusinessLanguageSwitcher compact />
                <a href="/business/register" className="rounded-[4px] bg-[#0576b6] border-2 border-[#0576b6] text-white px-3 xl:px-4 py-2 font-extrabold text-[12px] xl:text-[13px] leading-none whitespace-nowrap hover:bg-white hover:text-[#0576b6] transition-colors">
                  {t.header.register}
                </a>
                <a href="/business/login" className="rounded-[4px] bg-white border-2 border-[#0576b6] text-[#0576b6] px-3 xl:px-4 py-2 font-extrabold text-[12px] xl:text-[13px] leading-none whitespace-nowrap hover:bg-[#0576b6] hover:text-white transition-colors">
                  {t.header.login}
                </a>
              </div>
            </nav>

            <div className="xl:hidden flex items-center gap-2 shrink-0">
              <BusinessLanguageSwitcher compact />
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex flex-col items-center gap-1 cursor-pointer text-[#282c32]"
                aria-label={t.header.menu}
              >
                <span className="relative block w-[24px] h-[2px] bg-[#282c32]">
                  <span className={`absolute left-0 top-[7px] w-[24px] h-[2px] bg-[#282c32] transition-transform ${open ? '-rotate-45 translate-y-[7px]' : ''}`} />
                  <span className={`absolute left-0 top-[14px] w-[24px] h-[2px] bg-[#282c32] transition-transform ${open ? 'rotate-45 -translate-y-[7px]' : ''}`} />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.05em] leading-none">{t.header.menu}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="xl:hidden fixed inset-0 top-0 bg-[#0576b6] text-white z-40 overflow-y-auto"
          >
            <div className="px-[6.667vw] pt-[110px] pb-[60px]">
              <p className="mb-8">
                <img src={`${A}jobshare-logo.png`} alt="JobShare Business" className="h-10 w-auto object-contain" />
              </p>
              <ol className="border-t border-white/20">
                {navItems.map((item) => (
                  <li key={item.href} className="border-b border-white/20 py-5">
                    <a href={item.href} onClick={() => setOpen(false)} className="flex items-baseline justify-between">
                      <span className="text-[17px] font-black">{item.label}</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">{item.sub}</span>
                    </a>
                  </li>
                ))}
              </ol>
              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/60 mb-2">{t.header.language}</p>
                <BusinessLanguageSwitcher compact className="w-full" />
              </div>
              <div className="mt-10 space-y-3">
                <a href="/business/register" onClick={() => setOpen(false)} className="block text-center rounded-[5px] bg-white text-[#0576b6] py-3.5 font-extrabold text-[15px]">
                  {t.header.register}
                </a>
                <a href="/business/login" onClick={() => setOpen(false)} className="block text-center rounded-[5px] border-2 border-white text-white py-3.5 font-extrabold text-[15px]">
                  {t.header.login}
                </a>
              </div>
              <a href="tel:0120-311-532" className="mt-10 flex items-center justify-center gap-2 text-[22px] font-bold">
                <span className="text-white"><TelIcon /></span>
                0120-311-532
                <span className="text-[12px] font-bold text-white/80">{t.header.businessHours}</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
