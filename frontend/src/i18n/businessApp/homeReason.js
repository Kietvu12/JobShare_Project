import reasonImage1 from '../../assets/reason/For (1).png'
import reasonImage2 from '../../assets/reason/For (2).png'
import reasonImage3 from '../../assets/reason/For (3).png'

const REASON_IMAGES = [reasonImage1, reasonImage2, reasonImage3]

const BUTTON_CLASS_NAMES = ['reason_1_contact', 'reason_2_contact', 'reason_3_contact']

export const homeReasonI18n = {
  vi: {
    titlePrefix: 'JobShare Business — ',
    titleHighlight: 'lý do được chọn',
    consultBtn: 'Tư vấn miễn phí',
    items: [
      {
        subjectLines: [
          { text: 'Chọn phương thức tuyển dụng linh hoạt', highlight: true },
          { text: 'theo nhu cầu doanh nghiệp', highlight: true },
          { text: 'Chỉ dùng dịch vụ cần thiết,', highlight: false },
          { text: 'xây dựng quy trình tuyển dụng phù hợp.', highlight: false },
        ],
        desc:
          'JobShare Business gom nhiều dịch vụ tuyển dụng trên một nền tảng — tự tuyển hay ủy thác đều được. Chọn đúng gói để tiết kiệm chi phí và tuyển hiệu quả hơn.',
      },
      {
        subjectLines: [
          { text: 'AI hỗ trợ tuyển dụng', highlight: true },
          { text: 'giảm tải cho HR', highlight: true },
          { text: 'Từ tạo JD đến lọc ứng viên,', highlight: false },
          { text: 'AI đồng hành cùng team.', highlight: false },
        ],
        desc:
          'Tạo và tối ưu JD nhanh hơn với AI, hỗ trợ matching và trang tuyển dụng. HR tập trung vào phỏng vấn và chăm sóc ứng viên.',
      },
      {
        subjectLines: [
          { text: 'Chuyên viên đồng hành', highlight: true },
          { text: 'tuyển dụng an tâm hơn', highlight: true },
          { text: 'Từ triển khai đến thành công,', highlight: false },
          { text: 'Workstation hỗ trợ liên tục.', highlight: false },
        ],
        desc:
          'Đội ngũ hỗ trợ theo sát tiến độ, trả lời qua chat và hỗ trợ ứng viên. Dữ liệu doanh nghiệp và ứng viên được quản lý an toàn.',
      },
    ],
  },
  en: {
    titlePrefix: 'Why ',
    titleHighlight: 'JobShare Business',
    consultBtn: 'Free consultation',
    items: [
      {
        subjectLines: [
          { text: 'Choose the hiring approach', highlight: true },
          { text: 'that fits your needs', highlight: true },
          { text: 'Combine only the services you need', highlight: false },
          { text: 'and build the right hiring setup.', highlight: false },
        ],
        desc:
          'JobShare Business brings multiple hiring services onto one platform — self-serve or outsourced. Pick what you need to save cost and hire more efficiently.',
      },
      {
        subjectLines: [
          { text: 'AI supports hiring workflows', highlight: true },
          { text: 'and cuts recruiter workload', highlight: true },
          { text: 'From JD creation to shortlisting,', highlight: false },
          { text: 'AI helps across the process.', highlight: false },
        ],
        desc:
          'Create and refine job descriptions faster with AI, plus matching and careers page support. Recruiters can focus on interviews and candidate care.',
      },
      {
        subjectLines: [
          { text: 'Dedicated staff stay with you', highlight: true },
          { text: 'for peace of mind', highlight: true },
          { text: 'From rollout to successful hires,', highlight: false },
          { text: 'Workstation supports you throughout.', highlight: false },
        ],
        desc:
          'Support teams track your progress, respond via chat, and help with candidates. Company and candidate data are managed securely.',
      },
    ],
  },
  ja: {
    titlePrefix: 'JobShare Businessが',
    titleHighlight: '選ばれる理由',
    consultBtn: '無料相談する',
    items: [
      {
        subjectLines: [
          { text: '採用課題に合わせて', highlight: true },
          { text: '最適な採用方法を自由に選べる', highlight: true },
          { text: '必要なサービスだけを組み合わせて、', highlight: false },
          { text: '自社に合った採用体制を実現。', highlight: false },
        ],
        desc:
          'JobShare Businessでは、企業ごとの採用課題や社内体制に合わせて、複数の採用支援サービスを一つのプラットフォーム上でご利用いただけます。自社で積極的に採用を進めたい企業から、採用業務を専門スタッフへ任せたい企業まで、目的に応じた最適な採用方法を柔軟に選択できます。必要なサービスだけを利用できるため、無駄なコストを抑えながら、効率的な採用活動を実現します。',
      },
      {
        subjectLines: [
          { text: 'AIが採用業務をサポート', highlight: true },
          { text: '採用担当者の工数を大幅削減', highlight: true },
          { text: '求人票作成から候補者選定まで、', highlight: false },
          { text: 'AIが採用業務をサポート。', highlight: false },
        ],
        desc:
          'AIチャットを活用することで、求人票の作成や内容のブラッシュアップを短時間で行えます。さらに、候補者とのマッチングや採用ページの作成支援など、採用活動全体をAIがサポートします。採用担当者は、応募者対応や面接など本来注力すべき業務に集中できます。',
      },
      {
        subjectLines: [
          { text: '専任スタッフが伴走', highlight: true },
          { text: '安心して採用を進められる', highlight: true },
          { text: '導入から採用成功まで、', highlight: false },
          { text: 'Workstationが継続してサポート。', highlight: false },
        ],
        desc:
          'JobShare Businessでは、専任スタッフが企業ごとの採用状況に合わせて継続的にサポートします。チャットによる迅速な対応や、採用状況の共有、候補者対応まで一貫して支援します。また、企業情報・候補者情報は安全に管理され、安心してご利用いただける環境を提供しています。',
      },
    ],
  },
}

export function getHomeReasonCopy(language) {
  return homeReasonI18n[language] || homeReasonI18n.vi
}

export function getReasonItems(language) {
  const copy = getHomeReasonCopy(language)

  return copy.items.map((item, index) => ({
    num: String(index + 1).padStart(2, '0'),
    subjectLines: item.subjectLines,
    desc: item.desc,
    buttons: [
      {
        href: '/contact',
        label: copy.consultBtn,
        className: BUTTON_CLASS_NAMES[index],
      },
    ],
    image: REASON_IMAGES[index],
  }))
}
