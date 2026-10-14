import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import JobDetails from '../../shared/Jobs/JobDetails';
import JobList from '../../shared/Jobs/JobList';
import { buildCollaboratorNavLinks } from '../lib/collaboratorNav';

export default function CollaboratorJobsPage() {
  const { pathname } = useLocation();
  const { jobs: jobsBasePath } = buildCollaboratorNavLinks(pathname);

  return (
    <Routes>
      <Route index element={<JobList jobsBasePath={jobsBasePath} />} />
      <Route path=":jobId" element={<JobDetails jobsBasePath={jobsBasePath} />} />
    </Routes>
  );
}
