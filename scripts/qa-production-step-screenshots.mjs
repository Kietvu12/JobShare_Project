/**
 * Chụp QA step-by-step trên production (Business + Admin).
 * Chạy: node scripts/qa-production-step-screenshots.mjs
 * Cần: npx playwright install chromium (lần đầu)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playwrightEntry = path.join(__dirname, 'qa-runner/node_modules/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(playwrightEntry).href);
const ROOT = path.resolve(__dirname, '../docs/qa-screenshots/business-flows');

const BIZ = {
  email: 'kietvu389@gmail.com',
  password: '12345678',
  loginUrl: 'https://ws-jobshare.com/business/login',
};
const ADMIN = {
  email: 'admin@example.com',
  password: '123456',
  loginUrl: 'https://admin.ws-jobshare.com/admin/login',
};

async function shot(page, relPath) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: full, fullPage: false });
  console.log('OK', relPath);
}

async function ensureBusinessLoggedIn(page) {
  await page.goto(BIZ.loginUrl, { waitUntil: 'domcontentloaded' });
  const password = page.locator('input[type="password"]').first();
  if (await password.isVisible().catch(() => false)) {
    await page.locator('input[type="email"], input[name="email"]').first().fill(BIZ.email);
    await password.fill(BIZ.password);
    await password.press('Enter');
    await Promise.race([
      page.waitForURL(/\/business(?!\/login)/, { timeout: 45000 }),
      page.getByRole('heading', { name: /こんにちは|Dashboard|Trang chủ/i }).waitFor({ timeout: 45000 }),
    ]);
    await page.waitForTimeout(1500);
  }
}

async function loginBusiness(page, { captureFilledForm = true } = {}) {
  await page.goto(BIZ.loginUrl, { waitUntil: 'domcontentloaded' });
  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();
  await email.fill(BIZ.email);
  await password.fill(BIZ.password);
  if (captureFilledForm) {
    await shot(page, 'credit-topup/business/step-02-nhap-email-mat-khau.png');
  }
  await password.press('Enter');
  await Promise.race([
    page.waitForURL(/\/business(?!\/login)/, { timeout: 45000 }),
    page.getByRole('heading', { name: /こんにちは|Dashboard/i }).waitFor({ timeout: 45000 }),
  ]);
  await page.waitForTimeout(1500);
}

async function loginAdmin(page) {
  await page.goto(ADMIN.loginUrl, { waitUntil: 'domcontentloaded' });
  if (await page.locator('input[type="password"]').first().isVisible().catch(() => false)) {
    await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN.email);
    await page.locator('input[type="password"]').first().fill(ADMIN.password);
    await page.getByRole('button', { name: /đăng nhập|login|ログイン/i }).first().click();
    await page.waitForURL(/\/admin\//, { timeout: 30000 });
  }
  await page.waitForTimeout(1500);
}

async function captureCreditTopup(page) {
  await page.goto(BIZ.loginUrl, { waitUntil: 'domcontentloaded' });
  await shot(page, 'credit-topup/business/step-01-trang-dang-nhap.png');
  await loginBusiness(page, { captureFilledForm: true });
  await shot(page, 'credit-topup/business/step-03-dashboard-sau-dang-nhap.png');

  await page.goto('https://ws-jobshare.com/business/service-requests', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1500);
  await shot(page, 'credit-topup/business/step-04-hub-service-requests.png');

  const creditCard = page.getByText('クレジットチャージ', { exact: false }).first();
  if (await creditCard.isVisible().catch(() => false)) {
    await creditCard.scrollIntoViewIfNeeded();
  } else {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
  }
  await page.waitForTimeout(500);
  await shot(page, 'credit-topup/business/step-05-the-credit-tren-hub.png');

  await page.goto('https://ws-jobshare.com/business/service-requests/credit', {
    waitUntil: 'networkidle',
  }).catch(() => page.goto('https://ws-jobshare.com/business/service-requests/credit'));
  await page.waitForSelector('button:has-text("このプランを選ぶ"), h1, h2', { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await shot(page, 'credit-topup/business/step-06-trang-chon-goi-credit.png');

  const planBtn = page.locator('button').filter({ hasText: 'このプランを選ぶ' }).first();
  await planBtn.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});
  if (await planBtn.isVisible().catch(() => false)) {
    await planBtn.scrollIntoViewIfNeeded();
    await shot(page, 'credit-topup/business/step-07-chon-plan-basic.png');
    await planBtn.click();
    await page.waitForTimeout(800);
    const dialog = page.locator('[role="dialog"], .modal, [class*="Modal"]').first();
    if (await dialog.isVisible().catch(() => false)) {
      await shot(page, 'credit-topup/business/step-08-popup-xac-nhan-yeu-cau.png');
      const cancel = page.getByRole('button', { name: /キャンセル|cancel|hủy/i }).first();
      if (await cancel.isVisible().catch(() => false)) await cancel.click();
    } else {
      await shot(page, 'credit-topup/business/step-08-sau-khi-chon-plan.png');
    }
  }
  await page.getByText('最近の依頼').first().scrollIntoViewIfNeeded().catch(() => {});
  await shot(page, 'credit-topup/business/step-09-lich-su-yeu-cau-gan-day.png');
}

async function dismissOverlay(page) {
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(250);
  }
  const namedClose = page.getByRole('button', {
    name: /Đóng hộp thoại|Close dialog|閉じる|キャンセル|Hủy|Cancel/i,
  }).first();
  if (await namedClose.isVisible().catch(() => false)) {
    await namedClose.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function captureServiceDashboardStep(page, folder) {
  await page.goto('https://ws-jobshare.com/business', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await shot(page, `${folder}/step-01-tu-dashboard.png`);
}

async function waitScoutWorkspace(page, timeout = 35000) {
  await page.locator('.scout-workspace-filters').first().waitFor({ state: 'visible', timeout });
}

async function fetchFirstBusinessJobId(page) {
  await page.goto('https://ws-jobshare.com/business/jobs', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const href = await page.locator('a[href*="/business/jobs/"]').first().getAttribute('href').catch(() => null);
  const match = href?.match(/\/business\/jobs\/([^/?#]+)/);
  return match?.[1] ?? null;
}

async function openScoutWorkspaceViaJobDeepLink(page, scoutPath) {
  const jobId = await fetchFirstBusinessJobId(page);
  if (!jobId) return false;
  await page.goto(`https://ws-jobshare.com${scoutPath}?jobId=${encodeURIComponent(String(jobId))}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(2500);
  return page.locator('.scout-workspace-filters').first().isVisible().catch(() => false);
}

async function waitScoutPageReady(page) {
  await page.locator('button.scout-primary-btn, .scout-workspace-filters').first().waitFor({
    state: 'visible',
    timeout: 60000,
  });
}

async function enterScoutFromOnboarding(page, folder, scoutPath) {
  await waitScoutPageReady(page);
  if (await page.locator('.scout-workspace-filters').first().isVisible().catch(() => false)) {
    await shot(page, `${folder}/step-02-workspace-sau-onboarding.png`);
    return;
  }
  await shot(page, `${folder}/step-02-onboarding-dich-vu.png`);

  const primary = page.locator('button.scout-primary-btn').first();
  if (await primary.isVisible().catch(() => false)) {
    await primary.scrollIntoViewIfNeeded();
    await primary.click({ force: true });
  } else {
    const startPatterns = [
      /Bắt đầu Scout/i,
      /Bắt đầu với Scout/i,
      /Chọn gói và bắt đầu/i,
      /スカウトを開始/,
      /プランを選んで開始/,
      /おまかせスカウトを始める/,
      /Start scouting/i,
      /Choose a package/i,
      /Get started with Omakase/i,
    ];
    for (const pattern of startPatterns) {
      const btn = page.getByRole('button', { name: pattern }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click({ force: true });
        break;
      }
    }
  }

  await page.waitForTimeout(2800);
  if (await page.locator('[role="dialog"]').first().isVisible().catch(() => false)) {
    await shot(page, `${folder}/step-03-modal-thieu-credit-hoac-can-nap.png`);
    await dismissOverlay(page);
  } else if (await page.getByText(/クレジットチャージ|プラン|credit package/i).first().isVisible().catch(() => false)) {
    await shot(page, `${folder}/step-03-goi-credit-tren-onboarding.png`);
  }

  const inWorkspace = await page.locator('.scout-workspace-filters').first().isVisible().catch(() => false);
  if (!inWorkspace) {
    const viaJob = await openScoutWorkspaceViaJobDeepLink(page, scoutPath);
    if (!viaJob) {
      const explore = page.getByRole('button', { name: /すべての候補者|Explore all|Xem tất cả/i }).first();
      if (await explore.isVisible().catch(() => false)) {
        await explore.click();
      }
    }
  }
  await waitScoutWorkspace(page);
  await shot(page, `${folder}/step-04-workspace-bo-loc-va-danh-sach.png`);
  const adv = page.locator('.scout-workspace-filters button').filter({
    hasText: /Bộ lọc nâng cao|詳細|フィルター|Advanced filter/i,
  }).first();
  if (await adv.isVisible().catch(() => false)) {
    await adv.click();
    await page.waitForTimeout(400);
    await shot(page, `${folder}/step-05-mo-bo-loc-nang-cao.png`);
  }
}

async function captureUnlockedCandidatesTrail(page, context, folder, listKey) {
  await page.goto(`https://ws-jobshare.com/business/candidates?list=${listKey}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(2800);
  await shot(page, `${folder}/step-08-ho-so-da-mo-trong-danh-sach.png`);
  const row = page.locator('button.candidates-list-item').first();
  if (await row.isVisible().catch(() => false)) {
    await row.scrollIntoViewIfNeeded();
    const popupPromise = context.waitForEvent('page', { timeout: 20000 });
    await row.click();
    const detailPage = await popupPromise;
    await detailPage.waitForLoadState('domcontentloaded');
    await detailPage.waitForTimeout(2000);
    await shot(detailPage, `${folder}/step-09-chi-tiet-ho-so-da-mo-gan-jd.png`);
    await detailPage.close().catch(() => {});
  }
}

async function captureApplicationsTrail(page, folder, sourceType) {
  await page.goto('https://ws-jobshare.com/business/applications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const sourceSelect = page.locator('select').filter({
    has: page.locator(`option[value="${sourceType}"]`),
  }).first();
  if (await sourceSelect.isVisible().catch(() => false)) {
    await sourceSelect.selectOption(sourceType);
    await page.waitForTimeout(1800);
  }
  await shot(page, `${folder}/step-10-quan-ly-ung-vien-loc-nguon.png`);
  const appRow = page.locator('tbody tr.cursor-pointer').first();
  if (await appRow.isVisible().catch(() => false)) {
    await appRow.scrollIntoViewIfNeeded();
    await appRow.click();
    await page.waitForTimeout(1500);
    await shot(page, `${folder}/step-11-drawer-trang-thai-don-tien-cu.png`);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function captureManagedWsMessagesTrail(page, folder) {
  await page.goto('https://ws-jobshare.com/business/messages?tab=ws', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, `${folder}/step-12-tin-nhan-ws-scout-uy-thac.png`);
}

async function openFirstScoutCandidateTab(context, page, folder, stepPrefix) {
  const row = page.locator('button.scout-list-item').first();
  await row.waitFor({ state: 'visible', timeout: 40000 });
  await row.scrollIntoViewIfNeeded();
  await shot(page, `${folder}/${stepPrefix}-danh-sach-ung-vien.png`);
  const popupPromise = context.waitForEvent('page', { timeout: 25000 });
  await row.click();
  const detail = await popupPromise;
  await detail.waitForLoadState('domcontentloaded');
  await detail.waitForTimeout(1800);
  await shot(detail, `${folder}/${stepPrefix}-chi-tiet-ung-vien-tab.png`);
  return detail;
}

async function captureDirectScout(page, context) {
  const folder = 'service-direct-scout';
  await captureServiceDashboardStep(page, folder);
  await page.goto('https://ws-jobshare.com/business/scout/direct', { waitUntil: 'domcontentloaded' });
  await waitScoutPageReady(page).catch(() => {});
  if (await page.locator('.scout-workspace-filters').first().isVisible().catch(() => false)) {
    await shot(page, `${folder}/step-02-workspace-da-vao-truoc-do.png`);
  } else {
    await enterScoutFromOnboarding(page, folder, '/business/scout/direct');
  }
  const detail = await openFirstScoutCandidateTab(context, page, folder, 'step-06');
  const unlockBtn = detail.getByRole('button', { name: /Mở liên hệ|連絡先を開示|開示|Unlock candidate/i }).first();
  if (await unlockBtn.isVisible().catch(() => false)) {
    await unlockBtn.scrollIntoViewIfNeeded();
    await unlockBtn.click();
    await detail.waitForTimeout(700);
    await shot(detail, `${folder}/step-07-modal-xac-nhan-mo-ho-so.png`);
    await dismissOverlay(detail);
  }
  await detail.close().catch(() => {});
  await captureUnlockedCandidatesTrail(page, context, folder, 'scout_credit');
  await captureApplicationsTrail(page, folder, 'scout_credit');
}

async function captureManagedScout(page, context) {
  const folder = 'service-managed-scout';
  await captureServiceDashboardStep(page, folder);
  await page.goto('https://ws-jobshare.com/business/scout/managed', { waitUntil: 'domcontentloaded' });
  await waitScoutPageReady(page).catch(() => {});
  if (!(await page.locator('.scout-workspace-filters').first().isVisible().catch(() => false))) {
    await enterScoutFromOnboarding(page, folder, '/business/scout/managed');
  } else {
    await shot(page, `${folder}/step-02-workspace-da-vao-truoc-do.png`);
  }
  const detail = await openFirstScoutCandidateTab(context, page, folder, 'step-06');
  const delegateBtn = detail.getByRole('button', {
    name: /Ủy thác WS|WSに委託|WSに接触を委託|Delegate to WS|Recommend/i,
  }).first();
  if (await delegateBtn.isVisible().catch(() => false)) {
    await delegateBtn.scrollIntoViewIfNeeded();
    await delegateBtn.click();
    await detail.waitForTimeout(700);
    await shot(detail, `${folder}/step-07-modal-uy-thac-ws-scout.png`);
    await dismissOverlay(detail);
  }
  await detail.close().catch(() => {});
  await captureUnlockedCandidatesTrail(page, context, folder, 'scout_performance');
  await captureApplicationsTrail(page, folder, 'scout_performance');
  await captureManagedWsMessagesTrail(page, folder);
}

async function captureBranding(page) {
  const folder = 'service-employer-branding';
  await captureServiceDashboardStep(page, folder);
  await page.goto('https://ws-jobshare.com/business/saiyo', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, `${folder}/step-02-trang-saiyo-goi-dich-vu.png`);

  const requestBtn = page.getByRole('button', { name: /Gửi yêu cầu dịch vụ|サービスを依頼|Request service/i }).first();
  if (await requestBtn.isVisible().catch(() => false)) {
    await requestBtn.scrollIntoViewIfNeeded();
    await requestBtn.click();
    await page.waitForTimeout(800);
    const dialog = page.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (await dialog.isVisible().catch(() => false)) {
      await shot(page, `${folder}/step-03-modal-yeu-cau-dich-vu.png`);
      await dismissOverlay(page);
    }
  }

  const freeLp = page.getByRole('button', { name: /Tạo Landing Page có sẵn|既存LPを作成|ready-made landing/i }).first();
  if (await freeLp.isVisible().catch(() => false)) {
    await freeLp.scrollIntoViewIfNeeded();
    await freeLp.click();
    await page.waitForTimeout(900);
    await shot(page, `${folder}/step-04-panel-tao-lp-mien-phi.png`);
    await dismissOverlay(page);
  }

  await page.goto('https://ws-jobshare.com/business/saiyo/landing-pages', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await shot(page, `${folder}/step-05-quan-ly-landing-pages.png`);
}

async function capturePartnerMarket(page) {
  const folder = 'service-partner-market';
  await captureServiceDashboardStep(page, folder);
  await page.goto('https://ws-jobshare.com/business/candidate-sharing', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  if (await page.locator('.ctv-marketplace-dashboard').first().isVisible().catch(() => false)) {
    await shot(page, `${folder}/step-02-dashboard-quan-ly-san.png`);
  } else {
    await shot(page, `${folder}/step-02-onboarding-san-partner.png`);
    const post = page.getByRole('button', { name: /Đăng JD lên Sàn CTV|採用パートナーマーケットにJD掲載|Post job to Collaborator/i }).first();
    if (await post.isVisible().catch(() => false)) {
      await post.click();
      await page.waitForTimeout(800);
      await page.locator('[role="dialog"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      await shot(page, `${folder}/step-03-modal-dang-jd-len-san.png`);
      await dismissOverlay(page);
    }
    const manage = page.getByRole('button', { name: /Vào quản lý Sàn CTV|マーケット管理へ|Open marketplace dashboard/i }).first();
    if (await manage.isVisible().catch(() => false)) {
      await manage.click();
    } else {
      await page.goto('https://ws-jobshare.com/business/candidate-sharing?view=dashboard', {
        waitUntil: 'domcontentloaded',
      });
    }
    await page.waitForTimeout(2000);
  }

  await page.locator('.ctv-marketplace-dashboard').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  await shot(page, `${folder}/step-04-dashboard-tab-jd-va-kpi.png`);

  const postHeader = page.getByRole('button', { name: /Đăng JD lên Sàn CTV|マーケットに掲載|Post job to marketplace/i }).first();
  if (await postHeader.isVisible().catch(() => false)) {
    await postHeader.click();
    await page.waitForTimeout(700);
    await shot(page, `${folder}/step-05-modal-dang-jd-tu-dashboard.png`);
    await dismissOverlay(page);
  }

  const jobRow = page.locator('.ctv-marketplace-table-ui tbody tr[role="button"]').first();
  if (await jobRow.isVisible().catch(() => false)) {
    await jobRow.scrollIntoViewIfNeeded();
    await shot(page, `${folder}/step-06-chon-jd-tren-bang.png`);
    await jobRow.click();
    await page.waitForURL(/candidate-sharing\/jobs\//, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await shot(page, `${folder}/step-07-chi-tiet-jd-tren-san.png`);
  }
}

async function capturePayment(page) {
  const payLink = page.getByRole('link', { name: '支払い管理' }).first();
  if (await payLink.isVisible().catch(() => false)) {
    await payLink.click();
    await page.waitForTimeout(1500);
    await shot(page, 'payment-referral/business/step-01-sidebar-thanh-toan.png');
  }
  await page.goto('https://ws-jobshare.com/business/billing', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot(page, 'payment-referral/business/step-02-danh-sach-thanh-toan.png');
  const detail = page.locator('button').filter({ hasText: '詳細を見る' }).first();
  if (await detail.isVisible().catch(() => false)) {
    await detail.click({ force: true });
    await page.waitForTimeout(1200);
    await shot(page, 'payment-referral/business/step-03-chi-tiet-hoa-don.png');
  }
}

async function captureAdminCredit(page) {
  await page.goto(ADMIN.loginUrl, { waitUntil: 'domcontentloaded' });
  await shot(page, 'credit-topup/admin/step-01-trang-dang-nhap.png');
  await loginAdmin(page);
  await shot(page, 'credit-topup/admin/step-02-sau-dang-nhap-dashboard.png');
  await page.goto('https://admin.ws-jobshare.com/admin/business-credit-requests', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(2000);
  await shot(page, 'credit-topup/admin/step-03-menu-nap-credit-danh-sach.png');
  await page.getByRole('combobox').first().selectOption('pending').catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, 'credit-topup/admin/step-04-loc-cho-duyet.png');
}

async function captureAdminPayment(page) {
  await page.goto('https://admin.ws-jobshare.com/admin/payments', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot(page, 'payment-referral/admin/step-01-tab-cong-tac-vien.png');
  await page.getByRole('button', { name: 'Doanh nghiệp' }).click();
  await page.waitForURL('**/payments?tab=business**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await shot(page, 'payment-referral/admin/step-02-tab-doanh-nghiep.png');
  const confirm = page.getByRole('button', { name: /Xác nhận hoàn tất/i }).first();
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.scrollIntoViewIfNeeded();
    await shot(page, 'payment-referral/admin/step-03-the-xac-nhan-hoan-tat.png');
  }
}

const FLOW_KEYS = {
  credit: captureCreditTopup,
  'scout-direct': (page, ctx) => captureDirectScout(page, ctx),
  'scout-managed': (page, ctx) => captureManagedScout(page, ctx),
  branding: (page, ctx) => captureBranding(page),
  partner: (page, ctx) => capturePartnerMarket(page),
  payment: (page) => capturePayment(page),
  'admin-credit': (page) => captureAdminCredit(page),
  'admin-payment': (page) => captureAdminPayment(page),
};

function parseOnlyArg() {
  const flag = process.argv.find((a) => a.startsWith('--only='));
  if (!flag) return null;
  return flag.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const only = parseOnlyArg();
  const headless = process.env.QA_HEADED !== '1';
  const browser = await chromium.launch({
    headless,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  const page = await context.newPage();

  const defaultOrder = [
    'credit',
    'scout-direct',
    'scout-managed',
    'branding',
    'partner',
    'payment',
    'admin-credit',
    'admin-payment',
  ];
  const order = only?.length ? only.filter((k) => FLOW_KEYS[k]) : defaultOrder;
  if (only?.length && order.length === 0) {
    console.error('Không có flow hợp lệ. Dùng: --only=scout-direct,scout-managed,branding,partner');
    process.exit(1);
  }

  try {
    const needsBiz = order.some((k) =>
      ['scout-direct', 'scout-managed', 'branding', 'partner', 'payment', 'credit'].includes(k),
    );
    if (needsBiz && !order.includes('credit')) {
      await ensureBusinessLoggedIn(page);
    }
    for (const key of order) {
      console.log('\n--- flow:', key, '---');
      await FLOW_KEYS[key](page, context);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
