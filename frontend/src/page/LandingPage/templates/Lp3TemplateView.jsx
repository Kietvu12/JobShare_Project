import React from 'react';
import { getLandingPageTemplate, getTemplateAssetBase } from '../../../constants/landingPageTemplates';
import { ApplyFormSection } from './ApplyFormSection';
import { useTemplateAssets } from './useTemplateAssets';

function Lp3TemplateView({ data, content, form, setForm, onSubmit, submitting, submitted }) {
  const templateKey = data.templateKey || content.templateKey;
  const tpl = getLandingPageTemplate(templateKey);
  const assetBase = getTemplateAssetBase(templateKey);
  const companyName = content.companyName || data.business?.companyName || 'Doanh nghiệp';
  const sections = content.sections || {};
  const heroMedia = content.heroMedia || tpl.heroMedia || 'slide';

  useTemplateAssets(templateKey);

  const kodawari = sections.kodawari?.[0] || {};
  const service = sections.service?.[0] || {};
  const flow = sections.flow || [];
  const voice = sections.voice || [];
  const faq = sections.faq || [];

  return (
    <div id="container">
      <header>
        <h1 id="logo">
          <a href="#apply-form">
            <img src={`${assetBase}/images/logo-home.png`} alt={companyName} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = companyName; }} />
          </a>
        </h1>
        <div id="menubar">
          <nav>
            <ul>
              <li><a href="#kodawari">Giới thiệu</a></li>
              <li><a href="#service">Quyền lợi</a></li>
              <li><a href="#flow">Quy trình</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#apply-form">Ứng tuyển</a></li>
            </ul>
          </nav>
        </div>
        <div id="header-box">
          <ul className="btn">
            <li><a href="#apply-form"><i className="fa-solid fa-envelope" /> Ứng tuyển online</a></li>
          </ul>
        </div>
      </header>

      {heroMedia === 'video' ? (
        <div id="mainimg">
          <video muted playsInline autoPlay loop poster={`${assetBase}/images/mainimg1.jpg`}>
            <source src={`${assetBase}/images/sample.mp4`} type="video/mp4" />
          </video>
        </div>
      ) : (
        <aside id="mainimg">
          <div className="slide slide1" />
          <div className="slide slide2" />
          <div className="slide slide3" />
        </aside>
      )}

      {content.announcement && (
        <div className="new-top">
          <h2>Thông báo</h2>
          <p className="text">{content.announcement}</p>
        </div>
      )}

      <div id="contents">
        <main>
          <section id="kodawari">
            <h2 className="c">
              <span className="fade-in-text">{kodawari.title || 'Giới thiệu công việc'}</span>
              <span className="small">{kodawari.subtitle || 'About'}</span>
            </h2>
            <div className="list-half">
              <div className="list up">
                <div className="text">
                  <h4>{content.hero?.headline || data.title}</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{kodawari.body}</p>
                </div>
                <div className="image-r">
                  <figure><img src={`${assetBase}/images/kodawari-1.jpg`} alt="" /></figure>
                </div>
              </div>
            </div>
          </section>

          <section id="service">
            <h2 className="c">
              <span className="fade-in-text">{service.title || 'Quyền lợi'}</span>
              <span className="small">{service.subtitle || 'Benefits'}</span>
            </h2>
            <div className="list-half">
              <div className="list up">
                <div className="text">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{service.body}</p>
                </div>
                <div className="image-r">
                  <figure><img src={`${assetBase}/images/service-1.jpg`} alt="" onError={(e) => { e.target.src = `${assetBase}/images/kodawari-2.jpg`; }} /></figure>
                </div>
              </div>
            </div>
          </section>

          {flow.length > 0 && (
            <section id="flow">
              <h2 className="c">
                <span className="fade-in-text">Quy trình ứng tuyển</span>
                <span className="small">Process</span>
              </h2>
              <div className="list-flow">
                {flow.map((step) => (
                  <div key={step.step} className="list">
                    <div className="num">{step.step}</div>
                    <h4>{step.title}</h4>
                    <p>{step.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {voice.length > 0 && (
            <div id="voice" className="bg-slideup slideup1">
              <section>
                <h2 className="c">
                  <span className="fade-in-text">Cơ hội nghề nghiệp</span>
                  <span className="small">Career</span>
                </h2>
                <div className="list-yoko-scroll">
                  {voice.map((v, i) => (
                    <div key={i} className="list">
                      <h4>{v.title}</h4>
                      <p className="text">{v.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {faq.length > 0 && (
            <section id="faq" className="bg1">
              <h2>
                <span className="fade-in-text">Câu hỏi thường gặp</span>
                <span className="small">FAQ</span>
              </h2>
              <dl className="faq">
                {faq.map((item, i) => (
                  <React.Fragment key={i}>
                    <dt className="openclose2">{item.q}</dt>
                    <dd>{item.a}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>
          )}

          <div className="bg-slideup slideup2" id="apply-form">
            <section className="btn-box">
              <ApplyFormSection
                content={content}
                form={form}
                setForm={setForm}
                onSubmit={onSubmit}
                submitting={submitting}
                submitted={submitted}
                assetBase={assetBase}
              />
            </section>
          </div>
        </main>
      </div>

      <footer id="footer">
        <div className="footer1">
          <p><img src={`${assetBase}/images/logo-footer.png`} alt={companyName} onError={(e) => { e.target.outerHTML = `<strong>${companyName}</strong>`; }} /></p>
          <p>{companyName} · Tuyển dụng qua WS JobShare</p>
        </div>
        <div className="footer2">
          <small>Powered by WS JobShare · Saiyo Branding</small>
        </div>
      </footer>

      <div className="pagetop"><a href="#"><i className="fas fa-angle-double-up" /></a></div>
      <div id="menubar_hdr"><span /><span /><span /></div>
    </div>
  );
}

export default Lp3TemplateView;
