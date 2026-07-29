import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import JobAiBuilderPanel from '../../component/Bussiness/JobAiBuilderPanel';

const JdBuilderChatPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => navigate('/business/jobs')}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500">Quay lại danh sách JD</span>
      </div>
      <div className="flex-1 min-h-0">
        <JobAiBuilderPanel />
      </div>
    </div>
  );
};

export default JdBuilderChatPage;
