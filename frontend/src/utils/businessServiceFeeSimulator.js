import { BUSINESS_CREDIT_PACKAGES } from './businessCreditPackages.js';

/** Phí sàn WS tính trên mức phí DN tự đặt (DN trả đúng mức đã đặt, CTV nhận phần còn lại) */
export const SIMULATOR_MARKETPLACE_PLATFORM_FEE_PERCENT = 20;

/** Biểu phí Scout Ủy Thác theo cấp bậc (% thu nhập năm, trả khi tuyển thành công) */
export const SCOUT_MANAGED_FEE_TIERS = {
  junior: { min: 15, max: 15 },
  mid: { min: 18, max: 20 },
  senior: { min: 20, max: 25 },
};

export const SIMULATOR_SERVICE_PATHS = {
  scout_credit: '/business/scout/direct',
  scout_performance: '/business/scout/managed',
  ctv_marketplace: '/business/candidate-sharing',
};

const PACKAGES_BY_SIZE = [...BUSINESS_CREDIT_PACKAGES].sort((a, b) => b.credits - a.credits);

export function getDefaultCreditsPerUnlock() {
  const basic = BUSINESS_CREDIT_PACKAGES[0];
  return basic?.profileOpens ? Math.round(basic.credits / basic.profileOpens) : 100;
}

function toPositive(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Tổ hợp gói credit rẻ nhất đủ ≥ creditsNeeded */
export function cheapestCreditPurchase(creditsNeeded) {
  const need = Math.ceil(toPositive(creditsNeeded));
  if (!need) return { cost: 0, credits: 0, items: [] };
  const [large, medium, small] = PACKAGES_BY_SIZE;
  const largeMax = Math.ceil(need / large.credits);
  let best = null;
  for (let l = Math.max(0, largeMax - 3); l <= largeMax; l += 1) {
    const restAfterLarge = Math.max(0, need - l * large.credits);
    const mediumMax = Math.ceil(restAfterLarge / medium.credits);
    for (let m = 0; m <= mediumMax; m += 1) {
      const rest = Math.max(0, restAfterLarge - m * medium.credits);
      const s = Math.ceil(rest / small.credits);
      const cost = l * large.priceYen + m * medium.priceYen + s * small.priceYen;
      if (!best || cost < best.cost) {
        best = {
          cost,
          credits: l * large.credits + m * medium.credits + s * small.credits,
          counts: [[large, l], [medium, m], [small, s]],
        };
      }
    }
  }
  return {
    cost: best.cost,
    credits: best.credits,
    items: best.counts.filter(([, c]) => c > 0).map(([pkg, count]) => ({ key: pkg.key, name: pkg.name, count })),
  };
}

/** Số credit tối đa mua được với ngân sách (tổ hợp gói) */
export function maxCreditsForBudget(budget) {
  const b = toPositive(budget);
  const [large, medium, small] = PACKAGES_BY_SIZE;
  const largeMax = Math.floor(b / large.priceYen);
  let bestCredits = 0;
  for (let l = Math.max(0, largeMax - 3); l <= largeMax; l += 1) {
    const restAfterLarge = b - l * large.priceYen;
    const mediumMax = Math.floor(restAfterLarge / medium.priceYen);
    for (let m = 0; m <= mediumMax; m += 1) {
      const rest = restAfterLarge - m * medium.priceYen;
      const s = Math.floor(rest / small.priceYen);
      const credits = l * large.credits + m * medium.credits + s * small.credits;
      if (credits > bestCredits) bestCredits = credits;
    }
  }
  return bestCredits;
}

function budgetStatus(minCost, maxCost, budget) {
  if (!budget) return { key: 'none', diff: 0 };
  if (maxCost <= budget) return { key: 'within', diff: budget - maxCost };
  if (minCost <= budget) return { key: 'partial', diff: maxCost - budget };
  return { key: 'over', diff: minCost - budget };
}

/**
 * Ước tính chi phí 3 dịch vụ (JPY).
 * @param {object} input
 * @param {number} input.headcount
 * @param {number} input.annualIncome — thu nhập năm dự kiến / người
 * @param {'junior'|'mid'|'senior'} input.level
 * @param {number} input.budget — tổng ngân sách tuyển dụng
 * @param {number} input.ctvFeePerHire — mức phí DN tự đặt trên Sàn CTV / người
 * @param {number} input.opensPerHire — số hồ sơ dự kiến mở để tuyển 1 người (Scout Credit)
 * @param {number} input.creditsPerUnlock
 */
export function simulateServiceFees(input) {
  const headcount = Math.max(1, Math.round(toPositive(input.headcount, 1)));
  const annualIncome = toPositive(input.annualIncome);
  const budget = toPositive(input.budget);
  const opensPerHire = Math.max(1, Math.round(toPositive(input.opensPerHire, 1)));
  const creditsPerUnlock = toPositive(input.creditsPerUnlock, getDefaultCreditsPerUnlock());
  const ctvFeePerHire = toPositive(input.ctvFeePerHire);
  const tier = SCOUT_MANAGED_FEE_TIERS[input.level] || SCOUT_MANAGED_FEE_TIERS.mid;

  const totalOpens = headcount * opensPerHire;
  const creditsNeeded = totalOpens * creditsPerUnlock;
  const purchase = cheapestCreditPurchase(creditsNeeded);
  const affordableOpens = budget ? Math.floor(maxCreditsForBudget(budget) / creditsPerUnlock) : null;
  const scoutCredit = {
    key: 'scout_credit',
    total: purchase.cost,
    min: purchase.cost,
    max: purchase.cost,
    perHire: Math.round(purchase.cost / headcount),
    totalOpens,
    creditsNeeded,
    creditsPurchased: purchase.credits,
    packages: purchase.items,
    affordableOpens,
    budget: budgetStatus(purchase.cost, purchase.cost, budget),
  };

  const managedMin = Math.round(headcount * annualIncome * (tier.min / 100));
  const managedMax = Math.round(headcount * annualIncome * (tier.max / 100));
  const scoutPerformance = {
    key: 'scout_performance',
    total: Math.round((managedMin + managedMax) / 2),
    min: managedMin,
    max: managedMax,
    perHireMin: Math.round(managedMin / headcount),
    perHireMax: Math.round(managedMax / headcount),
    feeMin: tier.min,
    feeMax: tier.max,
    budget: budgetStatus(managedMin, managedMax, budget),
  };

  const ctvTotal = Math.round(headcount * ctvFeePerHire);
  const platformShare = SIMULATOR_MARKETPLACE_PLATFORM_FEE_PERCENT / 100;
  const ctvMarketplace = {
    key: 'ctv_marketplace',
    total: ctvTotal,
    min: ctvTotal,
    max: ctvTotal,
    perHire: Math.round(ctvFeePerHire),
    platformFeePercent: SIMULATOR_MARKETPLACE_PLATFORM_FEE_PERCENT,
    platformFeePerHire: Math.round(ctvFeePerHire * platformShare),
    collaboratorPerHire: Math.round(ctvFeePerHire * (1 - platformShare)),
    percentOfIncome: annualIncome ? Math.round((ctvFeePerHire / annualIncome) * 1000) / 10 : null,
    maxFeeForBudget: budget ? Math.floor(budget / headcount) : null,
    budget: budgetStatus(ctvTotal, ctvTotal, budget),
  };

  const results = [scoutCredit, scoutPerformance, ctvMarketplace];
  const priced = results.filter((r) => r.total > 0);
  const cheapestKey = priced.length
    ? priced.reduce((best, r) => (r.total < best.total ? r : best)).key
    : null;

  return { headcount, budget, results, cheapestKey };
}
