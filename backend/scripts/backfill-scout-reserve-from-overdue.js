/**
 * Đưa hồ sơ CTV quá hạn (status=4) vào Scout dự bị (scout_status=3).
 * Usage: node scripts/backfill-scout-reserve-from-overdue.js [--apply]
 */
import '../src/config/env.js';
import { CVStorage } from '../src/models/index.js';
import { Op } from 'sequelize';
import { CV_STATUS_OVERDUE_6_MONTHS } from '../src/constants/cvStatus.js';
import { SCOUT_LISTING_STATUS } from '../src/constants/scoutCredit.js';
import { moveCtvCvToScoutReserve } from '../src/services/scoutReserveService.js';

const apply = process.argv.includes('--apply');

async function main() {
  const rows = await CVStorage.findAll({
    where: {
      collaboratorId: { [Op.ne]: null },
      status: CV_STATUS_OVERDUE_6_MONTHS,
      scoutStatus: { [Op.ne]: SCOUT_LISTING_STATUS.RESERVE },
    },
  });

  console.log(`Found ${rows.length} overdue CTV CV(s). apply=${apply}`);
  let moved = 0;
  for (const cv of rows) {
    if (!apply) {
      console.log(`[dry-run] would reserve cv #${cv.id} ${cv.code}`);
      continue;
    }
    const r = await moveCtvCvToScoutReserve(cv);
    if (r.moved) moved += 1;
  }
  if (apply) console.log(`Moved ${moved} to Scout reserve.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
