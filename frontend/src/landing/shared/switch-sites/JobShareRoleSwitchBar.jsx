import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import collaboratorUi from '../../templates/JobShare_Collaborator_V3/ui-content.json';
import candidateUi from '../../templates/JobShare_Candidate_V1_1_20261006/ui-content.json';
import { getLocaleFromPathname, resolveCandidatePrefix, withLocalePath } from '../../../utils/localeRoutes';
import { useLanguage } from '../../../context/LanguageContext';
import { IconBusiness, IconCandidate, IconCollaborator } from './roleIcons';
import { useRoleBarHeight } from './useRoleBarHeight';

const PERSONAS = [
  { id: 'collaborator', Icon: IconCollaborator },
  { id: 'candidate', Icon: IconCandidate },
  { id: 'business', Icon: IconBusiness },
];

function personaHref(personaId, locale) {
  if (personaId === 'collaborator') return withLocalePath(locale, '/');
  if (personaId === 'candidate') return resolveCandidatePrefix(`/${locale}/candidate`);
  return withLocalePath(locale, '/business');
}

export default function JobShareRoleSwitchBar({ activePersona = 'collaborator' }) {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const barRef = useRoleBarHeight();
  const locale = getLocaleFromPathname(pathname) || language || 'vi';
  const uiPack = activePersona === 'candidate' ? candidateUi : collaboratorUi;
  const ui = uiPack[locale] || uiPack.vi;

  return (
    <div ref={barRef} className="jobshare-role-switch-bar role-bar" role="navigation" aria-label={ui.roles?.join(' / ')}>
      <div className="wrap role-intro">{ui.roleIntro}</div>
      <nav className="wrap roles" aria-label={ui.roles?.join(' / ')}>
        {PERSONAS.map(({ id, Icon }, index) => {
          const active = id === activePersona;
          const href = personaHref(id, locale);
          const title = ui.roles?.[index] || id;
          const sub = ui.roleSub?.[index] || '';
          const inner = (
            <>
              <Icon />
              <span>
                <strong>{title}</strong>
                <small>{sub}</small>
              </span>
            </>
          );

          return href.startsWith('/') && !href.startsWith('//') ? (
            <Link key={id} to={href} className="role" aria-current={active ? 'page' : undefined}>
              {inner}
            </Link>
          ) : (
            <a key={id} href={href} className="role">
              {inner}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
