/** Messages page strings */

export const messagesI18n = {
  vi: {
    wsViews: {
      chat: 'Trò chuyện',
      credit: 'Yêu cầu credit',
      creditHistory: 'Lịch sử yêu cầu',
    },
    search: {
      ws: 'Tìm cuộc trò chuyện WS...',
      ctv: 'Tìm CTV, ứng viên, JD...',
    },
    statusDiscussing: 'Đang trao đổi',
    parties: {
      company: 'Doanh nghiệp (Bạn)',
      companySub: 'HR / Recruiter',
      you: 'Bạn',
      ctvSub: 'CTV tuyển dụng',
    },
    candidate: 'Ứng viên:',
    position: 'Vị trí:',
    chatThreeWay: 'Chat 3 bên',
    loadingNominations: 'Đang tải đơn tiến cử...',
    selectNomination: 'Chọn đơn tiến cử để trao đổi với CTV và WS',
    infoCards: {
      wsSupport: 'Hỗ trợ WS',
      creditRequest: 'Yêu cầu nạp credit',
      currentChat: 'Cuộc trò chuyện hiện tại',
      nominationInfo: 'Thông tin đơn tiến cử',
      candidateInfo: 'Thông tin ứng viên',
      jdInfo: 'Thông tin JD',
      ctvInfo: 'Thông tin CTV',
      rewardInfo: 'Thông tin thưởng',
    },
    marketplaceSource: 'Sàn CTV',
    fullProfileAccess: 'Hồ sơ đầy đủ (tiến cử Sàn CTV)',
    fullProfileHint: 'Doanh nghiệp xem được hồ sơ nhờ tiến cử Sàn CTV. Trên Scout vẫn hiển thị khóa cho đến khi mở bằng credit.',
  },
  en: {
    wsViews: {
      chat: 'Chat',
      credit: 'Credit requests',
      creditHistory: 'Request history',
    },
    search: {
      ws: 'Search WS conversations...',
      ctv: 'Search CTV, candidate, JD...',
    },
    statusDiscussing: 'In discussion',
    parties: {
      company: 'Company (You)',
      companySub: 'HR / Recruiter',
      you: 'You',
      ctvSub: 'Recruiting CTV',
    },
    candidate: 'Candidate:',
    position: 'Role:',
    chatThreeWay: '3-way chat',
    loadingNominations: 'Loading nominations...',
    selectNomination: 'Select a nomination to chat with CTV and WS',
    infoCards: {
      wsSupport: 'WS support',
      creditRequest: 'Top-up request',
      currentChat: 'Current conversation',
      nominationInfo: 'Nomination details',
      candidateInfo: 'Candidate info',
      jdInfo: 'JD info',
      ctvInfo: 'CTV info',
      rewardInfo: 'Reward info',
    },
    marketplaceSource: 'CTV Marketplace',
    fullProfileAccess: 'Full profile (CTV Marketplace nomination)',
    fullProfileHint: 'You can view the full profile via CTV Marketplace nomination. On Scout it stays locked until unlocked with credits.',
  },
  ja: {
    wsViews: {
      chat: 'チャット',
      credit: 'クレジットリクエスト',
      creditHistory: 'リクエスト履歴',
    },
    search: {
      ws: 'WSチャットを検索...',
      ctv: 'CTV、候補者、JDを検索...',
    },
    statusDiscussing: 'やり取り中',
    parties: {
      company: '企業（あなた）',
      companySub: 'HR / Recruiter',
      you: 'あなた',
      ctvSub: '採用CTV',
    },
    candidate: '候補者:',
    position: 'ポジション:',
    chatThreeWay: '3者チャット',
    loadingNominations: '推薦を読み込み中...',
    selectNomination: '推薦を選択してCTV・WSとやり取り',
    infoCards: {
      wsSupport: 'WSサポート',
      creditRequest: 'クレジットチャージ依頼',
      currentChat: '現在の会話',
      nominationInfo: '推薦情報',
      candidateInfo: '候補者情報',
      jdInfo: 'JD情報',
      ctvInfo: 'CTV情報',
      rewardInfo: '報酬情報',
    },
    marketplaceSource: 'CTVマーケット',
    fullProfileAccess: 'フルプロフィール（CTVマーケット推薦）',
    fullProfileHint: 'CTVマーケット推薦によりフルプロフィールを閲覧できます。Scoutではクレジット開示までロック表示されます。',
  },
};

export function getMessageWsViews(language) {
  const v = messagesI18n[language]?.wsViews || messagesI18n.vi.wsViews;
  return [
    { key: 'chat', labelKey: 'chat' },
    { key: 'credit', labelKey: 'credit' },
    { key: 'credit-history', labelKey: 'creditHistory' },
  ].map(({ key, labelKey }) => ({ key, label: v[labelKey] }));
}
