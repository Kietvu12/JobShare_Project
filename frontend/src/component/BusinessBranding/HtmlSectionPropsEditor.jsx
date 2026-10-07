import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getEffectiveSection } from '../../utils/htmlTemplateOverrides';
import { applySectionOverridePatch } from '../../utils/landingPageContentLocale';
import { getEditorContentLocale } from '../../utils/landingPageEditorContentLocale';
import { isStoredMediaKey, normalizePostImageUrl } from '../../services/api';
import { useLandingPageEditorUi } from '../../context/LandingPageEditorUiContext';

function Field({ label, children, hint }) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-semibold text-slate-600 block mb-1">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function inputCls(extra = '') {
  return `w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs ${extra}`;
}

function setOverride(section, onChange, patch) {
  const contentLocale = getEditorContentLocale();
  onChange(applySectionOverridePatch(section, patch, contentLocale));
}

function ImageField({ label, value, onChange, hint, templateFolder }) {
  const pe = useLandingPageEditorUi().propsEditor;
  const previewSrc = (() => {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    if (value.startsWith('/uploads/') || isStoredMediaKey(value)) {
      return normalizePostImageUrl(value);
    }
    if (value.startsWith('/')) return value;
    if (templateFolder) return `/template/${templateFolder}/${value.replace(/^\.\//, '')}`;
    return value;
  })();
  return (
    <Field label={label} hint={hint || pe.imageUrlHint}>
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputCls()} placeholder="images/example.jpg" />
      {previewSrc && (
        <img src={previewSrc} alt="" className="mt-1 max-h-16 rounded border object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      )}
    </Field>
  );
}

function HeadingEditor({ heading, onChange }) {
  const pe = useLandingPageEditorUi().propsEditor;
  const h = heading || {};
  return (
    <>
      <Field label={pe.mainTitle}>
        <input value={h.main || ''} onChange={(e) => onChange({ ...h, main: e.target.value })} className={inputCls()} />
      </Field>
      <Field label={pe.subTitleEn}>
        <input value={h.sub || ''} onChange={(e) => onChange({ ...h, sub: e.target.value })} className={inputCls()} />
      </Field>
    </>
  );
}

function ItemsEditor({ items, onChange, fields = ['title', 'body'], templateFolder, addLabel }) {
  const pe = useLandingPageEditorUi().propsEditor;
  const addLabelResolved = addLabel || pe.addItem;
  const list = (items || []).map((item) => (item && typeof item === 'object' ? item : {}));
  const updateList = (next) => onChange(next.map((item) => (item && typeof item === 'object' ? item : {})));
  const removeAt = (index) => {
    if (list.length <= 1) {
      window.alert(pe.keepOneItem);
      return;
    }
    if (!window.confirm(pe.deleteItem)) return;
    updateList(list.filter((_, i) => i !== index));
  };
  const addItem = () => {
    const blank = {};
    fields.forEach((f) => { blank[f] = ''; });
    updateList([...list, blank]);
  };

  return (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="p-2 border rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-bold text-slate-500">Mục {i + 1}</div>
            <button type="button" onClick={() => removeAt(i)} className="p-0.5 text-red-400 hover:text-red-600" title="Xóa mục">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {fields.includes('image') && (
            <ImageField
              label={pe.image}
              value={item.image || item.imageUrl || ''}
              templateFolder={templateFolder}
              onChange={(v) => {
                const next = [...list];
                next[i] = { ...next[i], image: v };
                updateList(next);
              }}
            />
          )}
          {fields.includes('icon') && (
            <Field label={pe.iconClass}>
              <input
                value={item.icon || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], icon: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
                placeholder="fas fa-star"
              />
            </Field>
          )}
          {fields.includes('title') && (
            <Field label={pe.title}>
              <input
                value={item.title || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], title: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('subtitle') && (
            <Field label={pe.subtitle}>
              <input
                value={item.subtitle || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], subtitle: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('body') && (
            <Field label={pe.body}>
              <textarea
                rows={2}
                value={item.body || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], body: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('linkText') && (
            <Field label={pe.buttonLink}>
              <input
                value={item.linkText || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], linkText: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('href') && (
            <Field label={pe.targetUrl} hint={pe.targetUrlHint}>
              <input
                value={item.href || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], href: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
                placeholder="#plan hoặc contact.html"
              />
            </Field>
          )}
          {fields.includes('name') && (
            <Field label={pe.nameSignature}>
              <input
                value={item.name || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], name: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('question') && (
            <Field label={pe.question}>
              <input
                value={item.question || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], question: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('answer') && (
            <Field label={pe.answer}>
              <textarea
                rows={2}
                value={item.answer || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], answer: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('date') && (
            <Field label={pe.date}>
              <input
                value={item.date || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], date: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
          {fields.includes('tag') && (
            <Field label={pe.label}>
              <input
                value={item.tag || ''}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], tag: e.target.value };
                  updateList(next);
                }}
                className={inputCls()}
              />
            </Field>
          )}
        </div>
      ))}
      <button type="button" onClick={addItem} className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
        <Plus className="w-3 h-3" /> {addLabelResolved}
      </button>
    </div>
  );
}

export default function HtmlSectionPropsEditor({ section, onChange, templateFolder }) {
  const pe = useLandingPageEditorUi().propsEditor;
  const effective = getEffectiveSection(section, getEditorContentLocale());
  const overrides = section.overrides || {};

  if (section.type === 'hero_slideshow') {
    const slides = effective.slides || [];
    const removeSlide = (index) => {
      if (slides.length <= 1) {
        window.alert(pe.keepOneSlide);
        return;
      }
      if (!window.confirm(pe.deleteSlide)) return;
      setOverride(section, onChange, { slides: slides.filter((_, i) => i !== index) });
    };
    return (
      <div className="space-y-2">
        {slides.map((slide, i) => (
          <div key={i} className="p-2 border rounded-lg bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-bold text-slate-500">Slide {i + 1}</div>
              <button type="button" onClick={() => removeSlide(i)} className="p-0.5 text-red-400 hover:text-red-600" title="Xóa slide">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <Field label={pe.title}>
              <input
                value={slide.headline || ''}
                onChange={(e) => {
                  const next = [...slides];
                  next[i] = { ...next[i], headline: e.target.value };
                  setOverride(section, onChange, { slides: next });
                }}
                className={inputCls()}
              />
            </Field>
            <Field label={pe.description}>
              <textarea
                rows={2}
                value={slide.body || ''}
                onChange={(e) => {
                  const next = [...slides];
                  next[i] = { ...next[i], body: e.target.value };
                  setOverride(section, onChange, { slides: next });
                }}
                className={inputCls()}
              />
            </Field>
            <Field label={pe.ctaButton}>
              <input
                value={slide.ctaText || ''}
                onChange={(e) => {
                  const next = [...slides];
                  next[i] = { ...next[i], ctaText: e.target.value };
                  setOverride(section, onChange, { slides: next });
                }}
                className={inputCls()}
              />
            </Field>
            <ImageField
              label={pe.slideBg}
              value={slide.image || slide.imageUrl || ''}
              templateFolder={templateFolder}
              onChange={(v) => {
                const next = [...slides];
                next[i] = { ...next[i], image: v };
                setOverride(section, onChange, { slides: next });
              }}
              hint={pe.templatePathHint(templateFolder) || undefined}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOverride(section, onChange, { slides: [...slides, { headline: '', body: '', ctaText: '', image: '' }] })}
          className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold"
        >
          <Plus className="w-3 h-3" /> {pe.addSlide}
        </button>
      </div>
    );
  }

  if (section.type === 'hero_slide' || section.type === 'hero_biz65') {
    const slide = effective.slide || {};
    const slides = effective.slides || [];
    const setSlide = (patch) => setOverride(section, onChange, { slide: { ...slide, ...patch } });
    const isBiz65 = section.type === 'hero_biz65';
    return (
      <div className="space-y-2 p-2 border rounded-lg bg-slate-50">
        <Field label={pe.title}>
          <textarea rows={2} value={slide.headline || ''} onChange={(e) => setSlide({ headline: e.target.value })} className={inputCls()} />
        </Field>
        {!isBiz65 && (
          <Field label={pe.subtitle}>
            <input value={slide.subheadline || slide.subtitle || ''} onChange={(e) => setSlide({ subheadline: e.target.value })} className={inputCls()} />
          </Field>
        )}
        <Field label={pe.body}>
          <textarea rows={2} value={slide.body || ''} onChange={(e) => setSlide({ body: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.primaryButton}>
          <input value={slide.ctaPrimary || ''} onChange={(e) => setSlide({ ctaPrimary: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.secondaryButton}>
          <input value={slide.ctaSecondary || ''} onChange={(e) => setSlide({ ctaSecondary: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.primaryUrl} hint={pe.primaryUrlHint}>
          <input value={slide.ctaPrimaryHref || ''} onChange={(e) => setSlide({ ctaPrimaryHref: e.target.value })} className={inputCls()} placeholder="contact.html" />
        </Field>
        <Field label={pe.secondaryUrl}>
          <input value={slide.ctaSecondaryHref || ''} onChange={(e) => setSlide({ ctaSecondaryHref: e.target.value })} className={inputCls()} placeholder="#" />
        </Field>
        {!isBiz65 && (
          <>
            <Field label={pe.primaryIcon}>
              <input value={slide.ctaPrimaryIcon || 'fa-regular fa-envelope'} onChange={(e) => setSlide({ ctaPrimaryIcon: e.target.value })} className={inputCls()} />
            </Field>
            <Field label={pe.secondaryIcon}>
              <input value={slide.ctaSecondaryIcon || 'fa-regular fa-file-lines'} onChange={(e) => setSlide({ ctaSecondaryIcon: e.target.value })} className={inputCls()} />
            </Field>
            <ImageField label={pe.heroImage} value={slide.image || slide.imageUrl || ''} templateFolder={templateFolder} onChange={(v) => setSlide({ image: v })} />
            <ImageField label={pe.mobileImage} value={slide.imageMobile || ''} templateFolder={templateFolder} onChange={(v) => setSlide({ imageMobile: v })} />
          </>
        )}
        {isBiz65 && slides.map((s, i) => (
          <div key={i} className="p-2 border rounded bg-white">
            <div className="text-[10px] font-bold text-slate-500 mb-1">{pe.slideImageN(i + 1)}</div>
            <ImageField
              label={pe.desktopImage}
              value={s.image || s.imageUrl || ''}
              templateFolder={templateFolder}
              onChange={(v) => {
                const next = [...slides];
                next[i] = { ...next[i], image: v };
                setOverride(section, onChange, { slides: next });
              }}
            />
            <ImageField
              label={pe.mobileImage}
              value={s.imageMobile || ''}
              templateFolder={templateFolder}
              onChange={(v) => {
                const next = [...slides];
                next[i] = { ...next[i], imageMobile: v };
                setOverride(section, onChange, { slides: next });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (section.type === 'announcement_bar') {
    return (
      <>
        <Field label={pe.title}>
          <input
            value={overrides.heading ?? section.heading ?? ''}
            onChange={(e) => setOverride(section, onChange, { heading: e.target.value })}
            className={inputCls()}
          />
        </Field>
        <Field label={pe.announceContent}>
          <textarea
            rows={2}
            value={effective.body || ''}
            onChange={(e) => setOverride(section, onChange, { body: e.target.value })}
            className={inputCls()}
          />
        </Field>
      </>
    );
  }

  if (['icon_list', 'service_grid'].includes(section.type)) {
    const fields = section.type === 'service_grid'
      ? ['image', 'title', 'subtitle', 'body']
      : ['image', 'title', 'body'];
    return (
      <>
        <HeadingEditor
          heading={effective.heading}
          onChange={(h) => setOverride(section, onChange, { heading: h })}
        />
        <ItemsEditor
          items={effective.items}
          fields={fields}
          templateFolder={templateFolder}
          onChange={(items) => setOverride(section, onChange, { items })}
        />
      </>
    );
  }

  if (section.type === 'text_image') {
    return (
      <>
        <HeadingEditor
          heading={effective.heading}
          onChange={(h) => setOverride(section, onChange, { heading: h })}
        />
        <Field label={pe.body}>
          <textarea rows={4} value={effective.body || ''} onChange={(e) => setOverride(section, onChange, { body: e.target.value })} className={inputCls()} />
        </Field>
        <ImageField label={pe.image} value={overrides.image || section.image || ''} templateFolder={templateFolder} onChange={(v) => setOverride(section, onChange, { image: v })} />
      </>
    );
  }

  if (section.type === 'text_image_alternate') {
    return (
      <>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <ItemsEditor
          items={effective.items}
          fields={['title', 'subtitle', 'body', 'image']}
          templateFolder={templateFolder}
          onChange={(items) => setOverride(section, onChange, { items })}
        />
      </>
    );
  }

  if (section.type === 'step_list' || section.type === 'flow_boxes') {
    const isFlow = section.type === 'flow_boxes';
    const steps = effective.steps || [];
    const removeStep = (index) => {
      if (steps.length <= 1) {
        window.alert(pe.keepOneStep);
        return;
      }
      if (!window.confirm(pe.deleteStep)) return;
      setOverride(section, onChange, { steps: steps.filter((_, i) => i !== index) });
    };
    return (
      <>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="p-2 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] font-bold text-slate-500">{pe.stepN(i + 1)}</div>
                <button type="button" onClick={() => removeStep(i)} className="p-0.5 text-red-400 hover:text-red-600" title={pe.deleteStepTitle}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {isFlow && (
                <Field label={pe.stepLabel}>
                  <input
                    value={step.step || ''}
                    onChange={(e) => {
                      const next = [...effective.steps];
                      next[i] = { ...next[i], step: e.target.value };
                      setOverride(section, onChange, { steps: next });
                    }}
                    className={inputCls()}
                  />
                </Field>
              )}
              <Field label={pe.title}>
                <input
                  value={step.title || ''}
                  onChange={(e) => {
                    const next = [...effective.steps];
                    next[i] = { ...next[i], title: e.target.value };
                    setOverride(section, onChange, { steps: next });
                  }}
                  className={inputCls()}
                />
              </Field>
              <Field label={pe.subtitle}>
                <input
                  value={step.subtitle || ''}
                  onChange={(e) => {
                    const next = [...effective.steps];
                    next[i] = { ...next[i], subtitle: e.target.value };
                    setOverride(section, onChange, { steps: next });
                  }}
                  className={inputCls()}
                />
              </Field>
              <Field label={pe.body}>
                <textarea
                  rows={2}
                  value={step.body || ''}
                  onChange={(e) => {
                    const next = [...effective.steps];
                    next[i] = { ...next[i], body: e.target.value };
                    setOverride(section, onChange, { steps: next });
                  }}
                  className={inputCls()}
                />
              </Field>
              {!isFlow && (
                <Field label={pe.iconClass}>
                  <input
                    value={step.icon || ''}
                    onChange={(e) => {
                      const next = [...effective.steps];
                      next[i] = { ...next[i], icon: e.target.value };
                      setOverride(section, onChange, { steps: next });
                    }}
                    className={inputCls()}
                  />
                </Field>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOverride(section, onChange, { steps: [...steps, { title: '', body: '', icon: 'fas fa-star' }] })}
            className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold"
          >
            <Plus className="w-3 h-3" /> {pe.addStep}
          </button>
        </div>
      </>
    );
  }

  if (section.type === 'faq_accordion') {
    return (
      <>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <ItemsEditor
          items={effective.items}
          fields={['question', 'answer']}
          onChange={(items) => setOverride(section, onChange, { items })}
        />
      </>
    );
  }

  if (['testimonials_scroll', 'testimonials_carousel'].includes(section.type)) {
    return (
      <>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <ItemsEditor
          items={effective.items}
          fields={['image', 'title', 'body', 'name']}
          templateFolder={templateFolder}
          onChange={(items) => setOverride(section, onChange, { items })}
        />
        <Field label={pe.readMore}>
          <input
            value={effective.moreLink?.text || ''}
            onChange={(e) => setOverride(section, onChange, { moreLink: { ...(effective.moreLink || {}), text: e.target.value } })}
            className={inputCls()}
          />
        </Field>
        <Field label={pe.readMoreUrl}>
          <input
            value={effective.moreLink?.href || '#'}
            onChange={(e) => setOverride(section, onChange, { moreLink: { ...(effective.moreLink || {}), href: e.target.value } })}
            className={inputCls()}
          />
        </Field>
      </>
    );
  }

  if (['dual_cta', 'contact_cta', 'cta_banner'].includes(section.type)) {
    const buttons = effective.buttons?.length
      ? effective.buttons
      : [{ text: section.buttonText || '', href: section.buttonLink || '#' }];
    return (
      <>
        {(section.type === 'cta_banner' || effective.heading?.main || effective.body) && (
          <>
            <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
            <Field label={pe.body}>
              <textarea rows={2} value={effective.body || ''} onChange={(e) => setOverride(section, onChange, { body: e.target.value })} className={inputCls()} />
            </Field>
          </>
        )}
        <div className="space-y-2">
          {buttons.map((btn, i) => (
            <div key={i} className="p-2 border rounded-lg">
              <Field label={pe.buttonN(i + 1)}>
                <input
                  value={btn.text || ''}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[i] = { ...next[i], text: e.target.value };
                    setOverride(section, onChange, { buttons: next });
                  }}
                  className={inputCls()}
                />
              </Field>
              <Field label={pe.buttonUrlN(i + 1)} hint={pe.buttonUrlHint}>
                <input
                  value={btn.href || ''}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[i] = { ...next[i], href: e.target.value };
                    setOverride(section, onChange, { buttons: next });
                  }}
                  className={inputCls()}
                  placeholder="contact.html"
                />
              </Field>
              {section.type === 'dual_cta' && (
                <>
                  <Field label={pe.subTitleJp}>
                    <input
                      value={btn.subText || ''}
                      onChange={(e) => {
                        const next = [...buttons];
                        next[i] = { ...next[i], subText: e.target.value };
                        setOverride(section, onChange, { buttons: next });
                      }}
                      className={inputCls()}
                    />
                  </Field>
                  <Field label={pe.titleEn}>
                    <input
                      value={btn.mainText || ''}
                      onChange={(e) => {
                        const next = [...buttons];
                        next[i] = { ...next[i], mainText: e.target.value };
                        setOverride(section, onChange, { buttons: next });
                      }}
                      className={inputCls()}
                    />
                  </Field>
                </>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section.type === 'news_list') {
    return (
      <>
        <Field label={pe.sectionTitle}>
          <input
            value={overrides.heading ?? section.heading ?? ''}
            onChange={(e) => setOverride(section, onChange, { heading: e.target.value })}
            className={inputCls()}
          />
        </Field>
        <ItemsEditor
          items={effective.items}
          fields={['date', 'tag', 'body']}
          onChange={(items) => setOverride(section, onChange, { items })}
        />
      </>
    );
  }

  if (['footer_access', 'access_map'].includes(section.type)) {
    return (
      <>
        <Field label={pe.address}>
          <textarea rows={2} value={effective.address || ''} onChange={(e) => setOverride(section, onChange, { address: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.phone}>
          <input value={effective.phone || ''} onChange={(e) => setOverride(section, onChange, { phone: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.hours}>
          <input value={effective.hours || ''} onChange={(e) => setOverride(section, onChange, { hours: e.target.value })} className={inputCls()} />
        </Field>
      </>
    );
  }

  if (section.type === 'pricing_table') {
    const plans = effective.plans || [];
    const rows = effective.rows || [];
    return (
      <>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <p className="text-[10px] font-bold text-slate-500 mb-1">Gói / cột</p>
        {plans.map((plan, i) => (
          <div key={i} className="p-2 border rounded-lg bg-slate-50 mb-2">
            <Field label={pe.planNameN(i + 1)}>
              <input value={plan.name || ''} onChange={(e) => {
                const next = [...plans]; next[i] = { ...next[i], name: e.target.value };
                setOverride(section, onChange, { plans: next });
              }} className={inputCls()} />
            </Field>
            <Field label={pe.price}>
              <input value={plan.price || ''} onChange={(e) => {
                const next = [...plans]; next[i] = { ...next[i], price: e.target.value };
                setOverride(section, onChange, { plans: next });
              }} className={inputCls()} />
            </Field>
            <Field label="Icon (FontAwesome)">
              <input value={plan.icon || 'fa-solid fa-crown'} onChange={(e) => {
                const next = [...plans]; next[i] = { ...next[i], icon: e.target.value };
                setOverride(section, onChange, { plans: next });
              }} className={inputCls()} />
            </Field>
          </div>
        ))}
        <ItemsEditor
          items={rows.map((r) => ({ title: r.label, body: (r.values || []).join(' | ') }))}
          fields={['title', 'body']}
          addLabel={pe.addRow}
          onChange={(edited) => {
            const nextRows = edited.map((row) => ({
              label: row.title || '',
              values: (row.body || '').split('|').map((v) => v.trim()),
            }));
            setOverride(section, onChange, { rows: nextRows });
          }}
        />
      </>
    );
  }

  if (section.type === 'company_profile') {
    const rows = effective.rows || [];
    return (
      <>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <Field label={pe.tableCaption}>
          <input value={effective.caption || ''} onChange={(e) => setOverride(section, onChange, { caption: e.target.value })} className={inputCls()} />
        </Field>
        <ItemsEditor
          items={rows.map((r) => ({ title: r.label, body: r.value }))}
          fields={['title', 'body']}
          addLabel={pe.addLine}
          onChange={(edited) => {
            setOverride(section, onChange, {
              rows: edited.map((r) => ({ label: r.title || '', value: r.body || '' })),
            });
          }}
        />
      </>
    );
  }

  if (section.type === 'list_grid') {
    return (
      <>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <ItemsEditor
          items={effective.items}
          fields={['image', 'title', 'body', 'linkText', 'href']}
          templateFolder={templateFolder}
          onChange={(items) => setOverride(section, onChange, { items })}
        />
        <Field label={pe.readMore}>
          <input
            value={effective.moreLink?.text || ''}
            onChange={(e) => setOverride(section, onChange, { moreLink: { ...(effective.moreLink || {}), text: e.target.value } })}
            className={inputCls()}
          />
        </Field>
        <Field label={pe.readMoreUrl}>
          <input
            value={effective.moreLink?.href || '#'}
            onChange={(e) => setOverride(section, onChange, { moreLink: { ...(effective.moreLink || {}), href: e.target.value } })}
            className={inputCls()}
          />
        </Field>
      </>
    );
  }

  if (section.type === 'recruit_hero') {
    const slide = effective.slide || {};
    const setSlide = (patch) => setOverride(section, onChange, { slide: { ...slide, ...patch } });
    return (
      <div className="space-y-2 p-2 border rounded-lg bg-slate-50">
        <Field label={pe.mainTitleJp}>
          <textarea rows={2} value={slide.headline || ''} onChange={(e) => setSlide({ headline: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.subTitleEnSection}>
          <textarea rows={2} value={slide.subheadline || ''} onChange={(e) => setSlide({ subheadline: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.shortDesc}>
          <input value={slide.body || ''} onChange={(e) => setSlide({ body: e.target.value })} className={inputCls()} />
        </Field>
      </div>
    );
  }

  if (section.type === 'recruit_news') {
    return (
      <>
        <Field label={pe.label}>
          <input value={effective.heading?.main || ''} onChange={(e) => setOverride(section, onChange, { heading: { ...effective.heading, main: e.target.value } })} className={inputCls()} />
        </Field>
        <Field label={pe.body}>
          <textarea rows={2} value={effective.body || ''} onChange={(e) => setOverride(section, onChange, { body: e.target.value })} className={inputCls()} />
        </Field>
      </>
    );
  }

  if (section.type === 'recruit_page') {
    return (
      <>
        <Field label={pe.sectionLabelEn}>
          <input value={effective.sectionLabel || ''} onChange={(e) => setOverride(section, onChange, { sectionLabel: e.target.value })} className={inputCls()} />
        </Field>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <Field label={pe.copyTitle}>
          <textarea rows={2} value={effective.copyHeadline || ''} onChange={(e) => setOverride(section, onChange, { copyHeadline: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.copyBody}>
          <textarea rows={4} value={effective.copyBody || ''} onChange={(e) => setOverride(section, onChange, { copyBody: e.target.value })} className={inputCls()} />
        </Field>
      </>
    );
  }

  if (section.type === 'recruit_stats') {
    return (
      <ItemsEditor
        items={effective.items}
        fields={['image', 'title', 'body']}
        templateFolder={templateFolder}
        onChange={(items) => setOverride(section, onChange, { items: items.map((it, i) => ({
          ...effective.items?.[i],
          ...it,
          title: it.title,
          value: it.body || it.value,
          image: it.image,
        })) })}
      />
    );
  }

  if (section.type === 'recruit_qa' || section.type === 'recruit_timeline') {
    const fields = section.type === 'recruit_timeline' ? ['date', 'title', 'body'] : ['question', 'answer'];
    const items = section.type === 'recruit_timeline'
      ? (effective.items || []).map((it) => ({ date: it.time, title: it.title, body: it.body }))
      : effective.items;
    return (
      <ItemsEditor
        items={items}
        fields={fields}
        onChange={(edited) => {
          if (section.type === 'recruit_timeline') {
            setOverride(section, onChange, {
              items: edited.map((it) => ({ time: it.date, title: it.title, body: it.body })),
            });
          } else {
            setOverride(section, onChange, { items: edited });
          }
        }}
      />
    );
  }

  if (section.type === 'recruit_entry') {
    const buttons = effective.buttons || [];
    return (
      <>
        <Field label={pe.entryTitle}>
          <input value={effective.entryTitle || ''} onChange={(e) => setOverride(section, onChange, { entryTitle: e.target.value })} className={inputCls()} />
        </Field>
        <HeadingEditor heading={effective.heading} onChange={(h) => setOverride(section, onChange, { heading: h })} />
        <Field label={pe.description}>
          <textarea rows={3} value={effective.body || ''} onChange={(e) => setOverride(section, onChange, { body: e.target.value })} className={inputCls()} />
        </Field>
        {buttons.map((btn, i) => (
          <div key={i} className="p-2 border rounded-lg mb-2">
            <Field label={pe.channelN(i + 1)}>
              <input value={btn.label || ''} onChange={(e) => {
                const next = [...buttons]; next[i] = { ...next[i], label: e.target.value };
                setOverride(section, onChange, { buttons: next });
              }} className={inputCls()} />
            </Field>
            <Field label={pe.description}>
              <input value={btn.description || ''} onChange={(e) => {
                const next = [...buttons]; next[i] = { ...next[i], description: e.target.value };
                setOverride(section, onChange, { buttons: next });
              }} className={inputCls()} />
            </Field>
            <Field label={pe.url}>
              <input value={btn.href || ''} onChange={(e) => {
                const next = [...buttons]; next[i] = { ...next[i], href: e.target.value };
                setOverride(section, onChange, { buttons: next });
              }} className={inputCls()} />
            </Field>
          </div>
        ))}
        <Field label={pe.emailHtml}>
          <input value={effective.email || ''} onChange={(e) => setOverride(section, onChange, { email: e.target.value })} className={inputCls()} />
        </Field>
        <Field label={pe.phoneHtml}>
          <input value={effective.phone || ''} onChange={(e) => setOverride(section, onChange, { phone: e.target.value })} className={inputCls()} />
        </Field>
      </>
    );
  }

  if (section.decorative) {
    return <p className="text-[10px] text-slate-400">{pe.decorativeSection}</p>;
  }

  return (
    <p className="text-[10px] text-slate-400">
      {pe.unknownSectionForm(section.type)}
      {section.selector ? ` (${section.selector})` : ''}
    </p>
  );
}
