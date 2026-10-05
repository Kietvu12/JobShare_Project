/**
 * Trạng thái đơn ứng tuyển / tiến cử (job_applications.status)
 * Dùng chung cho backend (controller, payment, ...) và đồng bộ với frontend utils/jobApplicationStatus.js
 */
export const JOB_APPLICATION_STATUS = {
  1: {
    label: 'Hồ sơ trùng',
    value: 'duplicate',
    category: 'rejected'
  },
  2: {
    label: 'Đang đợi xử lý hồ sơ WS',
    value: 'waiting_ws',
    category: 'processing'
  },
  3: {
    label: 'Đang xử lý hồ sơ',
    value: 'processing_ws',
    category: 'processing'
  },
  4: {
    label: 'Trượt hồ sơ WS',
    value: 'rejected_ws',
    category: 'rejected'
  },
  5: {
    label: 'Đang kiểm tra hồ sơ',
    value: 'nominating',
    category: 'processing'
  },
  6: {
    label: 'Trượt hồ sơ khách hàng',
    value: 'rejected_client',
    category: 'rejected'
  },
  7: {
    label: 'Đang điều chỉnh lịch phỏng vấn',
    value: 'scheduling_interview',
    category: 'interview'
  },
  8: {
    label: 'Đang chờ phỏng vấn',
    value: 'waiting_interview',
    category: 'interview'
  },
  9: {
    label: 'Đang chờ kết quả phỏng vấn',
    value: 'waiting_interview_result',
    category: 'interview'
  },
  10: {
    label: 'Trượt phỏng vấn',
    value: 'failed_interview',
    category: 'rejected'
  },
  11: {
    label: 'Đã có thông báo trúng tuyển',
    value: 'has_naitei',
    category: 'waiting'
  },
  12: {
    label: 'Đã nhận thông báo trúng tuyển',
    value: 'accepted_naitei',
    category: 'success'
  },
  13: {
    label: 'Từ chối thông báo trúng tuyển',
    value: 'declined_naitei',
    category: 'rejected'
  },
  14: {
    label: 'Đã vào công ty',
    value: 'joined_company',
    category: 'success'
  },
  15: {
    label: 'Đã thanh toán',
    value: 'paid',
    category: 'success'
  },
  16: {
    label: 'Ứng viên huỷ giữa chừng',
    value: 'candidate_withdrew',
    category: 'cancelled'
  },
  17: {
    label: 'Scout Credit: Contact sai / Không liên hệ được',
    value: 'scout_contact_failed',
    category: 'rejected'
  },
  18: {
    label: 'Scout Credit: Đã liên hệ – Ứng viên từ chối',
    value: 'scout_contacted_declined',
    category: 'rejected'
  },
  19: {
    label: 'Scout Credit: Đã liên hệ – Đang chờ phản hồi',
    value: 'scout_contacted_waiting',
    category: 'processing'
  },
  20: {
    label: 'Scout Ủy Thác: Đã hearing – Đồng ý tiến cử',
    value: 'managed_hearing_agreed',
    category: 'processing'
  },
  21: {
    label: 'Scout Ủy Thác: WS đang hoàn thiện hồ sơ',
    value: 'managed_preparing_profile',
    category: 'processing'
  },
  22: {
    label: 'Scout Ủy Thác: Đang chờ hoàn tất hợp đồng',
    value: 'managed_awaiting_contract',
    category: 'processing'
  },
  23: {
    label: 'Scout Ủy Thác: WS mới tiến cử',
    value: 'managed_nominated',
    category: 'processing'
  }
};

export const JOB_APPLICATION_STATUS_MAX = 23;

export const isValidJobApplicationStatus = (status) => {
  const n = Number(status);
  return Number.isInteger(n) && n >= 1 && n <= JOB_APPLICATION_STATUS_MAX;
};

/** Scout Credit — bước tiếp cận ứng viên trước khi vào quy trình tuyển chọn chung */
export const STATUS_SCOUT_CONTACT_FAILED = 17;
export const STATUS_SCOUT_CONTACTED_DECLINED = 18;
export const STATUS_SCOUT_CONTACTED_WAITING = 19;

/**
 * Scout Ủy Thác — bước WS xử lý trước tiến cử:
 * 2 đã gửi yêu cầu → 22 chờ hợp đồng → 3 WS hearing → 4 UV từ chối | 20 đồng ý → 21 hoàn thiện hồ sơ → 23 WS tiến cử
 */
export const STATUS_MANAGED_HEARING_AGREED = 20;
export const STATUS_MANAGED_PREPARING_PROFILE = 21;
export const STATUS_MANAGED_AWAITING_CONTRACT = 22;
export const STATUS_MANAGED_NOMINATED = 23;
export const MANAGED_PRE_NOMINATION_STATUSES = [2, 22, 3, 4, 20, 21];

/** Đang xếp lịch PV (7, legacy 8) → tự chuyển Đang phỏng vấn (9) khi tới interview_date */
export const STATUS_SCHEDULING_INTERVIEW = 7;
export const STATUS_INTERVIEWING = 9;
/** Đã gửi offer — set nyusha_date dự kiến */
export const STATUS_OFFER_SENT = 11;
/** Chờ vào công ty → tự chuyển Đã vào công ty (14) khi tới nyusha_date */
export const STATUS_WAITING_TO_JOIN = 12;

/** Hồ sơ trùng – tiến cử lần 2 cùng job khi đơn cũ chưa kết thúc */
export const STATUS_DUPLICATE = 1;

/** Số trạng thái: dùng khi tạo đơn (CTV tiến cử → đợi WS xử lý) */
export const STATUS_WAITING_WS = 2;

/** Đã vào công ty (nyusha) – dùng cho payment request, lịch nhận tiền n+4 */
export const STATUS_JOINED_COMPANY = 14;

/** Đã thanh toán – không cho xóa đơn */
export const STATUS_PAID = 15;

/** Các trạng thái không cho phép CTV xóa đơn */
export const RESTRICTED_STATUSES_FOR_DELETE = [STATUS_JOINED_COMPANY, STATUS_PAID];

/** Các trạng thái coi là đã kết thúc (trượt/từ chối/hủy) – ứng viên có thể được tiến cử lại cùng job */
export const STATUSES_ENDED = [4, 6, 10, 13, 16, 17, 18]; // Trượt WS, Trượt khách, Trượt PV, Từ chối naitei, Huỷ giữa chừng, Scout Credit: không liên hệ được / UV từ chối

/** Các trạng thái đang xử lý — cấm tạo đơn trùng (cùng CV + cùng job) */
export const STATUSES_ACTIVE_BLOCK_DUPLICATE = [2, 3, 5, 7, 8, 9, 19, 20, 21, 22, 23];

/**
 * Kiểm tra trạng thái đơn đã kết thúc chưa (cho phép tiến cử lại cùng job)
 * @param {number} status
 * @returns {boolean}
 */
export const isStatusEnded = (status) => {
  const n = Number(status);
  return Number.isInteger(n) && STATUSES_ENDED.includes(n);
};

/**
 * Lấy thông tin trạng thái theo mã số. Null/undefined/không hợp lệ → coi như 2 (Đang đợi xử lý hồ sơ WS)
 * @param {number|string|null|undefined} status
 * @returns {{ label: string, value: string, category: string }}
 */
export const getJobApplicationStatus = (status) => {
  const num = status != null && status !== '' ? Number(status) : NaN;
  if (Number.isNaN(num) || num < 1 || num > JOB_APPLICATION_STATUS_MAX) {
    return JOB_APPLICATION_STATUS[2];
  }
  return JOB_APPLICATION_STATUS[num] || JOB_APPLICATION_STATUS[2];
};
