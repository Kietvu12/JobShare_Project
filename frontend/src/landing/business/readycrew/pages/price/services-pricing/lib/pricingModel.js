import { PRICING_CONFIG } from './pricingConfig';

const NUMERIC_LIMITS = [
  ['headcount', 1, 500],
  ['income', 1, 100000000],
  ['budget', 0, 100000000000],
  ['opens', 1, 999],
  ['partner', 1, 100000000],
];

export function validate(state, cfg = PRICING_CONFIG) {
  const errors = [];
  for (const [key, min, max] of NUMERIC_LIMITS) {
    const raw = state[key];
    const value = Number(raw);
    if (String(raw ?? '').trim() === '' || !Number.isSafeInteger(value) || value < min || value > max) {
      errors.push(key);
    }
  }
  if (!cfg.managedRates[state.level]) errors.push('level');
  return errors;
}

/** Tổ hợp gói rẻ nhất phủ đủ số credit (đơn vị 1.000 credit, xét dư tối đa 4 đơn vị). */
export function buyCredits(required, cfg = PRICING_CONFIG) {
  const target = Math.ceil(required / 1000);
  const limit = target + 4;
  const dp = new Float64Array(limit + 1).fill(Infinity);
  const from = new Int32Array(limit + 1).fill(-1);
  dp[0] = 0;

  for (let u = 1; u <= limit; u += 1) {
    cfg.packages.forEach((pkg, i) => {
      const step = pkg.credits / 1000;
      if (u >= step && dp[u - step] + pkg.price < dp[u]) {
        dp[u] = dp[u - step] + pkg.price;
        from[u] = i;
      }
    });
  }

  let best = target;
  for (let u = target + 1; u <= limit; u += 1) {
    if (dp[u] < dp[best]) best = u;
  }

  const counts = Array(cfg.packages.length).fill(0);
  for (let u = best; u > 0; ) {
    const i = from[u];
    counts[i] += 1;
    u -= cfg.packages[i].credits / 1000;
  }

  return {
    cost: dp[best],
    credits: best * 1000,
    remaining: best * 1000 - required,
    items: cfg.packages.map((pkg, i) => ({ ...pkg, count: counts[i] })).filter((pkg) => pkg.count),
  };
}

export function budgetStatus(min, max, budget) {
  if (budget === 0) return { kind: 'none', diff: 0 };
  if (max <= budget) return { kind: 'within', diff: budget - max };
  if (min <= budget) return { kind: 'partial', diff: max - budget };
  return { kind: 'over', diff: max - budget };
}

export function calculate(state, cfg = PRICING_CONFIG) {
  const errors = validate(state, cfg);
  if (errors.length) return { errors };

  const s = Object.fromEntries(
    Object.entries(state).map(([key, value]) => [key, key === 'level' ? value : Number(value)]),
  );

  const opens = s.headcount * s.opens;
  const credit = buyCredits(opens * cfg.creditsPerUnlock, cfg);
  const direct = {
    ...credit,
    min: credit.cost,
    max: credit.cost,
    opens,
    status: budgetStatus(credit.cost, credit.cost, s.budget),
  };

  const rates = cfg.managedRates[s.level];
  const managedMin = Math.round((s.headcount * s.income * rates[0]) / 100);
  const managedMax = Math.round((s.headcount * s.income * rates[1]) / 100);
  const managed = {
    min: managedMin,
    max: managedMax,
    rates,
    status: budgetStatus(managedMin, managedMax, s.budget),
  };

  const partnerTotal = s.headcount * s.partner;
  const platform = Math.round((s.partner * cfg.partnerPlatformPercent) / 100);
  const partner = {
    min: partnerTotal,
    max: partnerTotal,
    platform,
    net: s.partner - platform,
    status: budgetStatus(partnerTotal, partnerTotal, s.budget),
  };

  return { state: s, direct, managed, partner };
}
