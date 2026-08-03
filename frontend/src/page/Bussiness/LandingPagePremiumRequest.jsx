import React, { useCallback, useEffect, useState } from 'react';
import { LayoutTemplate, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import ServiceRequestDetailLayout, {
  ServiceRequestBenefitsBox,
  ServiceRequestDetailBody,
  ServiceRequestDetailHeader,
  ServiceRequestDocBox,
  ServiceRequestSubmitRow,
  SR_PAGE_FONT,
} from '../../component/Bussiness/ServiceRequestDetailLayout';
import { getServiceByKey } from '../../utils/businessServiceRequestCatalog';

const ACCENT = '#db2777';
const ACCENT_BG = '#fce7f3';

const BENEFITS = [
  'Giao diện chuyên nghiệp, thiết kế theo branding công ty.',
  'Nội dung tập trung giá trị cốt lõi, tầm nhìn và văn hóa DN.',
  'Tối ưu trải nghiệm ứng viên, tăng tỷ lệ ứng tuyển.',
  'Tích hợp form ứng tuyển, kết nối trực tiếp JobShare.',
];

const BROCHURE = {
  label: 'Download tài liệu',
  meta: 'PDF - 2.4 MB',
  href: '/docs/landing-page-premium-brochure.pdf',
};

const INTRO = [
  'Doanh nghiệp có thể sử dụng landing page miễn phí trên JobShare, hoặc yêu cầu thiết kế landing page premium theo nhu cầu riêng — phù hợp chiến dịch employer branding và tuyển dụng hàng loạt.',
  'Đội ngũ marketing Workstation có kinh nghiệm thiết kế landing page tuyển dụng chuyên nghiệp, nhấn mạnh tầm nhìn thương hiệu và thu hút ứng viên chất lượng.',
];

export default function LandingPagePremiumRequest() {
  const service = getServiceByKey('landing_page_premium');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getBusinessBillingDashboard();
      if (res?.success) setDashboard(res.data);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSubmit = async () => {
    if (!service) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.createBusinessServiceRequest({
        serviceKey: service.key,
        serviceTitle: service.title,
        note: 'Yêu cầu tư vấn & triển khai Landing Page premium',
      });
      if (res?.success) {
        setSuccessMsg('Đã gửi yêu cầu. WS sẽ liên hệ tư vấn chi tiết trong thời gian sớm nhất.');
        await loadDashboard();
      } else {
        setError(res?.message || 'Không thể gửi yêu cầu dịch vụ');
      }
    } catch (err) {
      setError(err?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div
        className="flex h-full min-h-0 items-center justify-center bg-[#f4f6f8] text-sm text-slate-500"
        style={{ fontFamily: SR_PAGE_FONT }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
        Đang tải...
      </div>
    );
  }

  return (
    <ServiceRequestDetailLayout
      dashboard={dashboard}
      successMsg={successMsg}
      onDismissSuccess={() => setSuccessMsg('')}
    >
      <ServiceRequestDetailHeader
        icon={LayoutTemplate}
        iconBg={ACCENT_BG}
        iconColor={ACCENT}
        title={service?.title || 'Yêu cầu Landing Page premium'}
        description={INTRO}
      />

      <ServiceRequestDetailBody>
        <ServiceRequestBenefitsBox
          accent={ACCENT}
          accentBg={ACCENT_BG}
          title="Lợi ích khi thiết kế Landing Page premium"
          items={BENEFITS}
        />
        <ServiceRequestDocBox
          brochure={BROCHURE}
          description="Tải brochure quy trình, giao diện mẫu và bảng giá tham khảo trước khi gửi yêu cầu thiết kế landing page premium."
        />
      </ServiceRequestDetailBody>

      <ServiceRequestSubmitRow error={error} submitting={submitting} onSubmit={handleSubmit} />
    </ServiceRequestDetailLayout>
  );
}
