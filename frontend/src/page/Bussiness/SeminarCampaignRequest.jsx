import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
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

const ACCENT = '#7c3aed';
const ACCENT_BG = '#ede9fe';

const BENEFITS = [
  'Tiếp cận trực tiếp ứng viên chất lượng cao.',
  'Tăng độ nhận diện thương hiệu tuyển dụng của doanh nghiệp.',
  'Sự kiện được thiết kế chuyên nghiệp, phù hợp mục tiêu tuyển dụng.',
  'Hỗ trợ truyền thông đa kênh, thu hút ứng viên tham gia.',
  'Báo cáo chi tiết, đánh giá hiệu quả sau chương trình.',
  'Đội ngũ giàu kinh nghiệm, hỗ trợ toàn diện từ A–Z.',
];

const BROCHURE = {
  label: 'Download tài liệu',
  meta: 'PDF - 2.5 MB',
  href: '/docs/seminar-campaign-brochure.pdf',
};

const INTRO = [
  'Dịch vụ giúp doanh nghiệp kết nối trực tiếp với ứng viên tiềm năng thông qua các sự kiện, seminar và campaign tuyển dụng chuyên nghiệp.',
  'Workstation đồng hành từ khâu lên ý tưởng, lập kế hoạch, truyền thông, triển khai đến báo cáo kết quả sau chương trình.',
];

export default function SeminarCampaignRequest() {
  const service = getServiceByKey('seminar_campaign');
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
        note: 'Yêu cầu tư vấn & tổ chức Seminar, Campaign tuyển dụng',
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
        icon={CalendarDays}
        iconBg={ACCENT_BG}
        iconColor={ACCENT}
        title={service?.title || 'Yêu cầu tổ chức Seminar, Campaign tuyển dụng'}
        description={INTRO}
      />

      <ServiceRequestDetailBody>
        <ServiceRequestBenefitsBox
          accent={ACCENT}
          accentBg={ACCENT_BG}
          title="Lợi ích khi sử dụng dịch vụ tổ chức Seminar, Campaign tuyển dụng"
          items={BENEFITS}
        />
        <ServiceRequestDocBox
          brochure={BROCHURE}
          description="Tải brochure quy trình, gói dịch vụ, bảng giá tham khảo và case study trước khi gửi yêu cầu tổ chức sự kiện."
        />
      </ServiceRequestDetailBody>

      <ServiceRequestSubmitRow error={error} submitting={submitting} onSubmit={handleSubmit} />
    </ServiceRequestDetailLayout>
  );
}
