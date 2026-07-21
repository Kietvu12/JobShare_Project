import React from 'react';
import { getTemplateAssetBase } from '../../../constants/landingPageTemplates';
import { ApplyFormSection } from './ApplyFormSection';
import { useTemplateAssets } from './useTemplateAssets';

function BizTemplateView({ data, content, layout, form, setForm, onSubmit, submitting, submitted }) {
  const templateKey = data.templateKey || content.templateKey;
  const assetBase = getTemplateAssetBase(templateKey);
  const companyName = content.companyName || data.business?.companyName || 'Doanh nghiệp';
  const hero = content.hero || {};
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const isBiz62 = layout === 'biz62';
  const isSeikotsu = layout === 'seikotsu';

  useTemplateAssets(templateKey);

  const sectionLinks = sections.map((s, i) => (
    <li key={s.type || i}><a href={`#link${i + 1}`}>{s.title}</a></li>
  ));

  return (
    <div id="container">
      <header className={isSeikotsu ? 'site-header' : undefined} id={isSeikotsu ? 'header' : undefined}>
        {isBiz62 ? (
          <h1 id="logo"><a href="#apply-form">{companyName}</a></h1>
        ) : (
          <h1 className="logo">
            <a href="#apply-form">
              <img src={`${assetBase}/images/logo.png`} alt={companyName} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = companyName; }} />
            </a>
          </h1>
        )}

        <div id={isSeikotsu ? undefined : 'menubar'} style={isSeikotsu ? undefined : undefined}>
          {isSeikotsu ? (
            <nav>
              <ul>
                {sectionLinks}
                <li className="btn"><a href="#apply-form">Ứng tuyển</a></li>
              </ul>
            </nav>
          ) : (
            <>
              <nav>
                <ul>
                  {sectionLinks}
                  <li className={layout === 'biz65' ? 'btn accent' : 'btn'}><a href="#apply-form">Ứng tuyển</a></li>
                </ul>
              </nav>
              {!isBiz62 && <div className="sh">{hero.subheadline}</div>}
            </>
          )}
        </div>
      </header>

      {isBiz62 ? (
        <aside id="mainimg">
          <div className="slide slide1">
            <div>
              <h1>{hero.headline || data.title}</h1>
              <p style={{ whiteSpace: 'pre-wrap' }}>{hero.subheadline}</p>
              <p className="btn-border-radius"><a href="#apply-form">{hero.ctaPrimary || 'Ứng tuyển ngay'}</a></p>
            </div>
          </div>
          <div className="slide slide2">
            <div>
              <h1>{companyName}</h1>
              <p>Cơ hội nghề nghiệp hấp dẫn</p>
            </div>
          </div>
        </aside>
      ) : (
        <div className="mainimg">
          <div className={`slide img1${layout === 'biz65' ? '' : ''}`}>
            {layout === 'biz65' ? (
              <>
                <div className="text">
                  <h1 dangerouslySetInnerHTML={{ __html: (hero.headline || data.title).replace(/\n/g, '<br>') }} />
                  <p>{hero.subheadline}</p>
                  <div className="btn-container">
                    <p className="btn"><a href="#apply-form">{hero.ctaPrimary || 'Ứng tuyển ngay'}</a></p>
                  </div>
                </div>
                <div className="image">
                  <div className="slide img1">
                    <picture><img src={`${assetBase}/images/mainimg1.jpg`} alt="" /></picture>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text">
                  <h2 dangerouslySetInnerHTML={{ __html: `${hero.headline || data.title}<span>${hero.subheadline || ''}</span>` }} />
                  <div className="btn-container">
                    <div className="btn"><a href="#apply-form">{hero.ctaPrimary || 'Ứng tuyển ngay'}</a></div>
                  </div>
                </div>
                <picture><source media="(max-width: 700px)" srcSet={`${assetBase}/images/mainimg1_s.jpg`} /><img src={`${assetBase}/images/mainimg1.jpg`} alt="" /></picture>
              </>
            )}
          </div>
        </div>
      )}

      <div id="contents">
        <main>
          {sections.map((section, i) => (
            <section key={section.type || i} id={`link${i + 1}`}>
              <h2 className={isSeikotsu ? 'c' : undefined}>{section.title}</h2>
              <div className={isSeikotsu ? 'list1' : 'text'} style={{ whiteSpace: 'pre-wrap' }}>
                {section.body}
              </div>
            </section>
          ))}

          <section id="apply-form" style={{ padding: '2rem 1rem' }}>
            <ApplyFormSection
              content={content}
              form={form}
              setForm={setForm}
              onSubmit={onSubmit}
              submitting={submitting}
              submitted={submitted}
            />
          </section>
        </main>
      </div>

      <footer id="footer" style={{ textAlign: 'center', padding: '1.5rem' }}>
        <small>{companyName} · Powered by WS JobShare</small>
      </footer>

      {!isSeikotsu && (
        <>
          <div className="pagetop"><a href="#"><i className="fas fa-angle-double-up" /></a></div>
          <div id="menubar_hdr"><span /><span /><span /></div>
        </>
      )}
    </div>
  );
}

export default BizTemplateView;
