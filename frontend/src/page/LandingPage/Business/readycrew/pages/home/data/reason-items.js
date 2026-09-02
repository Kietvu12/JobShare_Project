import reasonImage1 from '../../../../../../../assets/reason/For (1).png'
import reasonImage2 from '../../../../../../../assets/reason/For (2).png'
import reasonImage3 from '../../../../../../../assets/reason/For (3).png'

export const ReasonItems = [
  {
    num: '01',
    subjectHtml:
      '<span class="c-text-red-4">採用課題に合わせて</span><br>\n\t\t\t\t\t\t\t<span class="c-text-red-4">最適な採用方法を自由に選べる</span><br>\n\t\t\t\t\t\t\t必要なサービスだけを組み合わせて、<br>\n\t\t\t\t\t\t\t自社に合った採用体制を実現。',
    desc: 'JobShare Businessでは、企業ごとの採用課題や社内体制に合わせて、複数の採用支援サービスを一つのプラットフォーム上でご利用いただけます。自社で積極的に採用を進めたい企業から、採用業務を専門スタッフへ任せたい企業まで、目的に応じた最適な採用方法を柔軟に選択できます。必要なサービスだけを利用できるため、無駄なコストを抑えながら、効率的な採用活動を実現します。',
    buttons: [{ href: '/contact', label: '無料相談する', className: 'reason_1_contact' }],
    image: reasonImage1,
  },
  {
    num: '02',
    subjectHtml:
      '<span class="c-text-red-4">AIが採用業務をサポート</span><br>\n\t\t\t\t\t\t\t<span class="c-text-red-4">採用担当者の工数を大幅削減</span><br>\n\t\t\t\t\t\t\t求人票作成から候補者選定まで、<br>\n\t\t\t\t\t\t\tAIが採用業務をサポート。',
    desc: 'AIチャットを活用することで、求人票の作成や内容のブラッシュアップを短時間で行えます。さらに、候補者とのマッチングや採用ページの作成支援など、採用活動全体をAIがサポートします。採用担当者は、応募者対応や面接など本来注力すべき業務に集中できます。',
    buttons: [{ href: '/contact', label: '無料相談する', className: 'reason_2_contact' }],
    image: reasonImage2,
  },
  {
    num: '03',
    subjectHtml:
      '<span class="c-text-red-4">専任スタッフが伴走</span><br>\n\t\t\t\t\t\t\t<span class="c-text-red-4">安心して採用を進められる</span><br>\n\t\t\t\t\t\t\t導入から採用成功まで、<br>\n\t\t\t\t\t\t\tWorkstationが継続してサポート。',
    desc: 'JobShare Businessでは、専任スタッフが企業ごとの採用状況に合わせて継続的にサポートします。チャットによる迅速な対応や、採用状況の共有、候補者対応まで一貫して支援します。また、企業情報・候補者情報は安全に管理され、安心してご利用いただける環境を提供しています。',
    buttons: [{ href: '/contact', label: '無料相談する', className: 'reason_3_contact' }],
    image: reasonImage3,
  },
]
