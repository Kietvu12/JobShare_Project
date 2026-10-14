import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ABOUT_US_COPY,
  ABOUT_US_HERO_IMAGE,
  ABOUT_US_VISION_IMAGE,
} from '../content/aboutUsCopy';

export default function AboutUsView() {
  const { language } = useLanguage();
  const copy = ABOUT_US_COPY[language] || ABOUT_US_COPY.vi;

  return (
    <div className="bg-[#f7f8fa] text-[#0b192c]">
      <Helmet>
        <title>{copy.seoTitle}</title>
        <meta name="description" content={copy.seoDescription} />
      </Helmet>

      <section className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
          <img src={ABOUT_US_HERO_IMAGE} alt={copy.title} className="h-auto w-full object-cover" />
        </div>

        <div className="mx-auto mt-10 max-w-[920px] text-center lg:mt-14">
          <p className="text-xs font-bold tracking-[0.28em] text-[#b60100]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#b60100] sm:text-4xl">
            {copy.title}
          </h1>
          <div className="mt-8 border-l-4 border-[#b60100] bg-white p-6 text-left shadow-[0_2px_18px_rgba(15,23,42,0.04)] sm:p-9">
            <p className="text-lg font-bold leading-8 text-[#0b192c]">{copy.lead}</p>
            <div className="mt-5 space-y-4 text-[15px] leading-8 text-[#444]">
              <p>{copy.intro1}</p>
              <p>{copy.intro2}</p>
              <p>{copy.intro3}</p>
            </div>
          </div>
        </div>

        <section className="mt-14 grid overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] lg:mt-20 lg:grid-cols-2 lg:items-center lg:p-8">
          <div className="p-2">
            <img
              src={ABOUT_US_VISION_IMAGE}
              alt="Workstation Vision"
              className="w-full rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
            />
          </div>
          <div className="space-y-8 p-4 sm:p-8">
            <div>
              <h2 className="border-b border-neutral-200 pb-3 text-2xl font-extrabold text-[#b60100]">
                MISSION{' '}
                <span className="ml-2 text-sm font-medium text-neutral-500">
                  ({copy.missionLabel})
                </span>
              </h2>
              <p className="mt-4 text-[15px] leading-8 text-[#444]">{copy.mission}</p>
            </div>
            <div>
              <h2 className="border-b border-neutral-200 pb-3 text-2xl font-extrabold text-[#b60100]">
                VISION{' '}
                <span className="ml-2 text-sm font-medium text-neutral-500">
                  ({copy.visionLabel})
                </span>
              </h2>
              <p className="mt-4 text-[15px] leading-8 text-[#444]">{copy.vision}</p>
            </div>
          </div>
        </section>

        <section className="mt-14 lg:mt-20">
          <h2 className="text-center text-3xl font-extrabold text-[#0b192c]">{copy.strengthsTitle}</h2>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {copy.strengths.map((item, index) => (
              <article
                key={item.title}
                className="flex h-full flex-col rounded-xl border-t-4 bg-white p-7 shadow-[0_6px_24px_rgba(15,23,42,0.06)]"
                style={{ borderTopColor: index === 0 ? '#b60100' : index === 1 ? '#0b192c' : '#5a5a5a' }}
              >
                <h3
                  className="min-h-[48px] text-base font-extrabold leading-6"
                  style={{ color: index === 0 ? '#b60100' : index === 1 ? '#0b192c' : '#333' }}
                >
                  {item.title}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-[#555]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:mt-20 lg:p-10">
          <h2 className="text-center text-3xl font-extrabold text-[#0b192c]">{copy.companyTitle}</h2>
          <div className="mt-9 overflow-hidden rounded-xl border border-neutral-200">
            {copy.companyRows.map(([label, value]) => (
              <div
                key={label}
                className="grid border-b border-neutral-200 last:border-b-0 md:grid-cols-[28%_1fr]"
              >
                <div className="bg-[#f8f9fa] px-5 py-4 text-sm font-extrabold text-[#333] sm:px-7 sm:py-6 md:text-base">
                  {label}
                </div>
                <div className="whitespace-pre-line px-5 py-4 text-sm leading-8 text-[#444] sm:px-7 sm:py-6 md:text-base">
                  {label.includes('Liên') || label.includes('Contact') || label.includes('連絡') ? (
                    <div className="space-y-1">
                      {value.split('\n').map((line) => (
                        <div key={line} className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#b60100]" />
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : label.includes('Địa') ||
                    label.includes('Address') ||
                    label.includes('Location') ||
                    label.includes('所在地') ? (
                    <div className="flex gap-2">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#b60100]" />
                      <span>{value}</span>
                    </div>
                  ) : label.includes('Lĩnh vực') ||
                    label.includes('Business') ||
                    label.includes('事業') ? (
                    <ul className="space-y-2">
                      {value.split('\n').map((line) => (
                        <li key={line} className="flex items-baseline gap-2">
                          <span className="relative -top-[0.08em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b60100]" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    value
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="mx-auto max-w-2xl text-base leading-7 text-[#5a5a5a]">{copy.ctaText}</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('jobshare:open-support-chat'))}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#b60100] px-9 py-4 text-base font-extrabold !text-white shadow-[0_8px_22px_rgba(182,1,0,0.25)] transition hover:bg-[#990000]"
          >
            {copy.ctaButton}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </section>
    </div>
  );
}
