import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import apiService, { normalizePostImageUrl } from '../../services/api';
import LandingPageTemplateRenderer from './LandingPageTemplateRenderer';

const DEFAULT_OG_IMAGE = 'https://ws-jobshare.com/2HGb6Eo3YO1l7uOuEpoiDFXtQrQ6x7Yrzeb2.jpg';
const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://ws-jobshare.com';

function PublicLandingPage() {
  const { slug, pageSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiService.getPublicLandingPageBySlug(slug, true);
        if (!mounted) return;
        if (res?.success && res.data) {
          setData(res.data);
        } else {
          setError(res?.message || 'Không tìm thấy trang');
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Không tải được landing page');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (slug) load();
    return () => { mounted = false; };
  }, [slug]);

  const seo = data?.seo || {};
  const canonicalUrl = useMemo(
    () => {
      const base = seo.canonicalPath || `/lp/${slug}`;
      const sub = pageSlug ? `/${pageSlug}` : '';
      return `${SITE_ORIGIN}${base}${sub}`;
    },
    [seo.canonicalPath, slug, pageSlug],
  );
  const ogImage = useMemo(() => {
    const raw = seo.image;
    if (!raw) return DEFAULT_OG_IMAGE;
    const resolved = normalizePostImageUrl(raw);
    if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
    return `${SITE_ORIGIN}${resolved.startsWith('/') ? resolved : `/${resolved}`}`;
  }, [seo.image]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      alert('Vui lòng nhập họ tên và email');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiService.submitPublicLandingPageForm(slug, form);
      if (res?.success) {
        setSubmitted(true);
      } else {
        alert(res?.message || 'Gửi thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Gửi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center text-slate-600">
          <p className="text-lg font-semibold mb-2">404</p>
          <p className="text-sm">{error || 'Landing page không tồn tại'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <html lang="vi" />
        <title>{seo.title || data.title}</title>
        <meta name="description" content={seo.description || ''} />
        {seo.keywords ? <meta name="keywords" content={seo.keywords} /> : null}
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="WS JobShare" />
        <meta property="og:title" content={seo.ogTitle || seo.title || data.title} />
        <meta property="og:description" content={seo.ogDescription || seo.description || ''} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:locale" content="vi_VN" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.ogTitle || seo.title || data.title} />
        <meta name="twitter:description" content={seo.ogDescription || seo.description || ''} />
        <meta name="twitter:image" content={ogImage} />

        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seo.title || data.title,
            description: seo.description || '',
            url: canonicalUrl,
            publisher: {
              '@type': 'Organization',
              name: data.business?.companyName || 'WS JobShare',
            },
          })}
        </script>
      </Helmet>

      <LandingPageTemplateRenderer
        data={data}
        pageSlug={pageSlug || ''}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitted={submitted}
      />
    </>
  );
}

export default PublicLandingPage;
