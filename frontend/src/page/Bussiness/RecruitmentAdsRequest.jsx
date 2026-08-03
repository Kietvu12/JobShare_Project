import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Megaphone } from 'lucide-react';
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

const ACCENT = '#16a34a';
const ACCENT_BG = '#dcfce7';

const BENEFITS = [
  'Tiếp cận đúng tệp ứng viên theo khu vực, ngành nghề và địa bàn.',
  'Tăng số lượng ứng viên chất lượng phù hợp JD.',
  'Tối ưu chi phí quảng cáo theo mục tiêu chiến dịch.',
  'Báo cáo hiệu quả chi tiết, minh bạch theo từng kênh.',
  'Đội ngũ Workstation hỗ trợ triển khai từ A–Z.',
];

const BROCHURE = {
  label: 'Download tài liệu',
  meta: 'PDF - 2.6 MB',
  href: '/docs/recruitment-ads-brochure.pdf',
};

const INTRO = [
  'Dịch vụ giúp doanh nghiệp tiếp cận ứng viên tiềm năng trên Facebook, Instagram, Google, LinkedIn và các nền tảng phù hợp với ngành nghề, khu vực tuyển dụng.',
  'Đội ngũ marketing Workstation tư vấn chiến lược, setup và vận hành chiến dịch quảng cáo tuyển dụng — từ brief mục tiêu, ngân sách đến báo cáo hiệu quả định kỳ.',
];

export default function RecruitmentAdsRequest() {
  const service = getServiceByKey('recruitment_ads');
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
        note: 'Yêu cầu tư vấn & triển khai quảng cáo tuyển dụng đa kênh',
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
        icon={Megaphone}
        iconBg={ACCENT_BG}
        iconColor={ACCENT}
        title={service?.title || 'Yêu cầu chạy quảng cáo tuyển dụng'}
        description={INTRO}
      />

      <ServiceRequestDetailBody>
        <ServiceRequestBenefitsBox
          accent={ACCENT}
          accentBg={ACCENT_BG}
          title="Lợi ích khi sử dụng dịch vụ chạy quảng cáo tuyển dụng"
          items={BENEFITS}
        />
        <ServiceRequestDocBox
          brochure={BROCHURE}
          description="Tải brochure quy trình, phạm vi dịch vụ, bảng giá tham khảo và case study trước khi gửi yêu cầu tư vấn chiến dịch."
        />
      </ServiceRequestDetailBody>

      <ServiceRequestSubmitRow error={error} submitting={submitting} onSubmit={handleSubmit} />
    </ServiceRequestDetailLayout>
  );
}
