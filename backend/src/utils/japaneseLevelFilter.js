import { Op } from 'sequelize';

/**
 * Japanese level job search filter (CTV/admin job list).
 * Filter values: N1_up … N5_up (include that level and easier N2–N5), none (no JLPT in requirements).
 */

const LEVEL_KEYS = ['N1', 'N2', 'N3', 'N4', 'N5'];

const LEGACY_EXACT_PRESET_TERMS = new Set(
  LEVEL_KEYS.flatMap((lvl) => [`${lvl}_required`, `${lvl}_equivalent`])
);

/** N1 (strictest) = 1 … N5 (easiest) = 5. Nk_up → Nk, N(k+1), … N5 */
function levelKeysFromMinNum(minNum) {
  return LEVEL_KEYS.filter((_, idx) => idx + 1 >= minNum);
}

/**
 * @param {string} filterValue
 * @returns {{ mode: 'any' | 'none', levelKeys: string[] } | null}
 */
export function resolveJapaneseLevelFilter(filterValue) {
  const raw = String(filterValue ?? '').trim();
  if (!raw) return null;

  if (raw === 'none') {
    return { mode: 'none', levelKeys: [...LEVEL_KEYS] };
  }

  const upMatch = raw.match(/^N([1-5])_up$/i);
  if (upMatch) {
    const min = parseInt(upMatch[1], 10);
    return { mode: 'any', levelKeys: levelKeysFromMinNum(min) };
  }

  const landingMatch = raw.match(/^n([1-5])$/i);
  if (landingMatch) {
    const min = parseInt(landingMatch[1], 10);
    return { mode: 'any', levelKeys: levelKeysFromMinNum(min) };
  }

  if (LEGACY_EXACT_PRESET_TERMS.has(raw)) {
    const lvl = raw.replace(/_(required|equivalent)$/i, '').toUpperCase();
    return { mode: 'any', levelKeys: LEVEL_KEYS.includes(lvl) ? [lvl] : [] };
  }

  const legacyLevel = raw.match(/^N([1-5])$/i);
  if (legacyLevel) {
    return { mode: 'any', levelKeys: [`N${legacyLevel[1]}`] };
  }

  return { mode: 'any', levelKeys: [...LEVEL_KEYS] };
}

function likeThreeColumns(alias, columnBase, pattern, sequelize, likePat) {
  const esc = sequelize.escape(likePat(pattern));
  return `(${alias}.${columnBase} LIKE ${esc} ESCAPE '\\\\' OR ${alias}.${columnBase}_en LIKE ${esc} ESCAPE '\\\\' OR ${alias}.${columnBase}_jp LIKE ${esc} ESCAPE '\\\\')`;
}

function buildRequirementLevelSql(level, sequelize, likePat) {
  return likeThreeColumns('r', 'content', level, sequelize, likePat);
}

/** Subquery: job ids with matching JLPT text in requirements (all types). */
export function buildJapaneseLevelJobIdsSubquery(levelKeys, sequelize, likePat) {
  const reqLevelSql = levelKeys.map((lvl) => `(${buildRequirementLevelSql(lvl, sequelize, likePat)})`).join(' OR ');
  return `(
    SELECT DISTINCT r.job_id
    FROM requirements r
    WHERE r.deleted_at IS NULL
      AND (${reqLevelSql})
  )`;
}

/**
 * Use id IN (subquery) — Sequelize generates correct SQL with subQuery/includes.
 * Avoids broken `\`Job\`.\`id\`` correlation in nested queries.
 *
 * @param {string} filterValue
 * @param {import('sequelize').Sequelize} sequelize
 * @param {(q: string) => string} likePat
 * @returns {import('sequelize').WhereOptions | null}
 */
export function buildJapaneseLevelWhereClause(filterValue, sequelize, likePat) {
  const resolved = resolveJapaneseLevelFilter(filterValue);
  if (!resolved) return null;

  const levelKeys = resolved.levelKeys.length > 0 ? resolved.levelKeys : LEVEL_KEYS;
  const subquery = buildJapaneseLevelJobIdsSubquery(levelKeys, sequelize, likePat);

  if (resolved.mode === 'none') {
    return {
      id: {
        [Op.notIn]: sequelize.literal(subquery)
      }
    };
  }

  return {
    id: {
      [Op.in]: sequelize.literal(subquery)
    }
  };
}
