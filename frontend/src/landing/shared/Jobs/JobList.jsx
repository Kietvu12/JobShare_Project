import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { copy } from '../../templates/JobShare_Jobs_V3_20261007/dist/content.js';
import {
  readSelection,
  writeSelection,
  toggleCategory,
  locationKey,
} from '../../templates/JobShare_Jobs_V3_20261007/dist/filter-model.js';
import { queryFor, matchesJapanese, local } from '../../templates/JobShare_Jobs_V3_20261007/dist/model.js';
import { setupPicker } from '../../templates/JobShare_Jobs_V3_20261007/dist/picker.js';
import { flatten, iconFor, toneFor } from '../../templates/JobShare_Jobs_V3_20261007/dist/ui.js';
import apiService from '../../../services/api';
import { useLandingLocale } from '../lib/useLandingLocale';
import { JOBS_V3_SEARCH_VISUAL } from './jobsV3Assets';
import {
  JOBS_V3_CATEGORY_TREE,
  JOBS_V3_LOCATION_MASTER,
  JOBS_V3_SECTORS,
} from './jobsV3Catalog';
import JobsV3JobCard from './JobsV3JobCard';
import { JobsV3Icon } from './jobsV3Icons';
import { parseJobsListResponse } from './publicJobModel';

import './jobs-v3-styles.scoped.css';
import './jobs-v3-overrides.css';

const QUICK_ROOT_IDS = [79, 112, 137, 225];
const tree = JOBS_V3_CATEGORY_TREE;
const flatCategories = flatten(tree);

function categoryLabelForLang(value, lang) {
  const item = flatCategories.find((x) => Number(x.id) === Number(value));
  return item ? local(item, 'name', lang) : String(value);
}

function locationLabel(value, lang) {
  return lang === 'ja' ? value.locationJp || value.location : value.location;
}

export default function JobList({ jobsBasePath }) {
  const lang = useLandingLocale();
  const t = copy[lang] || copy.vi;
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(false);
  const [saved, setSaved] = useState(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [hasMorePage, setHasMorePage] = useState(false);
  const cursorsRef = useRef({ 1: null });
  const requestIdRef = useRef(0);
  const jobsRef = useRef([]);
  const selectionRef = useRef(null);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const pickerBoundRef = useRef(false);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const selection = useMemo(
    () => readSelection(searchParams, tree),
    [searchParams],
  );
  selectionRef.current = selection;

  const categoryDisplay = useMemo(() => {
    const cat = [...selection.fieldIds, ...selection.jobTypeIds];
    if (!cat.length) return t.all;
    const first = categoryLabelForLang(cat[0], lang);
    return cat.length > 1 ? `${first} +${cat.length - 1}` : first;
  }, [selection, lang, t.all]);

  const locationDisplay = useMemo(() => {
    const loc = selection.locations;
    if (!loc.length) return t.locationPlaceholder;
    const first = locationLabel(loc[0], lang);
    return loc.length > 1 ? `${first} +${loc.length - 1}` : first;
  }, [selection, lang, t.locationPlaceholder]);

  useEffect(() => {
    document.body.classList.add('jobshare-jobs-v3-list');
    return () => document.body.classList.remove('jobshare-jobs-v3-list');
  }, []);

  useEffect(() => {
    if (pickerBoundRef.current) return;
    pickerBoundRef.current = true;
    setupPicker({
      lang,
      t,
      tree,
      master: JOBS_V3_LOCATION_MASTER,
      getSelection: () => selectionRef.current,
      onCommit: (next) => {
        const params = new URLSearchParams(searchParamsRef.current);
        writeSelection(params, next);
        params.delete('page');
        params.delete('cursor');
        cursorsRef.current = { 1: null };
        setSearchParams(params);
      },
    });
  }, [lang, setSearchParams, t]);

  const loadJobs = useCallback(async () => {
    const current = ++requestIdRef.current;
    setLoading(true);
    setListError(false);
    setRefreshNotice(false);

    const state = new URLSearchParams(searchParams);
    const cursor =
      state.get('cursor') || (page > 1 ? cursorsRef.current[page] : null) || null;

    try {
      const query = queryFor(state, cursor, tree);
      const response = await apiService.getPublicApplicantJobs(
        Object.fromEntries(query.entries()),
      );
      if (current !== requestIdRef.current) return;

      const { jobs: list, pagination } = parseJobsListResponse(response);
      const jp = state.get('jp');
      const filtered = list.filter((j) => matchesJapanese(j, jp));

      setJobs(filtered);
      jobsRef.current = filtered;
      const hasMore = !!pagination?.hasMore;
      setHasMorePage(hasMore);
      const nextCursor = pagination?.nextCursor || null;
      if (hasMore && nextCursor) cursorsRef.current[page + 1] = nextCursor;
    } catch (e) {
      console.error('[JobList V3]', e);
      if (current !== requestIdRef.current) return;
      if (jobsRef.current.length > 0) setRefreshNotice(true);
      else {
        setListError(true);
        setJobs([]);
        jobsRef.current = [];
      }
    } finally {
      if (current === requestIdRef.current) setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const resetPageParams = (params) => {
    params.delete('page');
    params.delete('cursor');
    cursorsRef.current = { 1: null };
  };

  const applySearchForm = (form) => {
    const data = new FormData(form);
    const params = new URLSearchParams(searchParams);
    for (const el of form.elements) {
      if (!el.name) continue;
      const val = String(data.get(el.name) || '').trim();
      if (val) params.set(el.name, val);
      else params.delete(el.name);
    }
    resetPageParams(params);
    setSearchParams(params);
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    applySearchForm(e.currentTarget);
  };

  const onFilterSubmit = (e) => {
    e.preventDefault();
    const from = e.currentTarget.from?.value;
    const to = e.currentTarget.to?.value;
    if (from && to && to < from) {
      e.currentTarget.to.setCustomValidity(t.dateInvalid);
      e.currentTarget.reportValidity();
      return;
    }
    e.currentTarget.to?.setCustomValidity('');
    applySearchForm(e.currentTarget);
    setFilterOpen(false);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    cursorsRef.current = { 1: null };
    setFilterOpen(false);
  };

  const removeChip = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (key === 'categories') {
      const id = Number(value);
      const next = {
        ...selection,
        fieldIds: selection.fieldIds.filter((x) => x !== id),
        jobTypeIds: selection.jobTypeIds.filter((x) => x !== id),
      };
      writeSelection(params, next);
    } else if (key === 'locations') {
      const next = {
        ...selection,
        locations: selection.locations.filter((l) => locationKey(l) !== value),
      };
      writeSelection(params, next);
    } else {
      params.delete(key);
    }
    resetPageParams(params);
    setSearchParams(params);
  };

  const toggleQuickCategory = (rootId) => {
    const node = tree.find((n) => Number(n.id) === Number(rootId));
    if (!node) return;
    const params = new URLSearchParams(searchParams);
    const next = toggleCategory(selection, node, true);
    writeSelection(params, next);
    resetPageParams(params);
    setSearchParams(params);
  };

  const goPage = (delta) => {
    const params = new URLSearchParams(searchParams);
    const target = page + delta;
    if (target < 1) return;
    if (delta > 0 && !hasMorePage) return;

    if (target === 1) {
      params.delete('page');
      params.delete('cursor');
    } else {
      params.set('page', String(target));
      const c = cursorsRef.current[target];
      if (c) params.set('cursor', c);
      else params.delete('cursor');
    }
    setSearchParams(params);
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showPagination = hasMorePage || page > 1;

  const activeChips = useMemo(() => {
    const labels = {
      q: t.keyword,
      sector: t.sector,
      jp: t.jp,
      from: t.from,
      to: t.to,
    };
    const chips = [];
    for (const [key, val] of searchParams.entries()) {
      if (!labels[key] || !val) continue;
      let label = val;
      if (key === 'jp') label = val === 'none' ? t.none : val.toUpperCase();
      chips.push({ key, label: `${labels[key]}: ${label}`, value: val });
    }
    for (const id of [...selection.fieldIds, ...selection.jobTypeIds]) {
      chips.push({
        key: 'categories',
        label: categoryLabelForLang(id, lang),
        value: String(id),
      });
    }
    for (const loc of selection.locations) {
      chips.push({
        key: 'locations',
        label: locationLabel(loc, lang),
        value: locationKey(loc),
      });
    }
    return chips;
  }, [searchParams, selection, lang, t]);

  const toggleSave = (id) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const keywordDefault = searchParams.get('q') || '';
  const sectorDefault = searchParams.get('sector') || '';
  const jpDefault = searchParams.get('jp') || '';
  const fromDefault = searchParams.get('from') || '';
  const toDefault = searchParams.get('to') || '';

  return (
    <>
      <Helmet>
        <title>{t.title}</title>
      </Helmet>

      <div className="jobshare-jobs-v3">
        <section className="search-hero">
          <div className="wrap search-layout">
            <div className="search-copy">
              <div className="kicker">{t.kicker}</div>
              <h1>
                <span className="hero-line">{t.heading}</span>
                <span className="hero-line hero-line-accent">{t.accent}</span>
              </h1>
              <p>{t.description}</p>
              <form id="search-form" className="search-form" role="search" onSubmit={onSearchSubmit}>
                <div className="search-field">
                  <JobsV3Icon name="search" />
                  <label className="sr-only" htmlFor="keyword">
                    {t.keyword}
                  </label>
                  <input
                    id="keyword"
                    type="search"
                    name="q"
                    defaultValue={keywordDefault}
                    key={`q-${keywordDefault}`}
                    placeholder={t.placeholder}
                    autoComplete="off"
                  />
                </div>
                <div className="hero-picker-field">
                  <button
                    type="button"
                    className="picker-trigger hero-location-trigger"
                    data-picker-trigger="location"
                    data-input="hero-location"
                    aria-haspopup="dialog"
                    aria-expanded="false"
                  >
                    <span className="picker-trigger-copy">
                      <span className="picker-trigger-label">{t.location}</span>
                      <span className="picker-value" data-picker-value="hero-location">
                        {locationDisplay}
                      </span>
                    </span>
                    <JobsV3Icon name="chevron" />
                  </button>
                </div>
                <button className="btn btn-primary" type="submit">
                  <JobsV3Icon name="search" />
                  {t.search}
                </button>
              </form>
            </div>
            <figure className="search-media">
              <img
                src={JOBS_V3_SEARCH_VISUAL}
                alt=""
                width={1536}
                height={1024}
                fetchPriority="high"
              />
            </figure>
          </div>
        </section>

        <div className="quick-bar">
          <div className="wrap quick-inner">
            {QUICK_ROOT_IDS.filter((id) => tree.some((x) => x.id === id)).map((id, i) => (
              <button
                key={id}
                type="button"
                className={`quick-chip tone-${toneFor(id)}`}
                data-category={id}
                aria-pressed={selection.fieldIds.includes(id)}
                onClick={() => toggleQuickCategory(id)}
              >
                <JobsV3Icon name={iconFor(id)} />
                {t.quick[i]}
              </button>
            ))}
          </div>
        </div>

        <div className="wrap jobs-layout">
          <aside className={`filter-shell${filterOpen ? ' open' : ''}`} id="filters">
            <button
              type="button"
              className="filter-backdrop"
              tabIndex={-1}
              aria-label={t.close}
              onClick={() => setFilterOpen(false)}
            />
            <div className="filter-panel">
              <div className="filter-heading">
                <h2 id="filter-title">
                  <JobsV3Icon name="filter" />
                  {t.filter}
                </h2>
                <button
                  type="button"
                  className="drawer-close"
                  aria-label={t.close}
                  onClick={() => setFilterOpen(false)}
                >
                  <JobsV3Icon name="close" />
                </button>
              </div>
              <form id="filter-form" className="filter-form" onSubmit={onFilterSubmit}>
                <div className="filter-fields">
                  <div className="field-group">
                    <span className="field-label">{t.category}</span>
                    <button
                      type="button"
                      className="picker-trigger"
                      data-picker-trigger="category"
                      data-input="category"
                      aria-haspopup="dialog"
                      aria-expanded="false"
                    >
                      <span className="picker-trigger-copy">
                        <span className="picker-trigger-label">{t.category}</span>
                        <span className="picker-value" data-picker-value="category">
                          {categoryDisplay}
                        </span>
                      </span>
                      <JobsV3Icon name="chevron" />
                    </button>
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="sector">
                      {t.sector}
                    </label>
                    <select
                      id="sector"
                      name="sector"
                      defaultValue={sectorDefault}
                      key={`sector-${sectorDefault}`}
                    >
                      <option value="">{t.all}</option>
                      {JOBS_V3_SECTORS.map((x) => (
                        <option key={x.key} value={x.vi}>
                          {x[lang] || x.vi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <span className="field-label">{t.location}</span>
                    <button
                      type="button"
                      className="picker-trigger"
                      data-picker-trigger="location"
                      data-input="filter-location"
                      aria-haspopup="dialog"
                      aria-expanded="false"
                    >
                      <span className="picker-trigger-copy">
                        <span className="picker-trigger-label">{t.location}</span>
                        <span className="picker-value" data-picker-value="filter-location">
                          {locationDisplay}
                        </span>
                      </span>
                      <JobsV3Icon name="chevron" />
                    </button>
                  </div>
                  <div className="field-group">
                    <span className="field-label" id="jp-title">
                      {t.jp}
                    </span>
                    <div className="jp-levels" role="radiogroup" aria-labelledby="jp-title">
                      {[
                        ['', t.any],
                        ['n1', 'N1'],
                        ['n2', 'N2'],
                        ['n3', 'N3'],
                        ['n4', 'N4'],
                        ['n5', 'N5'],
                        ['none', t.none],
                      ].map(([v, label]) => (
                        <label key={v || 'any'} className="jp-level">
                          <input
                            type="radio"
                            name="jp"
                            value={v}
                            defaultChecked={jpDefault === v || (!jpDefault && v === '')}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="field-group">
                    <span className="field-label">{t.dates}</span>
                    <div className="date-fields">
                      <label>
                        {t.from}
                        <input type="date" name="from" id="from" defaultValue={fromDefault} />
                      </label>
                      <label>
                        {t.to}
                        <input type="date" name="to" id="to" defaultValue={toDefault} min={fromDefault} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="filter-bottom">
                  <button type="submit" className="btn btn-primary">
                    {t.apply}
                  </button>
                  <button type="button" className="clear-btn" data-clear onClick={clearAllFilters}>
                    {t.clear}
                  </button>
                </div>
              </form>
            </div>
          </aside>

          <section className="results" id="results" aria-labelledby="results-title">
            <div className="results-heading">
              <div>
                <h2 id="results-title">{t.results}</h2>
                <p id="count" className="count" aria-live="polite">
                  {loading ? t.loading : t.count(jobs.length)}
                </p>
                {refreshNotice ? (
                  <div id="live-notice" className="live-notice">
                    <span>{t.refreshFail}</span>{' '}
                    <button type="button" onClick={() => loadJobs()}>
                      {t.retry}
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="mobile-filter"
                aria-controls="filters"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen(true)}
              >
                <JobsV3Icon name="filter" />
                {t.filter}
              </button>
              <span className="sort-label">
                <JobsV3Icon name="sort" />
                {t.order}
              </span>
            </div>

            <div id="active-filters" className="active-filters">
              {activeChips.map((chip) => (
                <button
                  key={`${chip.key}-${chip.value}`}
                  type="button"
                  className="active-chip"
                  data-remove={chip.key}
                  data-value={chip.value}
                  aria-label={`${t.clear}: ${chip.label}`}
                  onClick={() => removeChip(chip.key, chip.value)}
                >
                  <span>{chip.label}</span>
                  <JobsV3Icon name="close" />
                </button>
              ))}
            </div>

            <div id="list-region" aria-busy={loading} className={loading ? 'is-refreshing' : ''}>
              {loading && jobs.length === 0 ? (
                <div className="job-list" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton" />
                  ))}
                </div>
              ) : null}

              {!loading && listError && jobs.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <JobsV3Icon name="search" />
                  </span>
                  <h3>{t.error}</h3>
                  <p>{t.errorText}</p>
                  <button type="button" className="btn btn-primary" onClick={() => loadJobs()}>
                    {t.retry}
                  </button>
                </div>
              ) : null}

              {!loading && !listError && jobs.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <JobsV3Icon name="search" />
                  </span>
                  <h3>{t.empty}</h3>
                  <p>{t.emptyText}</p>
                  <button type="button" className="btn btn-primary" onClick={clearAllFilters}>
                    {t.clear}
                  </button>
                </div>
              ) : null}

              {jobs.length > 0 ? (
                <ul className="job-list">
                  {jobs.map((job) => (
                    <JobsV3JobCard
                      key={job.id}
                      job={job}
                      lang={lang}
                      t={t}
                      jobsBasePath={jobsBasePath}
                      tree={tree}
                      saved={saved}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </ul>
              ) : null}
            </div>

            <nav
              className="pagination"
              id="pagination"
              aria-label={t.page}
              hidden={!showPagination && !loading}
            >
              <button type="button" id="prev" disabled={page <= 1 || loading} onClick={() => goPage(-1)}>
                <JobsV3Icon name="left" />
                {t.prev}
              </button>
              <span id="page-label">
                {t.page} {page}
              </span>
              <button
                type="button"
                id="next"
                disabled={!hasMorePage || loading}
                onClick={() => goPage(1)}
              >
                {t.next}
                <JobsV3Icon name="right" />
              </button>
            </nav>
          </section>
        </div>

        <dialog className="multi-picker" id="value-picker" aria-labelledby="multi-title" />
      </div>
    </>
  );
}
