import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PaymentListContent from '../../component/Shared/PaymentListContent';
import AdminBusinessPaymentListContent from '../../component/Admin/AdminBusinessPaymentListContent';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';

const PaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;

  const initialTab = searchParams.get('tab') === 'business' ? 'business' : 'collaborator';
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const next = searchParams.get('tab') === 'business' ? 'business' : 'collaborator';
    setTab(next);
  }, [searchParams]);

  const tabs = useMemo(() => ([
    { id: 'collaborator', label: t.adminPaymentTabCollaborator || 'Cộng tác viên' },
    { id: 'business', label: t.adminPaymentTabBusiness || 'Doanh nghiệp' },
  ]), [t]);

  const switchTab = (id) => {
    setTab(id);
    const next = new URLSearchParams(searchParams);
    if (id === 'business') next.set('tab', 'business');
    else next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 flex flex-shrink-0 gap-1 rounded-lg border bg-white p-1" style={{ borderColor: '#e5e7eb' }}>
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
              className="flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors sm:text-sm"
              style={{
                backgroundColor: active ? '#2563eb' : 'transparent',
                color: active ? '#fff' : '#475569',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'business' ? (
          <AdminBusinessPaymentListContent />
        ) : (
          <PaymentListContent variant="admin" />
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
