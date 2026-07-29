import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JobDetail from '../../page/Bussiness/JobDetail';

function EmbeddedJobDetailRoute() {
  return <JobDetail embedded />;
}

export default function BusinessJobDetailEmbed({ jobId }) {
  if (!jobId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 text-slate-400">
        <p className="text-sm font-medium text-slate-600">Chưa có JD được lưu</p>
        <p className="text-xs mt-2 max-w-sm leading-relaxed">
          Hoàn thiện nội dung qua chat, bấm <strong className="text-slate-700">Lưu job</strong> để xem chi tiết JD tại đây.
        </p>
      </div>
    );
  }

  return (
    <MemoryRouter initialEntries={[`/business/jobs/${jobId}`]}>
      <div className="h-full min-h-0 overflow-hidden">
        <Routes>
          <Route path="/business/jobs/:jobId" element={<EmbeddedJobDetailRoute />} />
        </Routes>
      </div>
    </MemoryRouter>
  );
}
