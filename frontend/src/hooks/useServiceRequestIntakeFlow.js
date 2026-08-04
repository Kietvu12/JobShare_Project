import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const ALERT_INITIAL = {
  open: false,
  kind: 'notice',
  title: '',
  message: '',
  variant: 'info',
  confirmLabel: 'OK',
  cancelLabel: 'Hủy',
  hideCancel: false,
  onConfirm: null,
};

/** Map billing service key → key dùng trong BrandingServiceIntakeModal */
export function getIntakeModalServiceKey(billingServiceKey) {
  if (billingServiceKey === 'seminar_campaign') return 'recruitment_event';
  return billingServiceKey;
}

export { getBillingServiceKeyFromIntake } from '../utils/serviceRequestNoteDisplay.js';

export function useServiceRequestIntakeFlow({
  serviceKey,
  serviceTitle,
  onSubmitted,
  defaultNote = '',
  useIntakeModal = true,
}) {
  const navigate = useNavigate();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alertModal, setAlertModal] = useState(ALERT_INITIAL);

  const closeAlertModal = useCallback(() => {
    setAlertModal((prev) => ({ ...prev, open: false }));
  }, []);

  const openNoticeModal = useCallback((title, message, variant = 'info', confirmLabel = 'OK') => {
    setAlertModal({
      open: true,
      kind: 'notice',
      title,
      message,
      variant,
      confirmLabel,
      cancelLabel: 'Hủy',
      hideCancel: true,
      onConfirm: null,
    });
  }, []);

  const openConfirmModal = useCallback(({ title, message, onConfirm, variant = 'success', confirmLabel = 'OK' }) => {
    setAlertModal({
      open: true,
      kind: 'confirm',
      title,
      message,
      variant,
      confirmLabel,
      cancelLabel: 'Đóng',
      hideCancel: false,
      onConfirm,
    });
  }, []);

  const submitRequest = useCallback(async (note) => {
    if (!serviceKey) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.createBusinessServiceRequest({
        serviceKey,
        serviceTitle,
        note: note || defaultNote || undefined,
      });
      if (res?.success) {
        setIntakeOpen(false);
        openConfirmModal({
          title: 'Đã gửi yêu cầu',
          message: `${res.message || 'Đã gửi yêu cầu tới JobShare WS.'}\n\nMở mục Tin nhắn để theo dõi?`,
          variant: 'success',
          confirmLabel: 'Mở Tin nhắn',
          onConfirm: () => navigate('/business/messages?tab=ws'),
        });
        await onSubmitted?.(res?.data);
      } else {
        const message = res?.message || 'Không gửi được yêu cầu. Vui lòng thử lại.';
        setError(message);
        openNoticeModal('Gửi yêu cầu thất bại', message, 'error');
      }
    } catch (err) {
      const message = err?.message || 'Không gửi được yêu cầu. Vui lòng thử lại.';
      setError(message);
      openNoticeModal('Gửi yêu cầu thất bại', message, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [serviceKey, serviceTitle, defaultNote, onSubmitted, openConfirmModal, openNoticeModal, navigate]);

  const openIntake = useCallback(() => {
    setError('');
    if (useIntakeModal) {
      setIntakeOpen(true);
      return;
    }
    submitRequest(defaultNote);
  }, [useIntakeModal, defaultNote, submitRequest]);

  const closeIntake = useCallback(() => {
    if (!submitting) setIntakeOpen(false);
  }, [submitting]);

  const handleIntakeSubmit = useCallback(async ({ note }) => {
    await submitRequest(note);
  }, [submitRequest]);

  return {
    intakeOpen,
    intakeModalServiceKey: getIntakeModalServiceKey(serviceKey),
    openIntake,
    closeIntake,
    handleIntakeSubmit,
    submitting,
    error,
    alertModal,
    closeAlertModal,
    useIntakeModal,
  };
}
