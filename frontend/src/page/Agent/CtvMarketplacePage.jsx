import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Heart, Briefcase, Users, ChevronRight } from 'lucide-react';
import apiService from '../../services/api';

function CtvMarketplacePage() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interestId, setInterestId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes] = await Promise.all([
        apiService.getCtvCandidateSharingStats(),
        apiService.getCtvCandidateSharingJobs({ page: 1, limit: 30 }),
      ]);
      if (statsRes?.success) setStats(statsRes.data);
      if (jobsRes?.success) setJobs(jobsRes.data?.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInterest = async (listingId) => {
    setInterestId(listingId);
    try {
      const res = await apiService.expressCtvCandidateSharingInterest(listingId);
      if (res?.success) {
        setJobs((prev) => prev.map((j) => (j.id === listingId ? { ...j, isInterested: true, interestCount: (j.interestCount || 0) + 1 } : j)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInterestId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Đang tải sàn CTV...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Sàn CTV — Job từ doanh nghiệp</h1>
      <p className="text-sm text-slate-500 mb-4">Job doanh nghiệp đăng qua WS. Tiến cử ứng viên qua luồng Nomination.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Job trên sàn</div>
          <div className="text-2xl font-bold text-slate-800">{stats?.publishedJobs ?? 0}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Đang quan tâm</div>
          <div className="text-2xl font-bold text-slate-800">{stats?.interestedJobs ?? 0}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Đơn tiến cử của tôi</div>
          <div className="text-2xl font-bold text-slate-800">{stats?.myNominations ?? 0}</div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Chưa có job trên sàn</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800">{job.job?.title}</div>
                  <div className="text-xs text-slate-400">{job.business?.companyName} · {job.job?.jobCode}</div>
                  <div className="text-xs text-slate-600 mt-2 whitespace-pre-line">{job.feeLabel}</div>
                  <div className="flex gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.interestCount} quan tâm</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.nominationsCount} tiến cử</span>
                    <span>Hạn: {job.recruitmentDeadline || job.job?.deadline || '—'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={job.isInterested || interestId === job.id}
                    onClick={() => handleInterest(job.id)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border ${job.isInterested ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-600'}`}
                  >
                    <Heart className="w-3.5 h-3.5" /> {job.isInterested ? 'Đã quan tâm' : 'Quan tâm'}
                  </button>
                  <Link
                    to={`/agent/nominations/select?jobId=${job.jobId}`}
                    className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white"
                  >
                    Tiến cử ứng viên <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CtvMarketplacePage;
