import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAddJobPage } from '../Admin/AddJobPage';
import JobCreatedNextStepsModal, { navigateJobCreatedNextStep } from '../../component/Bussiness/JobCreatedNextStepsModal';
import { ensureJobBuilderThreadForJob } from '../../utils/jobBuilderThreadStorage';
import apiService from '../../services/api';

/** Wrapper — chiều cao full để 2 cột scroll độc lập */
const BusinessAddJobPage = () => {
  const navigate = useNavigate();
  const [nextStepsModal, setNextStepsModal] = useState({ open: false, jobId: null });

  const onBusinessJobCreated = useCallback(async (jobId) => {
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
  }, []);

  return (
    <div className="h-full min-h-0 w-full min-w-0 flex flex-col overflow-hidden px-1 sm:px-2">
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
