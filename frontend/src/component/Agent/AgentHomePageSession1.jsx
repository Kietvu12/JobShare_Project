import React, { useEffect, useMemo, useRef, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import { fetchDashboard, fetchDashboardChart } from '../../store/actions/dashboardActions';
import nominatedIcon from '../../assets/icon for dashboard/Ứng viên đã tiến cử.png';
import interviewingIcon from '../../assets/icon for dashboard/Ứng viên đang phỏng vấn.png';
import offeredIcon from '../../assets/icon for dashboard/Ứng viên đã nhận offer.png';
import expectedCommissionIcon from '../../assets/icon for dashboard/Hoa hồng dự kiến.png';

const VALUE_COLOR = '#1e3a5f';
const LABEL_COLOR = '#94a3b8';
const DEBUG_DASHBOARD_CARD_LOGS_ENABLED = true;

const pickFirstNumber = (...values) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const AgentHomePageSession1 = () => {
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const dispatch = useDispatch();
  const bootstrapRef = useRef(false);

  const { loading, overview } = useSelector(
    (state) => state.dashboard || {}
  );

  useEffect(() => {
    if (bootstrapRef.current) return;
    bootstrapRef.current = true;
    dispatch(fetchDashboard());
    dispatch(fetchDashboardChart({ type: 'month' }));
    return () => {
      bootstrapRef.current = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!DEBUG_DASHBOARD_CARD_LOGS_ENABLED) return;
    console.log('[AgentHomePageSession1] dashboard state', { loading, overview });
  }, [loading, overview]);

  const cards = useMemo(() => {
    const validApplicationsCount = pickFirstNumber(
      overview?.validApplicationsCount,
      overview?.validApplicationCount,
      overview?.validCount
    );
    const interviewingApplicationsCount = pickFirstNumber(
      overview?.interviewingApplicationsCount,
      overview?.interviewingCount,
      overview?.interviewCount,
      overview?.interviewedCount,
      overview?.interviews,
      overview?.totalInterviewed,
      overview?.interviewed
    );
    const hiredCount = pickFirstNumber(
      overview?.nyushaCount,
      overview?.hiredCount,
      overview?.hireCount,
      overview?.offeredCount,
      overview?.offerCount,
      overview?.hired
    );
    const receivedCount = pickFirstNumber(
      overview?.receivedCount,
      overview?.receivedOfferCount,
      overview?.receivedOffers,
      overview?.expectedCommissionCount,
      overview?.commissionCount,
      overview?.commission
    );
    return [
      { key: 'applicant', title: t.applicant, value: String(validApplicationsCount), iconSrc: nominatedIcon },
      { key: 'interviewed', title: t.interviewed, value: String(interviewingApplicationsCount), iconSrc: interviewingIcon },
      { key: 'hired', title: t.hired, value: String(hiredCount), iconSrc: offeredIcon },
      { key: 'received', title: t.received || t.expectedCommission || 'Hoa hồng dự kiến', value: String(receivedCount), iconSrc: expectedCommissionIcon },
    ];
  }, [overview, language, t]);

  const showInitialLoading = loading && (!overview || Object.keys(overview).length === 0);

  if (showInitialLoading) {
    return (
      <div className="rounded-2xl border border-red-100/70 bg-white p-2.5 xl:p-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="text-[12px] font-bold text-slate-900 xl:text-[13px]">{language === 'vi' ? 'Tổng quan hoạt động của bạn' : language === 'en' ? 'Your activity overview' : '活動概要'}</h3>
          <div className="h-6 w-20 animate-pulse rounded-lg bg-slate-50" />
        </div>
        <div className="grid grid-cols-4 gap-1.5 xl:gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="min-h-[66px] animate-pulse rounded-xl border border-red-100/60 bg-white p-2.5 xl:min-h-[72px] xl:p-3"
          >
            <div className="flex items-start gap-1 sm:gap-1.5">
              <div className="h-4 w-4 shrink-0 rounded-full bg-gray-100 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 xl:h-6 xl:w-6" />
              <div className="flex-1 min-w-0">
                <div className="mb-0.5 h-1.5 w-3/4 rounded bg-gray-100 sm:h-1.5 md:h-2" />
                <div className="h-2.5 w-1/2 rounded bg-gray-100 sm:h-3 md:h-3.5" />
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-100/70 bg-white p-2.5 xl:p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-bold text-slate-900 xl:text-[13px]">{language === 'vi' ? 'Tổng quan hoạt động của bạn' : language === 'en' ? 'Your activity overview' : '活動概要'}</h3>
        <button type="button" className="rounded-lg border border-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 hover:border-red-100 hover:text-red-600">
          {language === 'vi' ? 'Tháng này' : language === 'en' ? 'This month' : '今月'}
        </button>
      </div>
      {(!overview || Object.keys(overview).length === 0) && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
          {language === 'vi' ? 'Chưa có dữ liệu tổng quan' : language === 'en' ? 'No dashboard data available' : '概要データがありません'}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-4 gap-1.5 xl:gap-2">
          {cards.map((card) => {
            return (
              <div
                key={card.key}
                className="flex min-h-[64px] items-center gap-1.5 rounded-xl border border-red-100/70 bg-white p-2 shadow-sm shadow-red-900/5 transition-all hover:-translate-y-0.5 hover:shadow-md xl:min-h-[70px] xl:gap-2 xl:p-2.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center xl:h-11 xl:w-11">
                  <img src={card.iconSrc} alt="" className="h-10 w-10 object-contain xl:h-11 xl:w-11" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="truncate text-[10px] leading-tight xl:text-[11px]" style={{ color: LABEL_COLOR }}>
                    {card.title}
                  </p>
                  <p className="mt-0.5 truncate text-[18px] font-bold leading-none xl:text-[20px]" style={{ color: VALUE_COLOR }}>
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(AgentHomePageSession1);
