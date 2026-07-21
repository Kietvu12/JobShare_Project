import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLandingPageTemplate, getTemplateAssetBase } from '../../constants/landingPageTemplates';
import { findPageBySlug, resolveNavHref } from '../../utils/companyLandingPageSchema';
import { useTemplateAssets } from './templates/useTemplateAssets';
import { ApplyFormSection } from './templates/ApplyFormSection';
import './companyLandingMotion.css';

function MotionWrap({ motion, children, className = '' }) {
  const m = motion && motion !== 'none' ? motion : '';
  return (
    <div className={`cl-motion ${m} ${className}`.trim()} data-motion={m || undefined}>
      {children}
    </div>
  );
}

function NavButton({ action, siteSlug, pages, children, className, style, preview }) {
  const href = resolveNavHref(action, siteSlug, pages);
  if (preview || !href) {
    return <span className={className} style={{ ...style, cursor: preview ? 'default' : undefined }}>{children}</span>;
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    return <Link to={href} className={className} style={style}>{children}</Link>;
  }
  return <a href={href} className={className} style={style}>{children}</a>;
}

function HeroSection({ section, content, siteSlug, pages, preview }) {
  const p = section.props || {};
  const bgStyle = p.imageUrl
    ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${content.theme?.primaryColor || '#2563eb'} 0%, #1e293b 100%)` };

  return (
    <section id={section.id} className="cl-hero" style={{ ...bgStyle, position: 'relative', minHeight: 320 }}>
      {p.mediaType === 'video' && p.videoUrl && (
        <video
          className="cl-hero-video"
          src={p.videoUrl}
          poster={p.posterUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div
        className="cl-hero-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(15,23,42,${p.overlayOpacity ?? 0.4})`,
        }}
      />
      <div className="cl-hero-inner" style={{ position: 'relative', zIndex: 1, padding: '64px 24px', color: '#fff', maxWidth: 800, margin: '0 auto' }}>
        <MotionWrap motion={section.motion}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>{p.headline}</h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.92, marginBottom: 20, lineHeight: 1.5 }}>{p.subheadline}</p>
          {p.ctaText && (
            <NavButton
              action={p.ctaAction}
              siteSlug={siteSlug}
              pages={pages}
              preview={preview}
              className="cl-btn-primary"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                borderRadius: 8,
                background: content.theme?.primaryColor || '#2563eb',
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {p.ctaText}
            </NavButton>
          )}
        </MotionWrap>
      </div>
    </section>
  );
}

function TextImageSection({ section }) {
  const p = section.props || {};
  const imgRight = p.imagePosition !== 'left';
  return (
    <section id={section.id} className="cl-section" style={{ padding: '48px 24px', maxWidth: 960, margin: '0 auto' }}>
      <MotionWrap motion={section.motion}>
        <div style={{ display: 'flex', flexDirection: imgRight ? 'row' : 'row-reverse', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            {p.subtitle && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{p.subtitle}</div>}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>{p.title}</h2>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#475569' }}>{p.body}</p>
          </div>
          {p.imageUrl && (
            <div style={{ flex: '1 1 240px' }}>
              <img src={p.imageUrl} alt="" style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </MotionWrap>
    </section>
  );
}

function FeaturesSection({ section, primaryColor }) {
  const p = section.props || {};
  return (
    <section id={section.id} className="cl-section" style={{ padding: '48px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <MotionWrap motion={section.motion}>
          <h2 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, marginBottom: 24 }}>{p.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {(p.items || []).map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: primaryColor, marginBottom: 10 }} />
                <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </MotionWrap>
      </div>
    </section>
  );
}

function GallerySection({ section }) {
  const p = section.props || {};
  return (
    <section id={section.id} className="cl-section" style={{ padding: '48px 24px', maxWidth: 960, margin: '0 auto' }}>
      <MotionWrap motion={section.motion}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 20 }}>{p.title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {(p.images || []).filter((img) => img.url).map((img, i) => (
            <figure key={i}>
              <img src={img.url} alt={img.caption || ''} style={{ width: '100%', borderRadius: 8, aspectRatio: '4/3', objectFit: 'cover' }} />
              {img.caption && <figcaption style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </MotionWrap>
    </section>
  );
}

function VideoSection({ section }) {
  const p = section.props || {};
  return (
    <section id={section.id} className="cl-section" style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      <MotionWrap motion={section.motion}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{p.title}</h2>
        {p.videoUrl && (
          <video
            controls
            poster={p.posterUrl || undefined}
            autoPlay={p.autoplay}
            muted={p.autoplay}
            style={{ width: '100%', borderRadius: 12 }}
          >
            <source src={p.videoUrl} />
          </video>
        )}
      </MotionWrap>
    </section>
  );
}

function CtaSection({ section, siteSlug, pages, preview }) {
  const p = section.props || {};
  return (
    <section
      id={section.id}
      className="cl-section"
      style={{ padding: '48px 24px', background: p.backgroundColor || '#2563eb', color: '#fff', textAlign: 'center' }}
    >
      <MotionWrap motion={section.motion}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>
        <p style={{ marginBottom: 16, opacity: 0.9 }}>{p.body}</p>
        <NavButton
          action={p.buttonAction}
          siteSlug={siteSlug}
          pages={pages}
          preview={preview}
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: '#fff',
            color: p.backgroundColor || '#2563eb',
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {p.buttonText}
        </NavButton>
      </MotionWrap>
    </section>
  );
}

function FormSection({ section, form, setForm, onSubmit, submitting, submitted, preview }) {
  return (
    <section id={section.id} className="cl-section" style={{ padding: '48px 24px', maxWidth: 560, margin: '0 auto' }}>
      <MotionWrap motion={section.motion}>
        <ApplyFormSection
          content={{ form: section.props }}
          form={form}
          setForm={setForm}
          onSubmit={preview ? (e) => e.preventDefault() : onSubmit}
          submitting={submitting}
          submitted={submitted}
          readOnly={preview}
        />
      </MotionWrap>
    </section>
  );
}

function SpacerSection({ section }) {
  return <div id={section.id} style={{ height: section.props?.height || 48 }} />;
}

function renderSection(section, ctx) {
  if (!section?.visible) return null;
  switch (section.type) {
    case 'hero': return <HeroSection key={section.id} section={section} {...ctx} preview={ctx.preview} />;
    case 'text_image': return <TextImageSection key={section.id} section={section} />;
    case 'features': return <FeaturesSection key={section.id} section={section} primaryColor={ctx.content.theme?.primaryColor} />;
    case 'gallery': return <GallerySection key={section.id} section={section} />;
    case 'video': return <VideoSection key={section.id} section={section} />;
    case 'cta': return <CtaSection key={section.id} section={section} siteSlug={ctx.siteSlug} pages={ctx.pages} preview={ctx.preview} />;
    case 'form': return (
      <FormSection
        key={section.id}
        section={section}
        form={ctx.form}
        setForm={ctx.setForm}
        onSubmit={ctx.onSubmit}
        submitting={ctx.submitting}
        submitted={ctx.submitted}
        preview={ctx.preview}
      />
    );
    case 'spacer': return <SpacerSection key={section.id} section={section} />;
    default: return null;
  }
}

export default function CompanyLandingRenderer({
  data,
  pageSlug = '',
  preview = false,
  form,
  setForm,
  onSubmit,
  submitting,
  submitted,
}) {
  const content = data?.content || {};
  const templateKey = data?.templateKey || content.templateKey;
  const tpl = getLandingPageTemplate(templateKey);
  const siteSlug = data?.slug || '';
  const pages = content.pages || [];
  const activePage = findPageBySlug(pages, pageSlug);
  const companyName = content.companyName || data?.business?.companyName || data?.title || 'Doanh nghiệp';

  useTemplateAssets(templateKey);

  useEffect(() => {
    if (preview) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('cl-motion-visible');
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll('.cl-motion').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activePage?.id, preview]);

  useEffect(() => {
    if (preview) {
      document.querySelectorAll('.cl-motion').forEach((el) => el.classList.add('cl-motion-visible'));
    }
  }, [activePage?.id, preview]);

  const ctx = {
    content,
    siteSlug,
    pages,
    preview,
    form,
    setForm,
    onSubmit,
    submitting,
    submitted,
  };

  if (!activePage) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Trang không tồn tại</div>;
  }

  return (
    <div className="cl-site" style={{ fontFamily: content.theme?.fontFamily || 'system-ui, sans-serif', minHeight: preview ? 'auto' : '100vh' }}>
      <header className="cl-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #e2e8f0',
        background: '#fff',
        position: preview ? 'relative' : 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: content.theme?.primaryColor || '#1e293b' }}>
          {companyName}
        </div>
        <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(content.globalNav || pages).map((nav) => {
            const page = pages.find((p) => p.id === nav.pageId) || pages.find((p) => p.slug === nav.slug);
            if (!page) return null;
            const href = page.isHome || !page.slug ? `/lp/${siteSlug}` : `/lp/${siteSlug}/${page.slug}`;
            const active = page.id === activePage.id;
            const style = {
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              color: active ? content.theme?.primaryColor : '#64748b',
              textDecoration: 'none',
            };
            if (preview) {
              return <span key={page.id} style={style}>{nav.label || page.title}</span>;
            }
            return (
              <Link key={page.id} to={href} style={style}>
                {nav.label || page.title}
              </Link>
            );
          })}
        </nav>
      </header>

      {content.announcement && (
        <div style={{ background: '#eff6ff', padding: '8px 24px', fontSize: 13, textAlign: 'center', color: '#1d4ed8' }}>
          {content.announcement}
        </div>
      )}

      <main>
        {(activePage.sections || []).map((section) => renderSection(section, ctx))}
      </main>

      <footer style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
        © {companyName} · Powered by WS JobShare
        {!preview && tpl?.name ? ` · ${tpl.name}` : ''}
      </footer>
    </div>
  );
}
