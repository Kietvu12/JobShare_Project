import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Calendar, User, Grid3x3, List, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';
import apiService from '../../services/api';

const AgentHomePageSession4Floating = () => {
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('interview');
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [viewMode, setViewMode] = useState('line');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [interviews, setInterviews] = useState([]);
  const [naitei, setNaitei] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Button dragging state (for floating button)
  const getDefaultButtonPosition = () => ({
    x: typeof window === 'undefined' ? 16 : Math.max(16, window.innerWidth - 88),
    y: typeof window === 'undefined' ? 120 : Math.max(96, window.innerHeight - 104),
  });
  const [buttonPosition, setButtonPosition] = useState(getDefaultButtonPosition);
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [buttonDragStart, setButtonDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);
  const modalRef = useRef(null);
  const [hoveredFloatingButton, setHoveredFloatingButton] = useState(false);
  const [hoveredCloseButton, setHoveredCloseButton] = useState(false);
  const [hoveredPrevMonthButton, setHoveredPrevMonthButton] = useState(false);
  const [hoveredNextMonthButton, setHoveredNextMonthButton] = useState(false);
  const [hoveredEventCardIndex, setHoveredEventCardIndex] = useState(null);

  // Update button position on window resize
  useEffect(() => {
    const handleResize = () => {
      setButtonPosition(prev => {
        const buttonSize = 64;
        const maxX = window.innerWidth - buttonSize - 16;
        const maxY = window.innerHeight - buttonSize - 16;
        return {
          x: Math.max(16, Math.min(prev.x, maxX)),
          y: Math.max(80, Math.min(prev.y, maxY))
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load schedule data
  useEffect(() => {
    if (isOpen) {
      loadSchedule();
    }
  }, [currentMonth, isOpen]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await apiService.getSchedule({ month, year });
      
      if (response.success && response.data) {
        const processedInterviews = (response.data.interviews || []).map(item => {
          const interviewDate = new Date(item.interviewDate);
          return {
            ...item,
            date: interviewDate.getDate(),
            time: item.interviewTime || '00:00',
            description: item.job?.company?.name || item.description || '',
            role: item.job?.title || item.role || '',
            isActive: new Date(item.interviewDate) >= new Date()
          };
        });
        
        const processedNaitei = (response.data.naitei || []).map(item => {
          const naiteiDate = new Date(item.naiteiDate || item.interviewDate);
          return {
            ...item,
            date: naiteiDate.getDate(),
            time: item.naiteiTime || item.interviewTime || '00:00',
            description: item.job?.company?.name || item.description || '',
            role: item.job?.title || item.role || '',
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

  // Handle button drag start
  const handleButtonDragStart = (e) => {
    setIsDraggingButton(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setButtonDragStart({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle button drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingButton) return;
      
      const newX = e.clientX - buttonDragStart.x;
      const newY = e.clientY - buttonDragStart.y;
      
      // Constrain to viewport
      const buttonSize = 64;
      const maxX = window.innerWidth - buttonSize - 16;
      const maxY = window.innerHeight - buttonSize - 16;
      
      setButtonPosition({
        x: Math.max(16, Math.min(newX, maxX)),
        y: Math.max(80, Math.min(newY, maxY))
      });
      e.preventDefault();
    };

    const handleTouchMove = (e) => {
      if (!isDraggingButton) return;
      const touch = e.touches[0];
      const newX = touch.clientX - buttonDragStart.x;
      const newY = touch.clientY - buttonDragStart.y;
      
      const buttonSize = 64;
      const maxX = window.innerWidth - buttonSize - 16;
      const maxY = window.innerHeight - buttonSize - 16;
      
      setButtonPosition({
        x: Math.max(16, Math.min(newX, maxX)),
        y: Math.max(80, Math.min(newY, maxY))
      });
      e.preventDefault();
    };

    const handleMouseUp = () => {
      setIsDraggingButton(false);
    };

    const handleTouchEnd = () => {
      setIsDraggingButton(false);
    };

    if (isDraggingButton) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingButton, buttonDragStart]);

  // Generate dates for date picker (next 7 days)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
const dayNames = t.calendarDayNames || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dates.push({
        day: dayNames[date.getDay()],
        date: date.getDate()
      });
    }
    return dates;
  };

  const dates = generateDates();
  const allEvents = activeTab === 'interview' ? interviews : naitei;
  const events = viewMode === 'calendar' 
    ? allEvents.filter(event => event.date === selectedDate)
    : allEvents;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
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

  const monthNames = t.calendarMonthNames || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate total events count
  const totalEvents = interviews.length + naitei.length;

  return (
    <>
      {/* Floating Button - replaces docked schedule until 2xl desktop */}
      <div 
        className="lg:hidden fixed z-40"
        style={{
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          cursor: isDraggingButton ? 'grabbing' : 'grab'
        }}
      >
        <button
          ref={buttonRef}
          onMouseDown={handleButtonDragStart}
          onTouchStart={handleButtonDragStart}
          onClick={(e) => {
            // Only open/close if not dragging
            if (!isDraggingButton) {
              setIsOpen(!isOpen);
            }
          }}
          onMouseEnter={() => setHoveredFloatingButton(true)}
          onMouseLeave={() => setHoveredFloatingButton(false)}
          className="h-16 w-16 rounded-full shadow-2xl transition-all flex items-center justify-center relative group select-none touch-none ring-4 ring-white/90"
          style={{
            cursor: isDraggingButton ? 'grabbing' : 'grab',
            backgroundColor: hoveredFloatingButton ? '#b91c1c' : '#dc2626',
            color: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Calendar className="w-7 h-7 pointer-events-none" />
          {totalEvents > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center pointer-events-none" style={{ backgroundColor: '#facc15', color: '#dc2626' }}>
              {totalEvents > 9 ? '9+' : totalEvents}
            </span>
          )}
        </button>
      </div>

      {/* Slide-in Schedule Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition-opacity 2xl:hidden"
            onClick={() => setIsOpen(false)}
          />

          <aside
            ref={modalRef}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] translate-x-0 flex-col overflow-hidden rounded-l-3xl border-l border-red-100 bg-white shadow-[-18px_0_45px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out 2xl:hidden sm:max-w-[460px]"
          >
            <div className="border-b border-red-100 bg-gradient-to-r from-red-50 via-white to-rose-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-700">
                    {language === 'vi' ? 'Lịch sự kiện' : language === 'en' ? 'Event schedule' : 'イベント予定'}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">{t.schedule}</h3>
                  <p className="text-xs text-gray-600">{t.interview} / {t.naitei}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'line' ? 'calendar' : 'line')}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-700 shadow-sm transition-all hover:bg-red-50 hover:border-red-300"
                    title={viewMode === 'line' ? t.agentHomeSwitchToCalendar : t.agentHomeSwitchToList}
                  >
                    {viewMode === 'line' ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setHoveredCloseButton(true)}
                    onMouseLeave={() => setHoveredCloseButton(false)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors ${hoveredCloseButton ? 'bg-slate-100' : 'bg-white/80'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-2 py-1 ring-1 ring-red-100">
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  onMouseEnter={() => setHoveredPrevMonthButton(true)}
                  onMouseLeave={() => setHoveredPrevMonthButton(false)}
                  className={`rounded-full p-1.5 text-slate-500 transition-colors ${hoveredPrevMonthButton ? 'bg-slate-100' : ''}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-slate-800">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  onMouseEnter={() => setHoveredNextMonthButton(true)}
                  onMouseLeave={() => setHoveredNextMonthButton(false)}
                  className={`rounded-full p-1.5 text-slate-500 transition-colors ${hoveredNextMonthButton ? 'bg-slate-100' : ''}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {viewMode === 'line' && (
                <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 hide-scrollbar">
                  {dates.map((item, index) => {
                    const isSelected = selectedDate === item.date;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedDate(item.date)}
                        className={`flex min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-2 transition-colors ${
                          isSelected ? 'bg-red-600 text-white shadow-sm shadow-red-600/25' : 'bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[10px] font-medium leading-none">{item.day}</span>
                        <span className="mt-1 text-sm font-bold leading-none">{item.date}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center gap-1 border-b border-red-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('interview')}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                    activeTab === 'interview' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t.interview} {interviews.length}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('naitei')}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                    activeTab === 'naitei' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {t.naitei} {naitei.length}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/40 p-3">
              {viewMode === 'calendar' && (
                <div className="mb-3 rounded-2xl border border-red-100 bg-white p-3 shadow-sm">
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
                    {(t.calendarDayNames || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;
                      const hasEvent = daysWithEvents.has(day);
                      const isSelected = selectedDate === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDate(day)}
                          className={`relative aspect-square rounded-xl border text-xs font-bold transition-colors ${
                            isSelected ? 'border-red-600 bg-red-600 text-white' : hasEvent ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-100 bg-white text-slate-700 hover:border-red-200'
                          }`}
                        >
                          {day}
                          {hasEvent && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-red-200 bg-white p-6 text-center text-xs text-gray-500">
                    {t.loading || 'Loading...'}
                  </div>
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-red-100 hover:shadow-md"
                      onMouseEnter={() => setHoveredEventCardIndex(event.id)}
                      onMouseLeave={() => setHoveredEventCardIndex(null)}
                    >
                      <div className="min-w-[42px] pt-1 text-xs font-semibold text-slate-500">{event.time}</div>
                      <div className="flex min-h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-xs font-bold text-slate-900">{event.name || event.role || event.description}</h4>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{event.role}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{event.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-red-200 bg-white p-6 text-center text-xs text-gray-500">
                    {viewMode === 'calendar' ? t.noEventsForDate : (t.noEvents || 'No events')}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default AgentHomePageSession4Floating;

