import { JobApplication, Admin } from '../models/index.js';

const WS_SUPPORT_PHONE = process.env.WS_SUPPORT_PHONE || '0972899728';
const WS_SUPPORT_PHONE_TEL = process.env.WS_SUPPORT_PHONE_TEL || '+84972899728';

export function buildWsSupportContact() {
  return {
    wsPhone: WS_SUPPORT_PHONE,
    wsPhoneTel: WS_SUPPORT_PHONE_TEL,
  };
}

export async function loadNominationResponsibleContact(jobApplicationId) {
  const ws = buildWsSupportContact();
  const id = parseInt(jobApplicationId, 10);
  if (!Number.isFinite(id)) {
    return { ...ws, adminName: null, adminPhone: null };
  }

  const app = await JobApplication.findByPk(id, {
    attributes: ['id', 'adminResponsibleId'],
    include: [{
      model: Admin,
      as: 'adminResponsible',
      required: false,
      attributes: ['id', 'name', 'phone'],
    }],
  });

  const admin = app?.adminResponsible;
  return {
    ...ws,
    adminName: admin?.name?.trim() || null,
    adminPhone: admin?.phone?.trim() || null,
  };
}
