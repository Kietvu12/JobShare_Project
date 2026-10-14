import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import NominationConfirmPage from '../../../page/Shared/NominationConfirmPage';
import NominationSelectPage from '../../../page/Shared/NominationSelectPage';
import JobDetails from '../../shared/Jobs/JobDetails';
import JobList from '../../shared/Jobs/JobList';
import { buildCandidateNavLinks } from '../lib/candidateNav';

export default function CandidateJobsPage() {
  const { pathname } = useLocation();
  const links = buildCandidateNavLinks(pathname);

  return (
    <Routes>
      <Route index element={<JobList jobsBasePath={links.jobs} />} />
      <Route path=":jobId/nominate" element={<NominationSelectPage variant="applicant" />} />
      <Route path=":jobId/confirm" element={<NominationConfirmPage variant="applicant" />} />
      <Route
        path=":jobId"
        element={
          <JobDetails
            jobsBasePath={links.jobs}
            loginPath={links.login}
            persona="candidate"
          />
        }
      />
    </Routes>
  );
}
