import fs from 'fs';
import { fileURLToPath } from 'url';

const files = [
  'src/landing/candidates/pages/CandidateHomePage.jsx',
  'src/landing/collaborators/pages/CollaboratorHomePage.jsx',
];

const reps = [
  [/import \{ tw \} from '\.\.\/\.\.\/shared\/lib\/landingHomeTw';\n/, ''],
  [/className=\{tw\.btnPrimary\}/g, 'className="btn btn-primary"'],
  [/className=\{tw\.btnQuiet\}/g, 'className="btn btn-quiet"'],
  [/className=\{tw\.textLink\}/g, 'className="text-link"'],
  [/className=\{tw\.hero\}/g, 'className="hero"'],
  [/className=\{tw\.heroGrid\}/g, 'className="wrap hero-grid"'],
  [/className=\{tw\.heroCopy\}/g, 'className="hero-copy"'],
  [/className=\{tw\.kicker\}/g, 'className="kicker"'],
  [/className=\{tw\.heroLead\}/g, 'className="hero-lead"'],
  [/className=\{tw\.heroActions\}/g, 'className="actions"'],
  [/className=\{tw\.heroMedia\}/g, 'className="hero-media"'],
  [/className=\{`\$\{tw\.section\} community`\}/g, 'className="section community"'],
  [/className=\{`\$\{tw\.section\} why-section`\}/g, 'className="section why-section"'],
  [/className=\{`\$\{tw\.section\} ai-section`\}/g, 'className="section ai-section"'],
  [/className=\{`\$\{tw\.section\} flow`\}/g, 'className="section flow"'],
  [/className=\{`\$\{tw\.section\} platform`\}/g, 'className="section platform"'],
  [/className=\{`\$\{tw\.section\} partners`\}/g, 'className="section partners"'],
  [/className=\{`\$\{tw\.section\} jobs-section`\}/g, 'className="section jobs-section"'],
  [/className=\{`\$\{tw\.section\} news candidate-news`\}/g, 'className="section news candidate-news"'],
  [/className=\{`\$\{tw\.section\} news`\}/g, 'className="section news"'],
  [/className=\{tw\.final\}/g, 'className="final"'],
  [/className=\{`\$\{tw\.container\} \$\{tw\.split\}`\}/g, 'className="wrap split"'],
  [/className=\{tw\.container\}/g, 'className="wrap"'],
  [/className=\{tw\.sourceSectionHead\}/g, 'className="source-section-head"'],
  [/className=\{tw\.sectionNumber\}/g, 'className="section-number"'],
  [/className=\{tw\.semanticLine\}/g, 'className="semantic-line"'],
  [/className=\{tw\.communityGrid\}/g, 'className="community-grid"'],
  [/className=\{tw\.communityCard\}/g, 'className="community-card"'],
  [/className=\{tw\.cardTop\}/g, 'className="card-top"'],
  [/className=\{tw\.cardNumber\}/g, 'className="card-number"'],
  [/className=\{tw\.sectionHead\}/g, 'className="section-head"'],
  [/className=\{tw\.whyGrid\}/g, 'className="why-grid why-grid--candidate"'],
  [/className=\{tw\.whyCard\}/g, 'className="why-card"'],
  [/className=\{tw\.mediaFrame\}/g, 'className="media-frame"'],
  [/className=\{tw\.splitCopy\}/g, 'className="split-copy"'],
  [/className=\{tw\.flowBoard\}/g, 'className="flow-board"'],
  [/className=\{tw\.flowStep\}/g, 'className="flow-step"'],
  [/className=\{tw\.stepTop\}/g, 'className="step-top"'],
  [/className=\{tw\.stepNo\}/g, 'className="step-no"'],
  [/className=\{tw\.platformIntro\}/g, 'className="platform-intro"'],
  [/className=\{tw\.features\}/g, 'className="features"'],
  [/className=\{tw\.feature\}/g, 'className="feature"'],
  [/className=\{tw\.featureHeading\}/g, 'className="feature-heading"'],
  [/className=\{tw\.checkList\}/g, 'className="check-list"'],
  [/className=\{tw\.partnerLead\}/g, 'className="partner-lead"'],
  [/className=\{tw\.partnerGrid\}/g, 'className="partner-grid"'],
  [/className=\{tw\.partner\}/g, 'className="partner"'],
  [/className=\{tw\.jobsGrid\}/g, 'className="jobs-grid"'],
  [/className=\{tw\.jobCard\}/g, 'className="job-card"'],
  [/className=\{tw\.jobCardTop\}/g, 'className="job-card-top"'],
  [/className=\{tw\.jobCompany\}/g, 'className="job-company"'],
  [/className=\{tw\.jobArrow\}/g, 'className="job-arrow"'],
  [/className=\{tw\.jobMeta\}/g, 'className="job-meta"'],
  [/className=\{tw\.jobSalary\}/g, 'className="job-salary"'],
  [/className=\{tw\.jobType\}/g, 'className="job-type"'],
  [/className=\{tw\.jobMoreCard\}/g, 'className="job-more-card"'],
  [/className=\{tw\.jobMoreTop\}/g, 'className="job-more-top"'],
  [/className=\{tw\.jobMoreArrow\}/g, 'className="job-more-arrow"'],
  [/className=\{tw\.newsGrid\}/g, 'className="news-grid candidate-news-grid"'],
  [/className=\{tw\.newsCard\}/g, 'className="news-card"'],
  [/className=\{tw\.newsImage\}/g, 'className="news-image"'],
  [/className=\{tw\.newsBody\}/g, 'className="news-body"'],
  [/className=\{tw\.newsMeta\}/g, 'className="news-meta"'],
  [/className=\{tw\.finalBox\}/g, 'className="final-box"'],
  [/className=\{tw\.finalMedia\}/g, 'className="final-media"'],
  [/className=\{tw\.finalCopy\}/g, 'className="final-copy"'],
  [/className=\{tw\.heroTitle\}/g, ''],
  [/className=\{tw\.heroLine\}/g, 'className="hero-line"'],
  [/className=\{`\$\{tw\.heroLine\} \$\{tw\.heroLineAccent\}`\}/g, 'className="hero-line"'],
  [/className=\{tw\.heroMediaImg\}\n\s*/g, ''],
  [/className=\{tw\.sectionH2\}/g, ''],
  [/className=\{tw\.cardTitle\}/g, ''],
  [/className=\{tw\.cardDesc\}/g, ''],
  [/className=\{tw\.cardIcon\}/g, ''],
  [/className=\{tw\.checkItem\}/g, ''],
  [/className=\{tw\.finalTitle\}/g, ''],
  [/className=\{tw\.finalTitleAccent\}/g, ''],
  [/<h1 >/g, '<h1>'],
  [/<h2 >/g, '<h2>'],
  [/<h3 >/g, '<h3>'],
  [/<p >/g, '<p>'],
];

const base = new URL('../', import.meta.url);

for (const rel of files) {
  const filePath = fileURLToPath(new URL(rel, base));
  let s = fs.readFileSync(filePath, 'utf8');
  for (const [a, b] of reps) s = s.replace(a, b);
  // collaborator why grid — no --candidate modifier
  if (rel.includes('Collaborator')) {
    s = s.replace(/why-grid why-grid--candidate/g, 'why-grid');
    s = s.replace(/news-grid candidate-news-grid/g, 'news-grid');
  }
  fs.writeFileSync(filePath, s);
  console.log('reverted', filePath);
}
