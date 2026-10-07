const TITLE_MAP = {
  'Đơn tiến cử mới': {
    en: 'New nomination',
    ja: '新しい推薦'
  },
  'Cập nhật trạng thái đơn tiến cử': {
    en: 'Nomination status updated',
    ja: '推薦ステータス更新'
  },
  'Tin nhắn mới': {
    en: 'New message',
    ja: '新着メッセージ'
  },
  'Thanh toán hoàn tất': {
    en: 'Payment completed',
    ja: '支払い完了'
  },
  'Đơn thanh toán được phê duyệt': {
    en: 'Payment request approved',
    ja: '支払い申請が承認されました'
  },
  'Yêu cầu nạp credit đã được duyệt': {
    en: 'Credit top-up approved',
    ja: 'クレジットチャージが承認されました'
  },
  'Yêu cầu nạp credit mới': {
    en: 'New credit top-up request',
    ja: '新しいクレジットチャージ申請'
  },
  'Yêu cầu nạp credit bị từ chối': {
    en: 'Credit top-up rejected',
    ja: 'クレジットチャージが却下されました'
  },
  'Job đã được duyệt trên Sàn CTV': {
    en: 'Job approved on CTV Marketplace',
    ja: 'CTVマーケットでジョブが承認されました',
  },
  'Job đã được WS duyệt trên Sàn CTV': {
    en: 'Job approved on CTV Marketplace',
    ja: 'CTVマーケットでジョブが承認されました',
  },
  'Job bị từ chối trên Sàn CTV': {
    en: 'Job rejected on CTV Marketplace',
    ja: 'CTVマーケットでジョブが却下されました',
  },
  'Yêu cầu thanh toán phí giới thiệu': {
    en: 'Referral fee payment request',
    ja: '紹介手数料の支払い依頼',
  },
  'Scout Performance — có gợi ý mới': {
    en: 'Omakase Scout — new recommendations',
    ja: 'おまかせスカウト — 新しい提案',
  },
  'Đơn tiến cử được phê duyệt': {
    en: 'Nomination approved',
    ja: '推薦が承認されました',
  },
  'Job Sàn CTV chờ duyệt': {
    en: 'CTV Marketplace job pending approval',
    ja: 'CTVマーケット掲載が承認待ち'
  },
  'Yêu cầu đăng Sàn CTV bị từ chối': {
    en: 'CTV Marketplace listing rejected',
    ja: 'CTVマーケット掲載が却下されました'
  },
  'Yêu cầu Saiyo Branding mới': {
    en: 'New Saiyo Branding request',
    ja: '新しいSaiyo Branding申請'
  },
  'Tin nhắn Scout Performance mới': {
    en: 'New Omakase Scout message',
    ja: 'おまかせスカウトの新着メッセージ'
  },
  'Scout Performance — có hồ sơ mới': {
    en: 'Omakase Scout — new profile',
    ja: 'おまかせスカウト — 新しい候補者'
  },
  'Scout Performance — yêu cầu bị từ chối': {
    en: 'Omakase Scout — request rejected',
    ja: 'おまかせスカウト — 申請が却下されました'
  }
};

const CONTENT_PATTERNS = [
  {
    regex: /^(.+) đã tiến cử hồ sơ (.+) cho JD (.+)\.$/u,
    en: (ctv, candidate, jd) => `${ctv} nominated candidate ${candidate} for job ${jd}.`,
    ja: (ctv, candidate, jd) => `${ctv}が候補者${candidate}をJD ${jd}に推薦しました。`,
  },
  {
    regex: /^(.+) gửi tin nhắn mới về đơn tiến cử (.+)\.$/u,
    en: (sender, code) => `${sender} sent a new message about nomination ${code}.`,
    ja: (sender, code) => `${sender}が推薦${code}について新しいメッセージを送信しました。`,
  },
  {
    regex: /^JD "(.+)" đã được WS duyệt và đăng lên Sàn CTV\.$/u,
    en: (title) => `Job "${title}" was approved by WS and published on the CTV Marketplace.`,
    ja: (title) => `JD「${title}」がWSにより承認され、CTVマーケットに掲載されました。`,
  },
  {
    regex: /^JD "(.+)" chưa được duyệt lên Sàn CTV\.(.*)$/u,
    en: (title, suffix) => {
      const reason = String(suffix || '').replace(/^\s*Lý do:\s*/u, '').trim();
      return reason
        ? `Job "${title}" was not approved for the CTV Marketplace. Reason: ${reason}`
        : `Job "${title}" was not approved for the CTV Marketplace.`;
    },
    ja: (title, suffix) => {
      const reason = String(suffix || '').replace(/^\s*Lý do:\s*/u, '').trim();
      return reason
        ? `JD「${title}」はCTVマーケットに承認されませんでした。理由：${reason}`
        : `JD「${title}」はCTVマーケットに承認されませんでした。`;
    },
  },
  {
    regex: /^WS đã tạo yêu cầu thanh toán phí giới thiệu ([\d.,\s]+VNĐ) cho đơn tiến cử (.+) — (.+)\.$/u,
    en: (amount, code, candidate) =>
      `WS created a referral fee payment request for ${amount} for nomination ${code} — ${candidate}.`,
    ja: (amount, code, candidate) =>
      `WSが推薦${code}（${candidate}）の紹介手数料支払い依頼${amount}を作成しました。`,
  },
  {
    regex: /^WS đã tạo yêu cầu thanh toán phí giới thiệu cho đơn tiến cử (.+) — (.+)\.$/u,
    en: (code, candidate) =>
      `WS created a referral fee payment request for nomination ${code} — ${candidate}.`,
    ja: (code, candidate) =>
      `WSが推薦${code}（${candidate}）の紹介手数料支払い依頼を作成しました。`,
  },
  {
    regex: /^JobShare WS đã chuẩn bị (.+) cho (.+)\. Bấm để xem chi tiết\.$/u,
    en: (summary, company) => `JobShare WS prepared ${summary} for ${company}. Tap to view details.`,
    ja: (summary, company) => `JobShare WSが${company}向けに${summary}を用意しました。タップして詳細を表示。`,
  },
  {
    regex: /^JobShare WS đã gửi (\d+) hồ sơ ứng viên trong cuộc trò chuyện Scout Performance\.$/u,
    en: (count) => `JobShare WS sent ${count} candidate profile(s) in the Omakase Scout chat.`,
    ja: (count) => `JobShare WSがおまかせスカウトチャットで候補者プロフィール${count}件を送信しました。`,
  },
  {
    regex: /^(.+) gửi tin nhắn trong cuộc trò chuyện Scout Performance\.$/u,
    en: (name) => `${name} sent a message in the Omakase Scout chat.`,
    ja: (name) => `${name}がおまかせスカウトチャットでメッセージを送信しました。`,
  },
  {
    regex: /^JobShare WS đã từ chối yêu cầu Scout Performance\.$/u,
    en: () => 'JobShare WS rejected the Omakase Scout request.',
    ja: () => 'JobShare WSがおまかせスカウトの依頼を却下しました。',
  },
  {
    regex: /^JobShare WS đã từ chối yêu cầu đăng job lên Sàn CTV\.$/u,
    en: () => 'JobShare WS rejected the request to list the job on the CTV Marketplace.',
    ja: () => 'JobShare WSがCTVマーケットへのジョブ掲載依頼を却下しました。',
  },
  {
    regex: /^Job(?: "([^"]+)")? đã được publish lên Sàn HR Partner\.$/u,
    en: (title) =>
      title
        ? `Job "${title}" has been published on the HR Partner Marketplace.`
        : 'Job has been published on the HR Partner Marketplace.',
    ja: (title) =>
      title
        ? `ジョブ「${title}」がHR Partnerマーケットに公開されました。`
        : 'ジョブがHR Partnerマーケットに公開されました。',
  },
  {
    regex: /^Đơn tiến cử (.+) cho hồ sơ (.+) đã được admin phê duyệt$/u,
    en: (code, candidate) => `Nomination ${code} for candidate ${candidate} was approved by admin.`,
    ja: (code, candidate) => `候補者${candidate}の推薦${code}が管理者により承認されました。`,
  },
  {
    regex: /^Đơn tiến cử (.+) đã được cập nhật trạng thái$/u,
    en: (code) => `Nomination ${code} status was updated.`,
    ja: (code) => `推薦${code}のステータスが更新されました。`,
  },
  {
    regex: /^Hồ sơ (.+) đã vào công ty - đơn tiến cử (.+?)(?: ngày (.+))?\. Bạn có thể gửi yêu cầu thanh toán trong phần chat đơn tiến cử\.$/u,
    en: (candidate, code, date) =>
      `Candidate ${candidate} joined the company — nomination ${code}${date ? ` on ${date}` : ''}. You can submit a payment request in the nomination chat.`,
    ja: (candidate, code, date) =>
      `候補者${candidate}が入社しました — 推薦${code}${date ? `（${date}）` : ''}。推薦チャットから支払い依頼を送信できます。`,
  },
  {
    regex: /^Hồ sơ (.+) đã được tạo đơn tiến cử hộ - đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} was nominated by admin - nomination ${b}`,
    ja: (a, b) => `候補者${a}は管理者により推薦されました - 推薦${b}`
  },
  {
    regex: /^Hồ sơ (.+) đã được tiến cử thành công - đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} was successfully nominated - nomination ${b}`,
    ja: (a, b) => `候補者${a}の推薦が完了しました - 推薦${b}`
  },
  {
    regex: /^Hồ sơ (.+) đã có lịch phỏng vấn đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} has an interview schedule for nomination ${b}`,
    ja: (a, b) => `候補者${a}の推薦${b}に面接日程が設定されました`
  },
  {
    regex: /^Hồ sơ (.+) đã trượt tại đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} was rejected for nomination ${b}`,
    ja: (a, b) => `候補者${a}は推薦${b}で不採用となりました`
  },
  {
    regex: /^Hồ sơ (.+) đã có thông báo trúng tuyển tại đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} received an offer for nomination ${b}`,
    ja: (a, b) => `候補者${a}に推薦${b}の内定通知がありました`
  },
  {
    regex: /^Hồ sơ (.+) đã xác nhận thông báo trúng tuyển tại đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} confirmed the offer for nomination ${b}`,
    ja: (a, b) => `候補者${a}は推薦${b}の内定を承諾しました`
  },
  {
    regex: /^Hồ sơ (.+) đã từ chối nhận việc tại đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} declined the offer for nomination ${b}`,
    ja: (a, b) => `候補者${a}は推薦${b}の内定を辞退しました`
  },
  {
    regex: /^Hồ sơ (.+) đã vào công ty - đơn tiến cử (.+?)(?: ngày (.+))?\.?$/u,
    en: (a, b, c) => `Candidate ${a} joined the company - nomination ${b}${c ? ` on ${c}` : ''}`,
    ja: (a, b, c) => `候補者${a}が入社しました - 推薦${b}${c ? `（${c}）` : ''}`,
  },
  {
    regex: /^Hồ sơ (.+) đã hủy giữa chừng tại đơn tiến cử (.+)$/u,
    en: (a, b) => `Candidate ${a} withdrew midway for nomination ${b}`,
    ja: (a, b) => `候補者${a}は推薦${b}を途中辞退しました`
  },
  {
    regex: /^Bạn đã được thanh toán phí giới thiệu với hồ sơ (.+) - đơn tiến cử (.+)$/u,
    en: (a, b) => `You have been paid referral fee for candidate ${a} - nomination ${b}`,
    ja: (a, b) => `候補者${a}の推薦${b}に対する紹介手数料が支払われました`
  },
  {
    regex: /^Đơn thanh toán của bạn đã được phê duyệt với hồ sơ (.+) - đơn tiến cử (.+)$/u,
    en: (a, b) => `Your payment request was approved for candidate ${a} - nomination ${b}`,
    ja: (a, b) => `候補者${a}の推薦${b}に対する支払い申請が承認されました`
  },
  {
    regex: /^Bạn có tin nhắn mới về đơn tiến cử (.+)$/u,
    en: (a) => `You have a new message for nomination ${a}`,
    ja: (a) => `推薦${a}に新しいメッセージがあります`
  },
  {
    regex: /^WS đã duyệt và cộng (.+) vào tài khoản của bạn\.$/u,
    en: (a) => `WS approved and added ${a} to your account.`,
    ja: (a) => `WSが承認し、${a}をアカウントに追加しました。`
  },
  {
    regex: /^WS đã từ chối yêu cầu nạp credit( \(.+\))?\.$/u,
    en: (_, code) => `WS rejected the credit top-up request${code || ''}.`,
    ja: (_, code) => `WSがクレジットチャージ申請を却下しました${code || ''}。`
  },
  {
    regex: /^Job "([^"]+)" đã được publish lên Sàn HR Partner\.$/u,
    en: (a) => `Job "${a}" has been published on the HR Partner Marketplace.`,
    ja: (a) => `ジョブ「${a}」がHR Partnerマーケットに公開されました。`
  },
  {
    regex: /^Job đã được publish lên Sàn HR Partner\.$/u,
    en: () => 'Job has been published on the HR Partner Marketplace.',
    ja: () => 'ジョブがHR Partnerマーケットに公開されました。'
  },
  {
    regex: /^Doanh nghiệp đã hủy yêu cầu nạp credit đang chờ duyệt\.$/u,
    en: () => 'Business cancelled the pending credit top-up request.',
    ja: () => '企業が承認待ちのクレジットチャージ申請をキャンセルしました。'
  }
];

export function localizeNotificationTitle(rawTitle, language) {
  if (!rawTitle || language === 'vi') return rawTitle || '';
  const mapped = TITLE_MAP[rawTitle];
  if (!mapped) return rawTitle;
  return mapped[language] || rawTitle;
}

export function localizeNotificationContent(rawContent, language) {
  if (!rawContent || language === 'vi') return rawContent || '';

  for (const p of CONTENT_PATTERNS) {
    const m = rawContent.match(p.regex);
    if (m) {
      const args = m.slice(1);
      const fn = p[language];
      if (typeof fn === 'function') {
        return fn(...args);
      }
      break;
    }
  }
  return rawContent;
}

export function localizeNotification(notification, language) {
  const title = localizeNotificationTitle(notification?.title || '', language);
  const content = localizeNotificationContent(notification?.content || '', language);
  return { title, content };
}
