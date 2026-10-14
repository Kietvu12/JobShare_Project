import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCollaboratorChrome } from '../context/CollaboratorChromeContext';
import { COLLABORATOR_LOGO_WHITE } from '../lib/collaboratorAssets';
import { buildCollaboratorNavLinks } from '../lib/collaboratorNav';
import { useCollaboratorCopy } from '../lib/useCollaboratorCopy';

export default function CollaboratorFooter() {
  const { pathname } = useLocation();
  const { source } = useCollaboratorCopy();
  const { openContact } = useCollaboratorChrome();
  const links = buildCollaboratorNavLinks(pathname);

  const exploreHrefs = [links.jobs, links.about, links.partners, links.blog];
  const exploreLabels = source.footerExploreLinks || [];
  const supportLabels = source.footerSupportLinks || [];

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src={COLLABORATOR_LOGO_WHITE} alt="JobShare" width={1563} height={468} loading="lazy" decoding="async" />
            <p>{source.footerDesc}</p>
          </div>
          <div>
            <h3>{source.footerExploreTitle}</h3>
            <ul>
              {exploreLabels.map((label, i) => (
                <li key={label}>
                  {i === 2 ? (
                    <a href={exploreHrefs[i]}>{label}</a>
                  ) : (
                    <Link to={exploreHrefs[i]}>{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{source.footerSupportTitle}</h3>
            <ul>
              <li>
                <a href={links.guide}>{supportLabels[0]}</a>
              </li>
              <li>
                <a href={links.faq}>{supportLabels[1]}</a>
              </li>
              <li>
                <a href="#">{supportLabels[2]}</a>
              </li>
              <li>
                <button type="button" className="footer-contact" onClick={openContact}>
                  {supportLabels[3]}
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3>{source.footerContactTitle}</h3>
            <address>{source.footerContactLocation}</address>
            <p className="footer-subtitle">{source.footerContactInfoTitle}</p>
            <a className="footer-phone" href="tel:+84972899728">
              {source.footerContactPhone}
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Workstation JobShare</span>
          <a href="https://ws-jobshare.com/">{source.footerLinkUrl}</a>
        </div>
      </div>
    </footer>
  );
}
