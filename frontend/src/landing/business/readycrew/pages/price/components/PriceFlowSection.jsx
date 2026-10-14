import SiteLink from '../../../components/layout/SiteLink'
import { PhoneIcon } from './icons'

const FLOW_CONTENT = [
  {
    description: (
      <>
        JobShare Businessの<strong>企業登録は無料</strong>です。
        <br />
        基本的な企業情報と採用担当者情報をご入力いただくだけで、すぐに利用を開始できます。
        <strong>「外国人採用が初めて」</strong>
        <strong>「募集条件がまだ決まっていない」</strong>
        といった場合も、Workstationへ採用に関するご相談をお送りいただけます。
      </>
    ),
    showContact: true,
  },
  {
    description: (
      <>
        職種、仕事内容、勤務地、給与、必要な経験・スキル、日本語レベルなどを入力すると、
        <strong>AIが求人票の作成をサポート</strong>します。既存の求人票がある場合は、ファイルをアップロードすることで内容の整理や改善も可能です。
        <br />
        作成した求人をもとに、条件に合う匿名候補者も確認できます。
      </>
    ),
  },
  {
    description: (
      <>
        求人作成後、自社の採用課題や体制に合わせて、必要なサービスを選択します。企業が候補者を検索して直接連絡する方法、Workstationへ候補者対応を依頼する方法、採用ページによる情報発信、採用パートナーネットワークの活用など、複数の方法から選択できます。
        <br />
        候補者の推薦、メッセージ、選考状況は、JobShare Business上で一元管理できます。
      </>
    ),
  },
]

const STEPS = [
  {
    step: 'STEP 1',
    image: '/landing/business/assets/images/front-page/front-page-flow-picture-01.svg',
    imageAlt: '無料企業登録',
    title: '無料企業登録｜まずは企業情報の登録から',
  },
  {
    step: 'STEP 2',
    image: '/landing/business/assets/images/front-page/front-page-flow-picture-02.svg',
    imageAlt: '求人作成',
    title: '求人作成｜AIと対話しながら募集要件を整理',
  },
  {
    step: 'STEP 3',
    image: '/landing/business/assets/images/front-page/front-page-flow-picture-03.svg',
    imageAlt: 'サービス選択・採用開始',
    title: 'サービス選択・採用開始｜自社に合った方法で候補者へアプローチ',
  },
]

export default function PriceFlowSection() {
  return (
    <section className="front-page-flow l-section">
      <div className="front-page-flow__target js-scroll-target" id="flow" />
      <div className="front-page-flow__contents l-contents">
        <header className="front-page-flow__header m-section-header">
          <h2 className="o-section-heading">JobShare Businessのご利用の流れ</h2>
        </header>
        <div className="front-page-flow__body">
          <div className="front-page-flow__one-column">
            {STEPS.map((step, index) => (
              <div key={step.step} className="front-page-flow__item">
                <div className="front-page-flow__picture">
                  <div className="front-page-flow__picture-body">
                    <img src={step.image} alt={step.imageAlt} />
                  </div>
                  {index < STEPS.length - 1 && <div className="front-page-flow__arrow" />}
                </div>
                <div className="front-page-flow__text-area">
                  <p className="front-page-flow__main-text-en">{step.step}</p>
                  <h3 className="front-page-flow__main-text-jp">{step.title}</h3>
                  <p className="front-page-flow__desc">{FLOW_CONTENT[index].description}</p>
                  {'showContact' in FLOW_CONTENT[index] && FLOW_CONTENT[index].showContact && (
                    <div className="front-page-flow__contact">
                      <SiteLink className="front-page-flow__contact-subject o-btn-bg o-btn-bg--red" to="/contact_rc/">
                        <p className="front-page-flow__contact-subject-text o-btn-bg__text">お問い合わせ</p>
                      </SiteLink>
                      <a className="front-page-flow__contact-info" href="tel:080-9441-1975">
                        <div className="front-page-flow__contact-tel">
                          <p className="front-page-flow__contact-icon">
                            <PhoneIcon />
                          </p>
                          <p className="front-page-flow__contact-tel-text">080-9441-1975</p>
                        </div>
                        <p className="front-page-flow__contact-time">10:00 〜 18:00 (平日)</p>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="front-page-flow__lower">
            <div className="front-page-flow__tel-item">
              <a className="front-page-flow__tel m-element-side-space" href="tel:080-9441-1975">
                <span className="front-page-flow__tel-icon">
                  <PhoneIcon className="front-page-flow__tel-icon-body" />
                </span>
                <span className="front-page-flow__tel-text">080-9441-1975</span>
                <span className="front-page-flow__time">10:00 〜 18:00 (平日)</span>
              </a>
            </div>
            <SiteLink
              className="front-page-flow__download-btn o-btn-bg o-btn-bg--hover-border m-element-side-space"
              to="/inquiry_docs_rc/"
            >
              <span className="front-page-flow__anchor-text o-btn-bg__text">資料ダウンロード</span>
            </SiteLink>
            <SiteLink
              className="front-page-flow__contact-btn o-btn-bg o-btn-bg--white o-btn-bg--hover-border m-element-side-space"
              to="/business/register"
            >
              <span className="front-page-flow__anchor-text o-btn-bg__text">
                無料で
                <br className="br-sp" />
                企業登録する
              </span>
            </SiteLink>
          </div>
        </div>
      </div>
    </section>
  )
}
