import fs from 'fs';
import { fileURLToPath } from 'url';

const files = [
  'src/landing/candidates/pages/CandidateHomePage.jsx',
  'src/landing/collaborators/pages/CollaboratorHomePage.jsx',
];

const reps = [
  [/import React from 'react';/, "import React from 'react';\nimport { tw } from '../../shared/lib/landingHomeTw';"],
  [/className="btn btn-primary"/g, 'className={tw.btnPrimary}'],
  [/className="btn btn-quiet"/g, 'className={tw.btnQuiet}'],
  [/className="text-link"/g, 'className={tw.textLink}'],
  [/className="hero"/g, 'className={tw.hero}'],
  [/className="wrap hero-grid"/g, 'className={tw.heroGrid}'],
  [/className="hero-copy"/g, 'className={tw.heroCopy}'],
  [/className="kicker"/g, 'className={tw.kicker}'],
  [/className="hero-lead"/g, 'className={tw.heroLead}'],
  [/className="actions"/g, 'className={tw.heroActions}'],
  [/className="hero-media"/g, 'className={tw.heroMedia}'],
  [/className="section community"/g, 'className={`${tw.section} community`}'],
  [/className="section why-section"/g, 'className={`${tw.section} why-section`}'],
  [/className="section ai-section"/g, 'className={`${tw.section} ai-section`}'],
  [/className="section flow"/g, 'className={`${tw.section} flow`}'],
  [/className="section platform"/g, 'className={`${tw.section} platform`}'],
  [/className="section partners"/g, 'className={`${tw.section} partners`}'],
  [/className="section jobs-section"/g, 'className={`${tw.section} jobs-section`}'],
  [/className="section news candidate-news"/g, 'className={`${tw.section} news candidate-news`}'],
  [/className="section news"/g, 'className={`${tw.section} news`}'],
  [/className="final"/g, 'className={tw.final}'],
  [/className="wrap split"/g, 'className={`${tw.container} ${tw.split}`}'],
  [/className="wrap"/g, 'className={tw.container}'],
  [/className="source-section-head"/g, 'className={tw.sourceSectionHead}'],
  [/className="section-number"/g, 'className={tw.sectionNumber}'],
  [/className="semantic-line"/g, 'className={tw.semanticLine}'],
  [/className="community-grid"/g, 'className={tw.communityGrid}'],
  [/className="community-card"/g, 'className={tw.communityCard}'],
  [/className="card-top"/g, 'className={tw.cardTop}'],
  [/className="card-number"/g, 'className={tw.cardNumber}'],
  [/className="section-head"/g, 'className={tw.sectionHead}'],
  [/className="why-grid why-grid--candidate"/g, 'className={tw.whyGrid}'],
  [/className="why-grid"/g, 'className={tw.whyGrid}'],
  [/className="why-card"/g, 'className={tw.whyCard}'],
  [/className="media-frame"/g, 'className={tw.mediaFrame}'],
  [/className="split-copy"/g, 'className={tw.splitCopy}'],
  [/className="flow-board"/g, 'className={tw.flowBoard}'],
  [/className="flow-step"/g, 'className={tw.flowStep}'],
  [/className="step-top"/g, 'className={tw.stepTop}'],
  [/className="step-no"/g, 'className={tw.stepNo}'],
  [/className="platform-intro"/g, 'className={tw.platformIntro}'],
  [/className="features"/g, 'className={tw.features}'],
  [/className="feature"/g, 'className={tw.feature}'],
  [/className="feature-heading"/g, 'className={tw.featureHeading}'],
  [/className="check-list"/g, 'className={tw.checkList}'],
  [/className="partner-lead"/g, 'className={tw.partnerLead}'],
  [/className="partner-grid"/g, 'className={tw.partnerGrid}'],
  [/className="partner"/g, 'className={tw.partner}'],
  [/className="jobs-grid"/g, 'className={tw.jobsGrid}'],
  [/className="job-card"/g, 'className={tw.jobCard}'],
  [/className="job-card-top"/g, 'className={tw.jobCardTop}'],
  [/className="job-company"/g, 'className={tw.jobCompany}'],
  [/className="job-arrow"/g, 'className={tw.jobArrow}'],
  [/className="job-meta"/g, 'className={tw.jobMeta}'],
  [/className="job-salary"/g, 'className={tw.jobSalary}'],
  [/className="job-type"/g, 'className={tw.jobType}'],
  [/className="job-more-card"/g, 'className={tw.jobMoreCard}'],
  [/className="job-more-top"/g, 'className={tw.jobMoreTop}'],
  [/className="job-more-arrow"/g, 'className={tw.jobMoreArrow}'],
  [/className="news-grid candidate-news-grid"/g, 'className={tw.newsGrid}'],
  [/className="news-grid"/g, 'className={tw.newsGrid}'],
  [/className="news-card"/g, 'className={tw.newsCard}'],
  [/className="news-image"/g, 'className={tw.newsImage}'],
  [/className="news-body"/g, 'className={tw.newsBody}'],
  [/className="news-meta"/g, 'className={tw.newsMeta}'],
  [/className="final-box"/g, 'className={tw.finalBox}'],
  [/className="final-media"/g, 'className={tw.finalMedia}'],
  [/className="final-copy"/g, 'className={tw.finalCopy}'],
  [/<span className="hero-line">/g, '<span className={tw.heroLine}>'],
  [/<span className="hero-line accent">/g, '<span className={`${tw.heroLine} ${tw.heroLineAccent}`}>'],
];

const base = new URL('../', import.meta.url); // frontend/

for (const rel of files) {
  const path = new URL(rel, base);
  const filePath = fileURLToPath(path);
  let s = fs.readFileSync(filePath, 'utf8');
  if (s.includes('landingHomeTw')) {
    console.log('already patched', path);
    continue;
  }
  for (const [a, b] of reps) s = s.replace(a, b);
  fs.writeFileSync(filePath, s);
  console.log('patched', filePath);
}
