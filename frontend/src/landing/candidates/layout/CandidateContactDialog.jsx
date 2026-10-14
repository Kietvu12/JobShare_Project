import React from 'react';
import { useCandidateChrome } from '../context/CandidateChromeContext';
import { useCandidateCopy } from '../lib/useCandidateCopy';

export default function CandidateContactDialog() {
  const { contactRef } = useCandidateChrome();
  const { source } = useCandidateCopy();

  return (
    <dialog ref={contactRef} className="contact-dialog">
      <div className="contact-dialog-inner">
        <h2>{source.footerContactTitle}</h2>
        <address>{source.footerContactLocation}</address>
        <a href="https://ws-jobshare.com/">{source.footerLinkUrl}</a>
        <a className="footer-phone" href="tel:+84972899728">
          {source.footerContactPhone}
        </a>
        <form method="dialog">
          <button type="submit" className="btn btn-primary">
            OK
          </button>
        </form>
      </div>
    </dialog>
  );
}
