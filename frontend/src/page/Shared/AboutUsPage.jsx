import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const HERO_IMAGE = 'https://ws-engineering.com/wp-content/uploads/2026/04/about-hero.jpg';
const VISION_IMAGE = 'https://ws-engineering.com/wp-content/uploads/2026/04/about-vision.jpg';

const COPY = {
  vi: {
    seoTitle: 'Về chúng tôi | Workstation JobShare',
    seoDescription: 'Giới thiệu Workstation Co. Ltd, sứ mệnh, tầm nhìn, thế mạnh và thông tin doanh nghiệp.',
    eyebrow: 'ABOUT US',
    title: 'Về chúng tôi',
    lead: 'Tối đa hóa “chất lượng Nhật Bản” bằng “sức mạnh nhân tài Việt Nam”. Trở thành đối tác kỹ thuật thực thụ, thúc đẩy tăng trưởng cho doanh nghiệp của bạn.',
    intro1: 'Trong bối cảnh đổi mới công nghệ diễn ra nhanh chóng trong ngành xây dựng và IT, nhiều doanh nghiệp Nhật Bản đang đối mặt đồng thời với hai thách thức: thiếu hụt nhân lực chất lượng cao và tối ưu hóa chi phí phát triển.',
    intro2: 'Workstation Co. Ltd được thành lập để cung cấp lời giải tối ưu cho những bài toán đó. Với nền tảng hiểu sâu về tiêu chuẩn chất lượng, văn hóa làm việc và quy trình kinh doanh tại Nhật Bản, chúng tôi kết nối trực tiếp doanh nghiệp với đội ngũ kỹ sư trẻ, tài năng tại Việt Nam.',
    intro3: 'Chúng tôi không chỉ là một đơn vị outsourcing. Workstation cam kết trở thành đối tác duy nhất đồng hành cùng khách hàng trong việc hiện thực hóa tầm nhìn kinh doanh bằng công nghệ.',
    missionLabel: 'Sứ mệnh của chúng tôi',
    mission: 'Thông qua quan hệ đối tác kỹ thuật toàn diện, đảm nhiệm tối ưu hóa, phát triển mới và triển khai công nghệ hiện đại, chúng tôi cùng khách hàng tối đa hóa giá trị dự án và đóng góp vào nền tảng xã hội bền vững.',
    visionLabel: 'Tầm nhìn',
    vision: 'Trở thành công ty dẫn đầu số 1 kết nối Nhật Bản và Việt Nam bằng năng lực kỹ thuật vượt trội, sự tin cậy và các giải pháp số trong lĩnh vực xây dựng, hạ tầng và IT.',
    strengthsTitle: 'Thế mạnh của Workstation',
    strengths: [
      {
        title: '01. Mạng lưới ứng viên global',
        text: 'Workstation kết nối nguồn ứng viên Việt Nam và Đông Nam Á với các cơ hội việc làm tại Nhật Bản trong nhiều lĩnh vực như kỹ thuật, IT, xây dựng, sản xuất, dịch vụ và các ngành chuyên môn khác.',
      },
      {
        title: '02. Nền tảng tuyển dụng cộng đồng',
        text: 'Workstation JobShare giúp cộng tác viên, recruiter và HR partner giới thiệu ứng viên phù hợp một cách có hệ thống. Ứng viên, người giới thiệu và doanh nghiệp đều có thể theo dõi quá trình tuyển dụng minh bạch hơn.',
      },
      {
        title: '03. Hỗ trợ từ tuyển dụng đến ổn định nhân sự',
        text: 'Workstation hỗ trợ không chỉ ở giai đoạn giới thiệu hồ sơ, mà còn trong quá trình phỏng vấn, đào tạo tiếng Nhật, tư vấn điều kiện làm việc và đồng hành sau khi ứng viên gia nhập doanh nghiệp.',
      },
    ],
    companyTitle: 'Thông tin doanh nghiệp',
    companyRows: [
      ['Tên công ty', 'Công ty Cổ phần Workstation\nWorkstation Co. Ltd'],
      ['Thành lập', 'Tháng 4 năm 2015'],
      ['Địa chỉ', 'Tầng 3, số 82 phố Duy Tân, phường Dịch Vọng Hậu, quận Cầu Giấy, Hà Nội, Việt Nam'],
      ['Thông tin liên hệ', '(+81) 80 9441 1975 Nhật Bản\n(+84) 904 605 939 Việt Nam'],
      ['Lĩnh vực hoạt động', 'Phát triển platform tuyển dụng ứng dụng công nghệ AI\nGiới thiệu và đào tạo nhân lực kỹ sư nước ngoài chất lượng cao\nPhát triển mô hình Lab kỹ thuật dành cho thị trường Nhật Bản\nVận hành BIM và phát triển DX trong lĩnh vực xây dựng'],
    ],
    ctaText: 'Ứng viên, cộng tác viên tuyển dụng và doanh nghiệp quan tâm đến Workstation JobShare hoặc các dịch vụ tuyển dụng global, vui lòng liên hệ với chúng tôi.',
    ctaButton: 'Liên hệ tư vấn',
  },
  en: {
    seoTitle: 'About Us | Workstation JobShare',
    seoDescription: 'Learn about Workstation Co. Ltd, our mission, vision, strengths, and company profile.',
    eyebrow: 'ABOUT US',
    title: 'About Us',
    lead: 'Maximizing “Japanese quality” through the power of Vietnamese talent. We aim to be a true engineering partner that accelerates your growth.',
    intro1: 'As technological innovation accelerates across the construction and IT industries, many Japanese companies face two pressing challenges: securing advanced talent and optimizing development costs.',
    intro2: 'Workstation Co. Ltd was established to provide the best answer to those challenges. With a deep understanding of Japanese business practices and strict quality standards, we connect companies directly with young, highly capable engineering talent in Vietnam.',
    intro3: 'We go beyond conventional outsourcing. Workstation promises to be a unique partner that turns your business vision into reality through technology.',
    missionLabel: 'Our Mission',
    mission: 'Through comprehensive technical partnerships covering optimization, new development, and implementation of modern technologies, we maximize project value together with our clients and contribute to sustainable social infrastructure.',
    visionLabel: 'Our Vision',
    vision: 'To become the No. 1 leading company connecting Japan and Vietnam through outstanding engineering capability, trust, and digital solutions in construction, civil engineering, and IT.',
    strengthsTitle: 'Workstation Strengths',
    strengths: [
      {
        title: '01. Global candidate network',
        text: 'Workstation connects candidates from Vietnam and Southeast Asia with job opportunities in Japan across engineering, IT, construction, manufacturing, services, and other professional fields.',
      },
      {
        title: '02. Community-based recruitment platform',
        text: 'Workstation JobShare helps collaborators, recruiters, and HR partners introduce suitable candidates in a systematic way. Candidates, referrers, and companies can all track the recruitment process with greater transparency.',
      },
      {
        title: '03. Support from recruitment to workforce stability',
        text: 'Workstation supports not only profile referrals, but also interviews, Japanese language training, working-condition consultation, and follow-up after candidates join the company.',
      },
    ],
    companyTitle: 'Company Profile',
    companyRows: [
      ['Company name', 'Workstation Joint Stock Company\nWorkstation Co. Ltd'],
      ['Established', 'April 2015'],
      ['Address', '3rd Floor, 82 Duy Tan Street, Dich Vong Hau Ward, Cau Giay District, Hanoi, Vietnam'],
      ['Contact information', '(+81) 80 9441 1975 Japan\n(+84) 904 605 939 Vietnam'],
      ['Business activities', 'Development of AI-powered recruitment platforms\nRecruitment and training of high-quality foreign engineers\nDevelopment of technical lab models for the Japanese market\nBIM operations and DX development in the construction field'],
    ],
    ctaText: 'Candidates, recruitment collaborators, and companies interested in Workstation JobShare or global recruitment services are welcome to contact us.',
    ctaButton: 'Contact us',
  },
  ja: {
    seoTitle: '会社概要・企業理念 | Workstation JobShare',
    seoDescription: '株式会社ワークステーションの会社概要、企業理念、強み、事業情報をご紹介します。',
    eyebrow: 'ABOUT US',
    title: '私たちについて',
    lead: '「日本品質」をベトナムの「人財力」で最大化する。貴社の成長を加速させる、真のエンジニアリングパートナーへ。',
    intro1: '建設・IT業界における技術革新が急速に進む中、多くの日本企業様が直面している「高度人財の不足」と「開発コストの最適化」という二極化する課題。',
    intro2: '私たち株式会社ワークステーション（Workstation Co. Ltd）は、この課題に対する「最適解」を提供するために設立されました。日本の商習慣や厳しい品質基準を深く理解した上で、ベトナムの若く優秀な技術力をダイレクトに繋ぎます。',
    intro3: '私たちは、単なるアウトソーシングの枠を超え、お客様のビジネスビジョンを技術で具現化する唯一無二のパートナーであることを約束します。',
    missionLabel: '私たちの使命',
    mission: '私たちは、最新テクノロジーの「最適化」「新開発」「実行」を担う包括的な技術パートナーシップを通じて、お客様と共にプロジェクトの価値を最大化し、豊かで持続可能な社会基盤の構築に貢献します。',
    visionLabel: '目指す姿',
    vision: '建設・土木・IT分野におけるデジタルソリューションを牽引し、圧倒的な技術力と信頼で日本とベトナムを繋ぐNO.1リーディングカンパニーを目指します。',
    strengthsTitle: 'Workstationの強み',
    strengths: [
      {
        title: '01. グローバル候補者ネットワーク',
        text: 'Workstationは、ベトナムおよび東南アジアの候補者と、日本の技術、IT、建設、製造、サービス、その他専門分野の求人機会をつなぎます。',
      },
      {
        title: '02. コミュニティ型採用プラットフォーム',
        text: 'Workstation JobShareは、コラボレーター、リクルーター、HRパートナーが適切な候補者を体系的に紹介できる仕組みを提供します。候補者、紹介者、企業が採用プロセスをより透明に確認できます。',
      },
      {
        title: '03. 採用から定着までの支援',
        text: 'Workstationは、履歴書紹介だけでなく、面接、日本語教育、勤務条件の相談、入社後のフォローまで、候補者が企業に定着するまで伴走します。',
      },
    ],
    companyTitle: '企業情報',
    companyRows: [
      ['会社名', 'Workstation株式会社\nWorkstation Co. Ltd'],
      ['設立', '2015年4月'],
      ['所在地', 'ベトナム ハノイ市 カウザイ区 ジックヴォンハウ坊 ズイタン通り 82番地 3階'],
      ['連絡先', '(+81) 80 9441 1975 日本\n(+84) 904 605 939 ベトナム'],
      ['事業内容', 'AI技術を活用した採用プラットフォームの開発\n高品質な外国人エンジニア人材の紹介・育成\n日本市場向け技術Labモデルの開発\n建設分野におけるBIM運用およびDX開発'],
    ],
    ctaText: 'Workstation JobShareまたはグローバル採用サービスにご関心のある候補者、採用コラボレーター、企業の皆さまは、お気軽にお問い合わせください。',
    ctaButton: 'ご相談・お問い合わせ',
  },
};

export default function AboutUsPage() {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.vi;

  return (
    <div className="bg-[#f7f8fa] text-[#0b192c]">
      <Helmet>
        <title>{copy.seoTitle}</title>
        <meta name="description" content={copy.seoDescription} />
      </Helmet>

      <section className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
          <img src={HERO_IMAGE} alt={copy.title} className="h-auto w-full object-cover" />
        </div>

        <div className="mx-auto mt-10 max-w-[920px] text-center lg:mt-14">
          <p className="text-xs font-bold tracking-[0.28em] text-[#b60100]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#b60100] sm:text-4xl">{copy.title}</h1>
          <div className="mt-8 border-l-4 border-[#b60100] bg-white p-6 text-left shadow-[0_2px_18px_rgba(15,23,42,0.04)] sm:p-9">
            <p className="text-lg font-bold leading-8 text-[#0b192c]">{copy.lead}</p>
            <div className="mt-5 space-y-4 text-[15px] leading-8 text-[#444]">
              <p>{copy.intro1}</p>
              <p>{copy.intro2}</p>
              <p>{copy.intro3}</p>
            </div>
          </div>
        </div>

        <section className="mt-14 grid overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] lg:mt-20 lg:grid-cols-2 lg:items-center lg:p-8">
          <div className="p-2">
            <img src={VISION_IMAGE} alt="Workstation Vision" className="w-full rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.12)]" />
          </div>
          <div className="space-y-8 p-4 sm:p-8">
            <div>
              <h2 className="border-b border-neutral-200 pb-3 text-2xl font-extrabold text-[#b60100]">
                MISSION <span className="ml-2 text-sm font-medium text-neutral-500">({copy.missionLabel})</span>
              </h2>
              <p className="mt-4 text-[15px] leading-8 text-[#444]">{copy.mission}</p>
            </div>
            <div>
              <h2 className="border-b border-neutral-200 pb-3 text-2xl font-extrabold text-[#b60100]">
                VISION <span className="ml-2 text-sm font-medium text-neutral-500">({copy.visionLabel})</span>
              </h2>
              <p className="mt-4 text-[15px] leading-8 text-[#444]">{copy.vision}</p>
            </div>
          </div>
        </section>

        <section className="mt-14 lg:mt-20">
          <h2 className="text-center text-3xl font-extrabold text-[#0b192c]">{copy.strengthsTitle}</h2>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {copy.strengths.map((item, index) => (
              <article key={item.title} className="flex h-full flex-col rounded-xl border-t-4 bg-white p-7 shadow-[0_6px_24px_rgba(15,23,42,0.06)]" style={{ borderTopColor: index === 0 ? '#b60100' : index === 1 ? '#0b192c' : '#5a5a5a' }}>
                <h3 className="min-h-[48px] text-base font-extrabold leading-6" style={{ color: index === 0 ? '#b60100' : index === 1 ? '#0b192c' : '#333' }}>{item.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-[#555]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8 lg:mt-20 lg:p-10">
          <h2 className="text-center text-3xl font-extrabold text-[#0b192c]">{copy.companyTitle}</h2>
          <div className="mt-9 overflow-hidden rounded-xl border border-neutral-200">
            {copy.companyRows.map(([label, value]) => (
              <div key={label} className="grid border-b border-neutral-200 last:border-b-0 md:grid-cols-[28%_1fr]">
                <div className="bg-[#f8f9fa] px-5 py-4 text-sm font-extrabold text-[#333] sm:px-7 sm:py-6 md:text-base">{label}</div>
                <div className="whitespace-pre-line px-5 py-4 text-sm leading-8 text-[#444] sm:px-7 sm:py-6 md:text-base">
                  {label.includes('Liên') || label.includes('Contact') || label.includes('連絡') ? (
                    <div className="space-y-1">
                      {value.split('\n').map((line) => (
                        <div key={line} className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#b60100]" />{line}</div>
                      ))}
                    </div>
                  ) : label.includes('Địa') || label.includes('Address') || label.includes('Location') || label.includes('所在地') ? (
                    <div className="flex gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0 text-[#b60100]" /><span>{value}</span></div>
                  ) : label.includes('Lĩnh vực') || label.includes('Business') || label.includes('事業') ? (
                    <ul className="space-y-2">
                      {value.split('\n').map((line) => (
                        <li key={line} className="flex items-baseline gap-2">
                          <span className="relative -top-[0.08em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b60100]" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="mx-auto max-w-2xl text-base leading-7 text-[#5a5a5a]">{copy.ctaText}</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('jobshare:open-support-chat'))}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#b60100] px-9 py-4 text-base font-extrabold !text-white shadow-[0_8px_22px_rgba(182,1,0,0.25)] transition hover:bg-[#990000]"
          >
            {copy.ctaButton}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </section>
    </div>
  );
}
