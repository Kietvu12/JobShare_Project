import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Coins, Loader2, Save, Trash2 } from 'lucide-react';
import apiService from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../translations/translations';

const CREDIT_TYPE_LABELS = {
  admin_grant: 'Admin cấp',
  admin_deduct: 'Admin khấu trừ',
  usage: 'Sử dụng',
  adjustment: 'Điều chỉnh',
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return String(value);
  }
}

export default function AdminBusinessDetailPage() {
  const { businessId } = useParams();
  const isCreate = businessId === 'create';
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.vi;

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState(null);
  const [histories, setHistories] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ totalPages: 0 });

  const [form, setForm] = useState({
    companyName: '',
    taxCode: '',
    email: '',
    password: '',
    contactName: '',
    contactTitle: 'Admin',
    contactEmail: '',
    contactPhone: '',
    address: '',
    status: '1',
    credit: '0',
  });

  const [creditForm, setCreditForm] = useState({
    amount: '',
    action: 'grant',
    note: '',
  });
  const [creditLoading, setCreditLoading] = useState(false);

  const loadBusiness = useCallback(async () => {
    if (isCreate) return;
    try {
      setLoading(true);
      const res = await apiService.getAdminBusinessById(businessId);
      if (res?.success && res.data?.business) {
        const b = res.data.business;
        setBusiness(b);
        setForm({
          companyName: b.companyName || '',
          taxCode: b.taxCode || '',
          email: b.email || '',
          password: '',
          contactName: b.contactName || '',
          contactTitle: b.contactTitle || '',
          contactEmail: b.contactEmail || '',
          contactPhone: b.contactPhone || '',
          address: b.address || '',
          status: String(b.status ?? 1),
          credit: String(b.credit ?? 0),
        });
        setHistories(b.creditHistories || []);
      }
    } catch (e) {
      alert(e.message || 'Không tải được thông tin');
      navigate('/admin/business-accounts');
    } finally {
      setLoading(false);
    }
  }, [businessId, isCreate, navigate]);

  const loadHistory = useCallback(async (page = 1) => {
    if (isCreate) return;
    try {
      const res = await apiService.getAdminBusinessCreditHistory(businessId, { page, limit: 15 });
      if (res?.success) {
        setHistories(res.data?.histories || []);
        setHistoryPagination(res.data?.pagination || { totalPages: 0 });
        if (res.data?.currentCredit != null && business) {
          setBusiness((prev) => (prev ? { ...prev, credit: res.data.currentCredit } : prev));
          setForm((prev) => ({ ...prev, credit: String(res.data.currentCredit) }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [businessId, isCreate, business]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  useEffect(() => {
    if (!isCreate) loadHistory(historyPage);
  }, [historyPage, isCreate, loadHistory]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreate) {
        const payload = {
          companyName: form.companyName,
          taxCode: form.taxCode,
          email: form.email,
          password: form.password,
          contactName: form.contactName,
          contactTitle: form.contactTitle,
          contactEmail: form.contactEmail || form.email,
          contactPhone: form.contactPhone,
          address: form.address,
          credit: parseInt(form.credit, 10) || 0,
        };
        const res = await apiService.createAdminBusiness(payload);
        if (res?.success) {
          alert(t.adminBusinessCreateSuccess || 'Tạo thành công');
          navigate(`/admin/business-accounts/${res.data.business.id}`);
        } else alert(res?.message || 'Tạo thất bại');
      } else {
        const res = await apiService.updateAdminBusiness(businessId, {
          companyName: form.companyName,
          taxCode: form.taxCode,
          contactName: form.contactName,
          contactTitle: form.contactTitle,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          address: form.address,
          status: parseInt(form.status, 10),
        });
        if (res?.success) {
          alert(t.saved || 'Đã lưu');
          loadBusiness();
        } else alert(res?.message || 'Lưu thất bại');
      }
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustCredit = async (e) => {
    e.preventDefault();
    const amount = parseInt(creditForm.amount, 10);
    if (!amount || amount <= 0) {
      alert('Nhập số credit hợp lệ');
      return;
    }
    setCreditLoading(true);
    try {
      const res = await apiService.adjustAdminBusinessCredit(businessId, {
        amount,
        action: creditForm.action,
        note: creditForm.note,
      });
      if (res?.success) {
        setCreditForm({ amount: '', action: 'grant', note: '' });
        setForm((prev) => ({ ...prev, credit: String(res.data?.credit ?? prev.credit) }));
        setBusiness((prev) => (prev ? { ...prev, credit: res.data?.credit } : prev));
        await loadHistory(1);
        setHistoryPage(1);
        alert(res.message || 'Đã cập nhật credit');
      } else alert(res?.message || 'Thất bại');
    } catch (err) {
      alert(err.message || 'Thất bại');
    } finally {
      setCreditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa tài khoản doanh nghiệp này?')) return;
    try {
      const res = await apiService.deleteAdminBusiness(businessId);
      if (res?.success) navigate('/admin/business-accounts');
      else alert(res?.message || 'Xóa thất bại');
    } catch (e) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        {t.loading || 'Đang tải...'}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/business-accounts" className="p-2 rounded-lg border hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {isCreate
              ? (t.adminBusinessCreate || 'Thêm doanh nghiệp')
              : (business?.companyName || t.adminBusinessDetail || 'Chi tiết doanh nghiệp')}
          </h1>
          {!isCreate && (
            <p className="text-sm text-violet-700 font-semibold mt-0.5 inline-flex items-center gap-1">
              <Coins className="w-4 h-4" />
              Credit hiện tại: {(business?.credit ?? 0).toLocaleString()}
            </p>
          )}
        </div>
        {!isCreate && (
          <button type="button" onClick={handleDelete} className="inline-flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{t.adminBusinessInfo || 'Thông tin doanh nghiệp'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Tên doanh nghiệp *</span>
            <input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Mã số thuế *</span>
            <input required value={form.taxCode} onChange={(e) => setForm({ ...form, taxCode: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Email đăng nhập *</span>
            <input required type="email" disabled={!isCreate} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 disabled:bg-gray-50" />
          </label>
          {isCreate && (
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Mật khẩu *</span>
              <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
          )}
          {isCreate && (
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Credit khởi tạo</span>
              <input type="number" min={0} value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </label>
          )}
          {!isCreate && (
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Trạng thái</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                <option value="0">Chờ duyệt</option>
                <option value="1">Hoạt động</option>
                <option value="2">Từ chối</option>
                <option value="3">Tạm khóa</option>
              </select>
            </label>
          )}
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Người liên hệ *</span>
            <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Chức vụ</span>
            <input value={form.contactTitle} onChange={(e) => setForm({ ...form, contactTitle: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Email liên hệ</span>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Số điện thoại *</span>
            <input required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-gray-700 font-medium">Địa chỉ</span>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </label>
        </div>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : (isCreate ? 'Tạo tài khoản' : 'Lưu thay đổi')}
        </button>
      </form>

      {!isCreate && (
        <>
          <form onSubmit={handleAdjustCredit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">{t.adminBusinessAdjustCredit || 'Cấp / khấu trừ credit'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block text-sm">
                <span className="text-gray-700 font-medium">Số credit</span>
                <input type="number" min={1} required value={creditForm.amount} onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700 font-medium">Loại</span>
                <select value={creditForm.action} onChange={(e) => setCreditForm({ ...creditForm, action: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="grant">Cấp credit</option>
                  <option value="deduct">Khấu trừ credit</option>
                </select>
              </label>
              <label className="block text-sm sm:col-span-1">
                <span className="text-gray-700 font-medium">Ghi chú</span>
                <input value={creditForm.note} onChange={(e) => setCreditForm({ ...creditForm, note: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Lý do điều chỉnh..." />
              </label>
            </div>
            <button type="submit" disabled={creditLoading} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
              <Coins className="w-4 h-4" />
              {creditLoading ? 'Đang xử lý...' : 'Áp dụng'}
            </button>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{t.adminBusinessCreditHistory || 'Lịch sử credit'}</h2>
            </div>
            {histories.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">Chưa có giao dịch credit</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Thời gian</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Loại</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">Thay đổi</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">Trước</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-600">Sau</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Ghi chú</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histories.map((h) => (
                      <tr key={h.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatDate(h.createdAt)}</td>
                        <td className="px-4 py-2">{CREDIT_TYPE_LABELS[h.type] || h.type}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${h.changeAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {h.changeAmount >= 0 ? '+' : ''}{h.changeAmount}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">{h.balanceBefore}</td>
                        <td className="px-4 py-2 text-right font-medium">{h.balanceAfter}</td>
                        <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate" title={h.note || ''}>{h.note || '—'}</td>
                        <td className="px-4 py-2 text-gray-600">{h.admin?.name || h.admin?.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {historyPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 py-3 border-t">
                <button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage((p) => p - 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Trước</button>
                <span className="text-sm text-gray-600 self-center">{historyPage} / {historyPagination.totalPages}</span>
                <button type="button" disabled={historyPage >= historyPagination.totalPages} onClick={() => setHistoryPage((p) => p + 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">Sau</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
