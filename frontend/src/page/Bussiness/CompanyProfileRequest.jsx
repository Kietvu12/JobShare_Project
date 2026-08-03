import React, { useCallback, useEffect, useState } from 'react';
import { FilePenLine, Loader2 } from 'lucide-react';
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

const ACCENT = '#ca8a04';
const ACCENT_BG = '#fef9c3';

const BENEFITS = [
  'Profile chuyên nghiệp, thống nhất visual theo brand công ty.',
  'Tăng ấn tượng và niềm tin với ứng viên tiềm năng.',
  'Trình bày rõ văn hóa, phúc lợi và giá trị cốt lõi doanh nghiệp.',
  'Dùng đồng bộ trên Saiyo Branding, Scout và các kênh tuyển dụng.',
  'WS biên tập nội dung và thiết kế deck/PDF/web snippet.',
];

const BROCHURE = {
  label: 'Download tài liệu',
  meta: 'PDF - 2.1 MB',
  href: '/docs/company-profile-brochure.pdf',
};

const INTRO = [
  'Profile công ty chuyên nghiệp giúp doanh nghiệp tạo ấn tượng mạnh mẽ với ứng viên tiềm năng, thể hiện rõ văn hóa, phúc lợi và giá trị cốt lõi.',
  'Workstation biên tập nội dung và thiết kế profile (deck, PDF hoặc web snippet) thống nhất visual — dùng đồng bộ trên Saiyo Branding, Scout và các kênh tuyển dụng.',
];

export default function CompanyProfileRequest() {
  const service = getServiceByKey('company_profile');
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
        note: 'Yêu cầu tư vấn & thiết kế profile company',
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
        icon={FilePenLine}
        iconBg={ACCENT_BG}
        iconColor={ACCENT}
        title={service?.title || 'Yêu cầu thiết kế profile company'}
        description={INTRO}
      />

      <ServiceRequestDetailBody>
        <ServiceRequestBenefitsBox
          accent={ACCENT}
          accentBg={ACCENT_BG}
          title="Lợi ích khi sử dụng dịch vụ thiết kế profile company"
          items={BENEFITS}
        />
        <ServiceRequestDocBox
          brochure={BROCHURE}
          description="Tải brochure quy trình, mẫu profile và bảng giá tham khảo trước khi gửi yêu cầu thiết kế profile company."
        />
      </ServiceRequestDetailBody>

      <ServiceRequestSubmitRow error={error} submitting={submitting} onSubmit={handleSubmit} />
    </ServiceRequestDetailLayout>
  );
}
