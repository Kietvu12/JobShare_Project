/** JD AI builder page & panel strings */

export const jdBuilderI18n = {
  vi: {
    breadcrumb: 'Quản lý JD',
    createTitle: 'Tạo JD mới với AI',
    editTitle: 'Chỉnh sửa JD với AI',
    editTitleWithName: (name) => `Chỉnh sửa: ${name}`,
    pageSubtitle: 'Chat với AI để tạo JD hoặc chỉnh sửa nội dung theo nhu cầu của bạn.',
    back: 'Quay lại',
    defaultTitle: 'JD mới',
    defaultCompany: 'Doanh nghiệp',
    marketplaceSubmitting: 'Đang gửi WS duyệt đưa job lên sàn CTV...',
    marketplaceHint: 'Tạo & lưu JD bằng chat — sau khi lưu, hệ thống tự gửi WS duyệt đưa job lên sàn.',
    marketplaceSaveError: 'JD đã lưu nhưng không gửi được yêu cầu lên sàn. Bạn có thể thử lại tại Sàn CTV.',
    panel: {
      createHeading: 'Tạo JD với AI',
      editHeading: 'Chỉnh sửa JD với AI',
      createSubheading: 'Chat với AI và xem trước template JD',
      editSubheading: 'Chỉnh sửa nội dung qua chat và template JD',
      viewJobDetail: 'Xem chi tiết job',
      chatTab: 'Chat',
      templateTab: 'Template',
      statusLabel: 'Trạng thái',
      statusAria: 'Trạng thái job',
      saveCreate: 'Lưu job',
      saveUpdate: 'Cập nhật JD',
      greetingCreate: 'Bắt đầu từ đâu?',
      greetingEdit: 'Tiếp tục chỉnh sửa',
      greetingBodyCreate: 'Mô tả vị trí cần tuyển, dán JD gốc hoặc trả lời câu hỏi của AI. JD được cập nhật trực tiếp ở cột template bên cạnh.',
      greetingBodyEdit: 'Mô tả thay đổi cần cập nhật hoặc chỉnh trực tiếp trên template bên cạnh.',
      uploadTitle: 'Tải file JD (PDF, DOC, DOCX)',
      sendTitle: 'Gửi tin nhắn (Enter)',
      inputPlaceholder: 'Mô tả vị trí cần tuyển...',
      languagePreviewHint: 'Xem bản dịch nội dung JD — không đổi ngôn ngữ giao diện',
      translateAi: 'Dịch bằng AI',
      saveDraft: 'Lưu nháp',
      previewJd: 'Xem trước',
      publishJob: 'Đăng tuyển',
      savedAt: (time) => `Đã lưu lúc ${time}`,
      savedDraft: 'Đã lưu nháp',
      starterPrompts: [
        { id: 'from-desc', label: 'Tạo JD từ mô tả', message: 'Tôi muốn tạo JD mới. Hãy hỏi tôi từng phần dựa trên mô tả vị trí tôi sẽ cung cấp.' },
        { id: 'upload', label: 'Tải JD cũ', action: 'upload' },
        { id: 'from-role', label: 'Tạo từ vị trí', message: 'Giúp tôi tạo JD cho vị trí: (tôi sẽ mô tả tên vị trí và yêu cầu chính)' },
        { id: 'step-by-step', label: 'AI hỏi tôi từng bước', message: 'Hãy hỏi tôi từng bước để hoàn thiện JD tuyển dụng.' },
      ],
      previewCreate: 'Xem trước JD',
      previewEdit: 'Template JD',
      formLanguageAria: 'Ngôn ngữ form',
      translateTitle: 'Dịch các ô nhập từ tab hiện tại sang 2 tab còn lại',
      translate: 'Dịch',
      translating: 'Đang dịch...',
      bootLoading: 'Đang khởi tạo trợ lý AI...',
      parsingFile: 'Đang phân tích file...',
      parseDone: 'Phân tích hoàn tất',
      parseFailed: 'Phân tích thất bại',
      jdFileFallback: 'JD file',
    },
    statusOptions: {
      0: 'Nháp',
      1: 'Đang đăng tuyển',
      2: 'Đã đóng',
      3: 'Hết hạn',
    },
    errors: {
      saveThread: 'Không lưu được phiên chat. Kiểm tra backend đang chạy.',
      startChat: 'Không thể bắt đầu phiên chat.',
      sendMessage: 'Gửi tin nhắn thất bại.',
      saveJob: 'Không thể lưu job',
      translate: 'Không dịch được dữ liệu.',
      parseFallback: 'Vui lòng thử lại với file PDF/DOC/DOCX khác.',
    },
    ai: {
      initialBrief: 'Xin chào, tôi muốn tạo JD tuyển dụng mới.',
    },
    messages: {
      uploaded: (fileLabel, sizeLabel) => `Đã tải lên: ${fileLabel}${sizeLabel ? ` (${sizeLabel})` : ''}`,
      parseSuccessWithTitle: (fileLabel, titleHint) =>
        `Đã phân tích JD thành công từ file "${fileLabel}".\nVị trí: ${titleHint}\nBấm Lưu job để lưu JD, chat và file gốc.`,
      parseSuccess: (fileLabel) =>
        `Đã phân tích JD thành công từ file "${fileLabel}".\nBấm Lưu job để lưu JD, chat và file gốc.`,
      parseError: (fileLabel, errMsg) =>
        `Không thể phân tích file "${fileLabel}".\n${errMsg}`,
    },
  },
  en: {
    breadcrumb: 'Job descriptions',
    createTitle: 'Create new JD with AI',
    editTitle: 'Edit JD with AI',
    editTitleWithName: (name) => `Edit: ${name}`,
    pageSubtitle: 'Chat with AI to create or refine your job description.',
    back: 'Go back',
    defaultTitle: 'New JD',
    defaultCompany: 'Company',
    marketplaceSubmitting: 'Submitting marketplace listing for WS approval...',
    marketplaceHint: 'Create & save JD via chat — after saving, the system submits to WS for marketplace listing.',
    marketplaceSaveError: 'JD saved but marketplace request failed. You can retry from CTV Marketplace.',
    panel: {
      createHeading: 'Create JD with AI',
      editHeading: 'Edit JD with AI',
      createSubheading: 'Chat with AI and preview the JD template',
      editSubheading: 'Edit content via chat and JD template',
      viewJobDetail: 'View job details',
      chatTab: 'Chat',
      templateTab: 'Template',
      statusLabel: 'Status',
      statusAria: 'Job status',
      saveCreate: 'Save job',
      saveUpdate: 'Update JD',
      greetingCreate: 'Where to start?',
      greetingEdit: 'Continue editing',
      greetingBodyCreate: 'Describe the role, paste an existing JD, or answer AI questions. Updates appear in the template column.',
      greetingBodyEdit: 'Describe changes to apply or edit directly in the template column.',
      uploadTitle: 'Upload JD file (PDF, DOC, DOCX)',
      sendTitle: 'Send message (Enter)',
      inputPlaceholder: 'Describe the role you are hiring for...',
      languagePreviewHint: 'Preview JD content in each language — does not change UI language',
      translateAi: 'Translate with AI',
      saveDraft: 'Save draft',
      previewJd: 'Preview',
      publishJob: 'Publish',
      savedAt: (time) => `Saved at ${time}`,
      savedDraft: 'Draft saved',
      starterPrompts: [
        { id: 'from-desc', label: 'Create from description', message: 'I want to create a new JD. Ask me step by step based on the role description I will provide.' },
        { id: 'upload', label: 'Upload existing JD', action: 'upload' },
        { id: 'from-role', label: 'Create from role title', message: 'Help me create a JD for this role: (I will describe the title and key requirements)' },
        { id: 'step-by-step', label: 'AI guides me step by step', message: 'Please ask me step by step to complete this job description.' },
      ],
      previewCreate: 'JD preview',
      previewEdit: 'JD template',
      formLanguageAria: 'Form language',
      translateTitle: 'Translate input fields from current tab to the other two tabs',
      translate: 'Translate',
      translating: 'Translating...',
      bootLoading: 'Starting AI assistant...',
      parsingFile: 'Parsing file...',
      parseDone: 'Parse complete',
      parseFailed: 'Parse failed',
      jdFileFallback: 'JD file',
    },
    statusOptions: {
      0: 'Draft',
      1: 'Open',
      2: 'Closed',
      3: 'Expired',
    },
    errors: {
      saveThread: 'Could not save chat session. Check that the backend is running.',
      startChat: 'Could not start chat session.',
      sendMessage: 'Failed to send message.',
      saveJob: 'Could not save job',
      translate: 'Could not translate data.',
      parseFallback: 'Please try again with a different PDF/DOC/DOCX file.',
    },
    ai: {
      initialBrief: 'Hello, I want to create a new job description.',
    },
    messages: {
      uploaded: (fileLabel, sizeLabel) => `Uploaded: ${fileLabel}${sizeLabel ? ` (${sizeLabel})` : ''}`,
      parseSuccessWithTitle: (fileLabel, titleHint) =>
        `Successfully parsed JD from "${fileLabel}".\nRole: ${titleHint}\nClick Save job to store the JD, chat, and original file.`,
      parseSuccess: (fileLabel) =>
        `Successfully parsed JD from "${fileLabel}".\nClick Save job to store the JD, chat, and original file.`,
      parseError: (fileLabel, errMsg) =>
        `Could not parse file "${fileLabel}".\n${errMsg}`,
    },
  },
  ja: {
    breadcrumb: 'JD管理',
    createTitle: 'AIで新規JD作成',
    editTitle: 'AIでJD編集',
    editTitleWithName: (name) => `編集: ${name}`,
    pageSubtitle: 'AIチャットで求人票を作成・編集します。',
    back: '戻る',
    defaultTitle: '新規JD',
    defaultCompany: '企業',
    marketplaceSubmitting: 'CTVマーケット掲載のWS承認を送信中...',
    marketplaceHint: 'チャットでJDを作成・保存 — 保存後、システムがWSにマーケット掲載を自動送信します。',
    marketplaceSaveError: 'JDは保存されましたがマーケット申請に失敗しました。CTVマーケットから再試行できます。',
    panel: {
      createHeading: 'AIでJD作成',
      editHeading: 'AIでJD編集',
      createSubheading: 'AIとチャットしJDテンプレートをプレビュー',
      editSubheading: 'チャットとJDテンプレートで内容を編集',
      viewJobDetail: '求人詳細を見る',
      chatTab: 'チャット',
      templateTab: 'テンプレート',
      statusLabel: 'ステータス',
      statusAria: '求人ステータス',
      saveCreate: 'JDを保存',
      saveUpdate: 'JDを更新',
      greetingCreate: 'どこから始めますか？',
      greetingEdit: '編集を続ける',
      greetingBodyCreate: '募集職種を説明するか、既存JDを貼り付けるか、AIの質問に答えてください。テンプレート列に反映されます。',
      greetingBodyEdit: '変更内容を説明するか、テンプレート列で直接編集してください。',
      uploadTitle: 'JDファイルをアップロード (PDF, DOC, DOCX)',
      sendTitle: '送信 (Enter)',
      inputPlaceholder: '募集する職種を説明...',
      languagePreviewHint: 'JD内容の言語プレビュー — UI言語は変わりません',
      translateAi: 'AIで翻訳',
      saveDraft: '下書き保存',
      previewJd: 'プレビュー',
      publishJob: '公開',
      savedAt: (time) => `${time} に保存`,
      savedDraft: '下書きを保存しました',
      starterPrompts: [
        { id: 'from-desc', label: '説明からJD作成', message: '新しいJDを作成したいです。提供する職種説明に基づいて段階的に質問してください。' },
        { id: 'upload', label: '既存JDをアップロード', action: 'upload' },
        { id: 'from-role', label: '職種から作成', message: '次の職種のJDを作成してください：（職名と主な要件を説明します）' },
        { id: 'step-by-step', label: 'AIが段階的に質問', message: 'JD完成のため、段階的に質問してください。' },
      ],
      previewCreate: 'JDプレビュー',
      previewEdit: 'JDテンプレート',
      formLanguageAria: 'フォーム言語',
      translateTitle: '現在のタブから他の2言語の入力欄を翻訳',
      translate: '翻訳',
      translating: '翻訳中...',
      bootLoading: 'AIアシスタントを起動中...',
      parsingFile: 'ファイルを解析中...',
      parseDone: '解析完了',
      parseFailed: '解析失敗',
      jdFileFallback: 'JDファイル',
    },
    statusOptions: {
      0: '下書き',
      1: '募集中',
      2: '終了',
      3: '期限切れ',
    },
    errors: {
      saveThread: 'チャットセッションを保存できません。バックエンドを確認してください。',
      startChat: 'チャットセッションを開始できません。',
      sendMessage: 'メッセージの送信に失敗しました。',
      saveJob: 'JDを保存できません',
      translate: 'データを翻訳できません。',
      parseFallback: '別のPDF/DOC/DOCXファイルで再試行してください。',
    },
    ai: {
      initialBrief: 'こんにちは、新しい求人票を作成したいです。',
    },
    messages: {
      uploaded: (fileLabel, sizeLabel) => `アップロード: ${fileLabel}${sizeLabel ? ` (${sizeLabel})` : ''}`,
      parseSuccessWithTitle: (fileLabel, titleHint) =>
        `ファイル「${fileLabel}」からJDを解析しました。\n職種: ${titleHint}\n「JDを保存」でJD・チャット・元ファイルを保存します。`,
      parseSuccess: (fileLabel) =>
        `ファイル「${fileLabel}」からJDを解析しました。\n「JDを保存」でJD・チャット・元ファイルを保存します。`,
      parseError: (fileLabel, errMsg) =>
        `ファイル「${fileLabel}」を解析できません。\n${errMsg}`,
    },
  },
};

export function getJdBuilderStatusOptions(language = 'vi') {
  const opts = jdBuilderI18n[language]?.statusOptions || jdBuilderI18n.vi.statusOptions;
  return Object.entries(opts).map(([value, label]) => ({ value, label }));
}

export function getLocalizedJobTitle(job, language = 'vi') {
  if (!job) return '';
  const vi = job.title || job.title_vi || '';
  const en = job.titleEn || job.title_en || '';
  const ja = job.titleJp || job.title_jp || '';
  const fallback = job.id != null ? `JD #${job.id}` : '';
  if (language === 'en') return en || vi || ja || fallback;
  if (language === 'ja') return ja || en || vi || fallback;
  return vi || en || ja || fallback;
}

export function getLocalizedTitleFromFields({ title, titleEn, titleJp }, language = 'vi') {
  return getLocalizedJobTitle({ title, titleEn, titleJp }, language);
}
