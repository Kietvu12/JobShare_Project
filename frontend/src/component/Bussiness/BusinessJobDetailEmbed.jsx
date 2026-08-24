import React from 'react';
import JobDetail from '../../page/Bussiness/JobDetail';

export default function BusinessJobDetailEmbed({ jobId }) {
  if (!jobId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 text-slate-400">
        <p className="biz-ui-body font-medium text-slate-600">Chưa có JD được lưu</p>
        <p className="biz-ui-caption mt-2 max-w-sm leading-relaxed">
          Hoàn thiện nội dung qua chat, bấm <strong className="text-slate-700">Lưu job</strong> để xem chi tiết JD tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <JobDetail embedded jobId={jobId} />
    </div>
  );
}
