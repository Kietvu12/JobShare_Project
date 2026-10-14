import React from 'react';
import { Link } from 'react-router-dom';
import { salary, local } from '../../templates/JobShare_Jobs_V3_20261007/dist/model.js';
import { rootFor, toneFor, iconFor } from '../../templates/JobShare_Jobs_V3_20261007/dist/ui.js';
import { JobsV3Icon } from './jobsV3Icons';

export default function JobsV3JobCard({
  job,
  lang,
  t,
  jobsBasePath,
  tree,
  saved,
  onToggleSave,
}) {
  const root = rootFor(job.jobCategoryId, tree);
  const tone = toneFor(root?.id);
  const sal = salary(job, lang, t);
  const href = `${jobsBasePath.replace(/\/+$/, '')}/${encodeURIComponent(job.id)}`;
  const locations = (job.workingLocations || [])
    .map((x) => local(x, 'location', lang))
    .filter(Boolean);
  const employment = t.employment[Number(job.recruitmentType)] || '';
  const company = local(job.recruitingCompany, 'companyName', lang);
  const category = local(job.category, 'name', lang);
  const isSaved = saved.has(job.id);

  return (
    <li>
      <article className={`job-card tone-${tone}`}>
        <div className="job-accent" aria-hidden="true" />
        <div className="job-top">
          <span className="category-tile">
            <JobsV3Icon name={iconFor(root?.id)} />
          </span>
          <div className="company-block">
            {company ? <p className="company">{company}</p> : null}
            {category ? <p className="category">{category}</p> : null}
          </div>
          <button
            type="button"
            className="bookmark"
            aria-pressed={isSaved}
            aria-label={isSaved ? t.saved : t.save}
            onClick={() => onToggleSave(job.id)}
          >
            <JobsV3Icon name="bookmark" />
          </button>
        </div>
        <h3>
          <Link to={href}>{local(job, 'title', lang)}</Link>
        </h3>
        <div className="job-meta">
          {locations.length ? (
            <span className="meta-location">
              <i>
                <JobsV3Icon name="pin" />
              </i>
              {locations.join(' · ')}
            </span>
          ) : null}
          {employment ? (
            <span className="meta-employment">
              <i>
                <JobsV3Icon name="briefcase" />
              </i>
              {employment}
            </span>
          ) : null}
        </div>
        <div className="job-bottom">
          <div className="salary-block">
            <span className="salary-icon">
              <JobsV3Icon name="yen" />
            </span>
            <div>
              <span className="salary-label">{t.salary}</span>
              <p className="salary">{sal.value}</p>
              {sal.period ? <p className="salary-detail">{sal.period}</p> : null}
            </div>
          </div>
          <Link className="detail-link" to={href}>
            {t.details}
            <JobsV3Icon name="arrow" />
          </Link>
        </div>
      </article>
    </li>
  );
}
