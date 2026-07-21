import React, { useState, useEffect, useRef, memo } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Calendar, MoreVertical, User, Grid3x3, List, Clock, MapPin, Megaphone, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import apiService from '../../services/api';
import workstationSupportIcon from '../../assets/icon for dashboard/Admin.png';
import AgentHomePageSession4ChatPopup from './AgentHomePageSession4ChatPopup';

const AgentHomePageSession4 = () => {
  const { language } = useLanguage();

  const openSupportChat = () => {
    window.dispatchEvent(new CustomEvent('jobshare:toggle-layout-chatbot', { detail: { hide: true } }));
    window.dispatchEvent(new CustomEvent('jobshare:open-agent-home-chat'));
  };
  const t = translations[language] || translations.vi;
  const [activeTab, setActiveTab] = useState('interview');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [viewMode, setViewMode] = useState('line'); // 'line' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [interviews, setInterviews] = useState([]);
  const [naitei, setNaitei] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredViewModeButton, setHoveredViewModeButton] = useState(false);
  const [hoveredSeeAllButton, setHoveredSeeAllButton] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingUpcomingEvents, setLoadingUpcomingEvents] = useState(true);
  const [hoveredPrevMonthButton, setHoveredPrevMonthButton] = useState(false);
  const [hoveredNextMonthButton, setHoveredNextMonthButton] = useState(false);
  const [hoveredDatePickerPrevButton, setHoveredDatePickerPrevButton] = useState(false);
  const [hoveredDatePickerNextButton, setHoveredDatePickerNextButton] = useState(false);
  const [hoveredEventCardIndex, setHoveredEventCardIndex] = useState(null);
  const [hoveredMoreButtonIndex, setHoveredMoreButtonIndex] = useState(null);
  const [hoveredGoToMeetingButtonIndex, setHoveredGoToMeetingButtonIndex] = useState(null);
  const [hoveredCalendarDayIndex, setHoveredCalendarDayIndex] = useState(null);

  const pickByLanguage = (viText, enText, jpText) => {
    if (language === 'en') return enText || viText || jpText || '';
    if (language === 'ja') return jpText || enText || viText || '';
    return viText || enText || jpText || '';
  };

  const getLocalizedField = (item, field = 'name') => {
    const baseValue = item?.[field] || '';
    const languageKey = language === 'en' ? 'En' : language === 'ja' ? 'Jp' : '';
    if (!languageKey) return baseValue;
    return item?.[`${field}${languageKey}`] || baseValue;
  };

  const getLocalizedScheduleLabel = (item, field = 'role') => {
    const baseValue = item?.[field] || '';
    const languageKey = language === 'en' ? 'En' : language === 'ja' ? 'Jp' : '';
    if (!languageKey) return baseValue;
    return item?.[`${field}${languageKey}`] || baseValue;
  };

  const getInterviewTitle = () => {
    if (language === 'en') return 'Candidate interview';
    if (language === 'ja') return '候補者面接';
    return 'Phỏng vấn ứng viên';
  };

  const getInterviewDescription = (item) => {
    const applicationId = item?.job?.applicationId || item?.jobApplicationId || item?.applicationId || item?.job?.id;
    if (language === 'en') {
      return applicationId
        ? `Interview schedule for application #${applicationId}`
        : 'Interview schedule for the application';
    }
    if (language === 'ja') {
      return applicationId
        ? `応募 #${applicationId} の面接予定`
        : '応募の面接予定';
    }
    return applicationId
      ? `Lịch phỏng vấn cho đơn ứng tuyển #${applicationId}`
      : 'Lịch phỏng vấn cho đơn ứng tuyển';
  };

  const translateInterviewDisplayText = (text, item) => {
    const applicationId = item?.job?.applicationId || item?.jobApplicationId || item?.applicationId || item?.job?.id;
    const normalized = String(text || '').trim().toLowerCase();

    const viTitleMatches = ['phỏng vấn ứng viên', 'phỏng vấn'].includes(normalized);
    const viDescMatches = normalized.startsWith('lịch phỏng vấn cho đơn ứng tuyển');

    if (language === 'vi') {
      return text || '';
    }

    if (language === 'en') {
      if (viTitleMatches) return 'Candidate interview';
      if (viDescMatches) {
        return applicationId
          ? `Interview schedule for application #${applicationId}`
          : 'Interview schedule for the application';
      }
      return text || '';
    }

    if (language === 'ja') {
      if (viTitleMatches) return '候補者面接';
      if (viDescMatches) {
        return applicationId
          ? `応募 #${applicationId} の面接予定`
          : '応募の面接予定';
      }
      return text || '';
    }

    return text || '';
  };

  const scheduleLoadKeyRef = useRef('');
  const upcomingBootstrapRef = useRef(false);

  // Load schedule data
  useEffect(() => {
    const loadKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    if (scheduleLoadKeyRef.current === loadKey) return;
    scheduleLoadKeyRef.current = loadKey;
    loadSchedule();
  }, [currentMonth]);

  // Listen for calendar created events
  useEffect(() => {
    const handleCalendarCreated = () => {
      loadSchedule(); // Reload schedule when calendar is created
    };
    window.addEventListener('calendarCreated', handleCalendarCreated);
    return () => {
      window.removeEventListener('calendarCreated', handleCalendarCreated);
    };
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await apiService.getSchedule({ month, year });
      
      if (response.success && response.data) {
        // Process interviews
        const processedInterviews = (response.data.interviews || []).map(item => {
          const interviewDate = new Date(item.interviewDate);
          const dateKey = Number.isNaN(interviewDate.getTime())
            ? ''
            : `${interviewDate.getFullYear()}-${String(interviewDate.getMonth() + 1).padStart(2, '0')}-${String(interviewDate.getDate()).padStart(2, '0')}`;
          return {
            ...item,
            date: interviewDate.getDate(),
            dateKey,
            time: item.interviewTime || '00:00',
            name: getLocalizedField(item, 'name') || getInterviewTitle(),
            description: getInterviewDescription(item),
            role: getLocalizedScheduleLabel(item, 'role') || pickByLanguage(
              item.job?.titleVi || item.job?.title,
              item.job?.titleEn,
              item.job?.titleJp
            ),
            isActive: new Date(item.interviewDate) >= new Date()
          };
        });
        
        // Process naitei
        const processedNaitei = (response.data.naitei || []).map(item => {
          const naiteiDate = new Date(item.naiteiDate || item.interviewDate);
          const dateKey = Number.isNaN(naiteiDate.getTime())
            ? ''
            : `${naiteiDate.getFullYear()}-${String(naiteiDate.getMonth() + 1).padStart(2, '0')}-${String(naiteiDate.getDate()).padStart(2, '0')}`;
          return {
            ...item,
            date: naiteiDate.getDate(),
            dateKey,
            time: item.naiteiTime || item.interviewTime || '00:00',
            name: getLocalizedField(item, 'name') || pickByLanguage(
              item.job?.candidateName,
              item.job?.candidateNameEn,
              item.job?.candidateNameJp
            ),
            description: pickByLanguage(
              item.job?.company?.nameVi || item.job?.company?.name,
              item.job?.company?.nameEn,
              item.job?.company?.nameJp
            ) || getLocalizedScheduleLabel(item, 'description'),
            role: getLocalizedScheduleLabel(item, 'role') || pickByLanguage(
              item.job?.titleVi || item.job?.title,
              item.job?.titleEn,
              item.job?.titleJp
            ),
            isActive: naiteiDate >= new Date()
          };
        });
        
        setInterviews(processedInterviews);
        setNaitei(processedNaitei);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      setInterviews([]);
      setNaitei([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate dates for date picker (next 7 days) - dùng t.calendarDayNames theo ngôn ngữ
  const generateDates = () => {
    const dayNames = t.calendarDayNames || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: dayNames[date.getDay()],
        date: date.getDate()
      });
    }
    return dates;
  };

  const dates = generateDates();
  const monthNames = t.calendarMonthNames || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const allEvents = activeTab === 'interview' ? interviews : naitei;
  const events = allEvents.filter(event => event.dateKey === selectedDate);

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getDaysWithEvents = () => {
    const eventDates = new Set(allEvents.map(event => event.date));
    return eventDates;
  };

  const daysWithEvents = getDaysWithEvents();
  const calendarDays = getDaysInMonth(currentMonth);

  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    setCurrentMonth(newMonth);
  };

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      if (upcomingBootstrapRef.current) return;
      upcomingBootstrapRef.current = true;
      try {
        setLoadingUpcomingEvents(true);
        const upcomingRes = await apiService.getCTVEvents({ upcoming: 1, limit: 5, sortBy: 'start_at', sortOrder: 'ASC' });
        const upcoming = upcomingRes?.success ? (upcomingRes.data?.events || []) : [];
        if (upcoming.length > 0) {
          setUpcomingEvents(upcoming);
          return;
        }
        const allRes = await apiService.getCTVEvents({ upcoming: 0, limit: 5, sortBy: 'start_at', sortOrder: 'DESC' });
        setUpcomingEvents(allRes.success ? (allRes.data?.events || []) : []);
      } catch (error) {
        console.error('Error loading upcoming events:', error);
        setUpcomingEvents([]);
      } finally {
        setLoadingUpcomingEvents(false);
      }
    };
    loadUpcomingEvents();
  }, [language]);

  const pickEventTextByLanguage = (viText, enText, jpText) => {
    if (language === 'en') return enText || viText || jpText || '';
    if (language === 'ja') return jpText || enText || viText || '';
    return viText || enText || jpText || '';
  };

  const formatEventDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const selectedDateLabel = (() => {
    const parts = String(selectedDate || '').split('-');
    return parts.length === 3 ? parts.reverse().join('/') : String(selectedDate || '');
  })();

  const upcomingShort = upcomingEvents.slice(0, 3);
  return (
    <>
      <div className="flex h-auto min-h-[calc(100vh-140px)] max-w-full flex-col gap-2.5 overflow-y-auto pb-3 lg:min-h-[calc(100vh-120px)] xl:min-h-[calc(100vh-96px)] min-[1366px]:gap-3 min-[1600px]:gap-4 min-[1366px]:pb-4 min-[1600px]:pb-5">
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-2.5 min-[1366px]:p-3 min-[1600px]:p-4">
        <div className="mb-2 flex items-center justify-between gap-2 min-[1366px]:mb-2.5 min-[1600px]:mb-3">
          <div className="text-[10px] font-semibold text-slate-500 min-[1366px]:text-[11px] min-[1600px]:text-[12px]">{t.agentHomeUpcomingEvents || 'Sự kiện sắp tới'}</div>
          <button className="text-[10px] font-medium text-slate-500 hover:text-slate-700 min-[1366px]:text-[11px] min-[1600px]:text-[12px]">{t.agentHomeViewAll || 'Xem tất cả'}</button>
        </div>
        <div className="space-y-1.5 min-[1366px]:space-y-2 min-[1600px]:space-y-2.5">
          {loadingUpcomingEvents ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{t.agentHomeLoading || 'Đang tải...'}</div>
          ) : upcomingShort.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{t.agentHomeNoUpcomingEvents || 'Chưa có sự kiện sắp tới.'}</div>
          ) : upcomingShort.map((evt) => {
            const dt = new Date(evt.start_at);
            const day = Number.isNaN(dt.getTime()) ? '--' : String(dt.getDate()).padStart(2, '0');
            const mon = Number.isNaN(dt.getTime()) ? '---' : dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            return (
              <div key={evt.id} className="flex gap-1.5 rounded-lg border border-slate-100 bg-white px-1.5 py-1 shadow-sm">
                <div className="flex w-8 shrink-0 flex-col items-center justify-center rounded-md bg-red-50 text-red-600">
                  <span className="text-[11px] font-extrabold leading-none">{day}</span>
                  <span className="mt-0.5 text-[7px] font-bold">{mon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-1 text-[10px] font-bold leading-4 text-slate-900">
                    {pickEventTextByLanguage(evt.title, evt.titleEn || evt.title_en, evt.titleJp || evt.title_jp) || 'Sự kiện'}
                  </h4>
                  <div className="mt-0.5 flex items-center gap-1 text-[9px] leading-4 text-slate-500">
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{formatEventDate(evt.start_at)}{evt.end_at ? ` → ${formatEventDate(evt.end_at)}` : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-2.5 min-[1366px]:p-3 min-[1600px]:p-4">
        <div className="mb-2 flex items-center justify-between gap-2 min-[1366px]:mb-2.5 min-[1600px]:mb-3">
          <div className="text-[10px] font-semibold text-slate-500 min-[1366px]:text-[11px] min-[1600px]:text-[12px]">{t.agentHomeInterviewSchedule || 'Lịch phỏng vấn / Lịch vào công ty'}</div>
          <button className="text-[10px] font-medium text-slate-500 hover:text-slate-700 min-[1366px]:text-[11px] min-[1600px]:text-[12px]">{t.agentHomeViewAll || 'Xem tất cả'}</button>
        </div>

        <div className="mb-2 flex items-center justify-between gap-1 min-[1366px]:mb-2.5 min-[1600px]:mb-3">
          <button onClick={() => handleMonthChange(-1)} className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 min-[1366px]:p-1.5"><ChevronLeft className="h-3.5 w-3.5 min-[1366px]:h-4 min-[1366px]:w-4" /></button>
          <div className="text-[10px] font-semibold text-slate-800 min-[1366px]:text-[11px] min-[1600px]:text-[12px]">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
          <button onClick={() => handleMonthChange(1)} className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 min-[1366px]:p-1.5"><ChevronRight className="h-3.5 w-3.5 min-[1366px]:h-4 min-[1366px]:w-4" /></button>
        </div>

        <div className="mb-2 flex items-center justify-between gap-2 text-[9px] text-slate-500 min-[1366px]:mb-2.5 min-[1366px]:text-[10px] min-[1600px]:mb-3 min-[1600px]:text-[11px]">
          <span className="truncate">{t.agentHomeSelectedDate || 'Ngày đã chọn'}: {selectedDateLabel}</span>
          <button type="button" onClick={() => {
            const today = new Date();
            setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
          }} className="hidden rounded-full border border-slate-200 px-1.5 py-0.5 font-medium hover:bg-slate-50 sm:inline-flex">
            {t.agentHomeToday || 'Hôm nay'}
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-[8px] text-slate-500 sm:gap-1 sm:text-[9px] min-[1366px]:gap-1.5 min-[1600px]:gap-2 min-[1366px]:text-[10px] min-[1600px]:text-[11px]">
          {(t.calendarDayNames || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day) => <div key={day} className="py-0 text-center font-medium leading-4">{day.slice(0, 2)}</div>)}
          {calendarDays.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="flex h-[24px] w-[24px] items-center justify-center sm:h-[28px] sm:w-[28px] min-[1366px]:h-[32px] min-[1366px]:w-[32px] min-[1600px]:h-[36px] min-[1600px]:w-[36px]" />;
            const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateKey;
            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[8px] font-semibold sm:h-[28px] sm:w-[28px] sm:text-[9px] min-[1366px]:h-[32px] min-[1366px]:w-[32px] min-[1366px]:text-[10px] min-[1600px]:h-[36px] min-[1600px]:w-[36px] min-[1600px]:text-[11px] ${isSelected ? 'bg-red-600 text-white' : daysWithEvents.has(dateKey) ? 'bg-red-50 text-red-700' : 'bg-white text-slate-700'} border ${isSelected ? 'border-red-600' : 'border-slate-100'}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[8px] text-slate-500 min-[1366px]:mt-2.5 min-[1366px]:gap-2 min-[1366px]:text-[9px] min-[1600px]:mt-3 min-[1600px]:gap-2.5 min-[1600px]:text-[10px]">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-600" />{t.interview || 'Lịch phỏng vấn'} 1</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" />{t.naitei || 'Lịch vào công ty'} 0</span>
        </div>

        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 min-[1366px]:mt-2.5 min-[1366px]:p-2.5 min-[1600px]:mt-3 min-[1600px]:p-3">
          <div className="mb-1 text-[9px] font-semibold text-slate-700 min-[1366px]:mb-1.5 min-[1366px]:text-[10px] min-[1600px]:text-[11px]">
            {t.agentHomeSelectedSchedule || 'Lịch ngày'} {selectedDateLabel}
          </div>
          <div className="space-y-1.5 min-[1366px]:space-y-2 min-[1600px]:space-y-2.5">
            {events.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 bg-white px-2 py-1.5 text-[10px] leading-4 text-slate-500 min-[1366px]:px-2.5 min-[1366px]:py-2 min-[1600px]:px-3 min-[1600px]:py-2.5 min-[1600px]:text-[11px]">
                {t.agentHomeNoScheduleForDate || 'Không có lịch trong ngày này.'}
              </div>
            ) : (
              events.map((event, index) => {
                const eventTime = event.time || '00:00';
                const eventTitle = event.name || getInterviewTitle();
                const eventSubtitle = event.description || event.role || '-';
                const badge = activeTab === 'interview' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';
                return (
                  <div key={event.id || `${event.date}-${index}`} className="flex items-start gap-1.5 rounded-md bg-white px-2 py-1.5 shadow-sm min-[1366px]:gap-2 min-[1366px]:px-2.5 min-[1366px]:py-2 min-[1600px]:gap-2.5 min-[1600px]:px-3 min-[1600px]:py-2.5">
                    <div className="w-10 shrink-0 text-[9px] font-semibold leading-4 text-slate-500 min-[1366px]:w-12 min-[1366px]:text-[10px] min-[1600px]:w-14 min-[1600px]:text-[11px]">{eventTime}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-semibold leading-4 text-slate-900 min-[1366px]:text-[11px] min-[1600px]:text-[12px]">{eventTitle}</div>
                      <div className="truncate text-[9px] leading-4 text-slate-500 min-[1366px]:text-[10px] min-[1600px]:text-[11px]">{eventSubtitle}</div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium min-[1366px]:px-2 min-[1366px]:text-[9px] min-[1600px]:px-2.5 min-[1600px]:text-[10px] ${badge}`}>
                      {activeTab === 'interview' ? (t.interview || 'PV') : (t.naitei || 'NC')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm min-[1366px]:p-3 min-[1600px]:p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold text-slate-900 min-[1366px]:text-[11px] min-[1600px]:text-[12px]">{t.agentHomeSupportTitle || 'Cần hỗ trợ từ Workstation?'}</div>
        </div>
        <div className="mt-1 text-[10px] leading-4 text-slate-500 min-[1366px]:mt-1.5 min-[1366px]:text-[11px] min-[1600px]:mt-2 min-[1600px]:text-[12px]">{t.agentHomeSupportDesc || 'Bạn có thể chat trực tiếp với admin để hỏi về job, quy trình tiến cử, CV hoặc trạng thái đơn ứng tuyển.'}</div>
        <div className="mt-2 flex items-center gap-2 min-[1366px]:mt-2.5 min-[1600px]:mt-3">
          <button type="button" onClick={openSupportChat} className="flex-1 rounded-md bg-red-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-red-700 min-[1366px]:px-3 min-[1366px]:py-2 min-[1366px]:text-[11px] min-[1600px]:px-4 min-[1600px]:py-2.5 min-[1600px]:text-[12px]">{t.agentHomeChatWithAdmin || 'Chat với admin'}</button>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent min-[1366px]:h-14 min-[1366px]:w-14 min-[1600px]:h-16 min-[1600px]:w-16">
            <img src={workstationSupportIcon} alt="Support" className="h-full w-full object-contain p-0" />
          </div>
        </div>
      </div>
      <AgentHomePageSession4ChatPopup />
    </div>
    </>
  );
};

export default memo(AgentHomePageSession4);
