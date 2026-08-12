import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AdminAddJobPage } from '../Admin/AddJobPage';
import JobCreatedNextStepsModal, { navigateJobCreatedNextStep } from '../../component/Bussiness/JobCreatedNextStepsModal';
import { ensureJobBuilderThreadForJob } from '../../utils/jobBuilderThreadStorage';
import {
  consumeScoutPerformanceHearingPending,
  peekScoutPerformanceHearingPending,
} from '../../utils/scoutPerformanceHearingPending';
import apiService from '../../services/api';

/** Wrapper — chiều cao full để 2 cột scroll độc lập */
const BusinessAddJobPage = () => {
  const navigate = useNavigate();
  const hearingPending = useMemo(() => peekScoutPerformanceHearingPending(), []);
  const [nextStepsModal, setNextStepsModal] = useState({ open: false, jobId: null });
  const [hearingSubmitting, setHearingSubmitting] = useState(false);

  const submitPendingHearing = useCallback(async (jobId, pending) => {
    let jobTitle = '';
    try {
      const res = await apiService.getBusinessJobById(jobId);
      const job = res?.data?.job || res?.data;
      jobTitle = job?.title || job?.titleEn || job?.titleJp || '';
    } catch {
      /* giữ title mặc định */
    }

    const hearingRes = await apiService.createBusinessScoutPerformanceRequest(pending.cvId, {
      jobId,
      jobTitle: jobTitle || undefined,
      wantsSimilarCandidates: !!pending.wantsSimilarCandidates,
      message: pending.message,
    });

    const returnPath = pending.returnPath
      || `/business/scout/candidates/${encodeURIComponent(String(pending.cvId))}`;

    if (hearingRes?.success) {
      const req = hearingRes.data?.request;
      navigate(returnPath, {
        replace: true,
        state: {
          performanceSuccess: {
            requestCode: req?.requestCode,
            sessionId: req?.sessionId,
            requestId: req?.id,
            wantsSimilarCandidates: !!req?.wantsSimilarCandidates,
            candidate: req?.candidate,
          },
        },
      });
      return;
    }

    navigate(returnPath, {
      replace: true,
      state: {
        performanceError: hearingRes?.message || 'Không thể gửi yêu cầu Scout Ủy Thác.',
      },
    });
  }, [navigate]);

  const onBusinessJobCreated = useCallback(async (jobId) => {
    const pending = consumeScoutPerformanceHearingPending();
    if (pending?.cvId) {
      setHearingSubmitting(true);
      try {
        await submitPendingHearing(jobId, pending);
      } catch (e) {
        console.error(e);
        const returnPath = pending.returnPath
          || `/business/scout/candidates/${encodeURIComponent(String(pending.cvId))}`;
        navigate(returnPath, {
          replace: true,
          state: {
            performanceError: 'Không thể gửi yêu cầu Scout Ủy Thác. Vui lòng thử lại.',
          },
        });
      } finally {
        setHearingSubmitting(false);
      }
      return;
    }

    let title = '';
    try {
      const res = await apiService.getBusinessJobById(jobId);
      const job = res?.data?.job || res?.data;
      title = job?.title || job?.titleEn || job?.titleJp || '';
    } catch {
      /* giữ title mặc định */
    }
    await ensureJobBuilderThreadForJob(jobId, { title: title || undefined });
    setNextStepsModal({ open: true, jobId });
  }, [navigate, submitPendingHearing]);

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 flex flex-col overflow-hidden px-1 sm:px-2">
      {hearingPending?.cvId ? (
        <div className="mb-2 shrink-0 rounded-xl border border-[#0077B6]/20 bg-[#e8f4fa] px-4 py-2.5 text-sm text-[#006399]">
          Bạn đang tạo JD cho <strong>Scout Ủy Thác</strong>. Sau khi lưu, hệ thống sẽ tự gửi yêu cầu hearing với JD này.
        </div>
      ) : null}

      {hearingSubmitting ? (
        <div className="absolute inset-0 z-[10060] flex items-center justify-center bg-white/75">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" aria-hidden />
            Đang gửi yêu cầu Scout Ủy Thác...
          </div>
        </div>
      ) : null}

      <JobCreatedNextStepsModal
        open={nextStepsModal.open}
        jobId={nextStepsModal.jobId}
        onClose={() => {
          const id = nextStepsModal.jobId;
          setNextStepsModal({ open: false, jobId: null });
          navigate(id ? `/business/jobs/${encodeURIComponent(String(id))}/edit` : '/business/jobs');
        }}
        onSelect={(stepNum, jobId) => {
          setNextStepsModal({ open: false, jobId: null });
          navigateJobCreatedNextStep(navigate, stepNum, jobId);
        }}
      />
      <AdminAddJobPage portal="business" onBusinessJobCreated={onBusinessJobCreated} />
    </div>
  );
};

export default BusinessAddJobPage;
