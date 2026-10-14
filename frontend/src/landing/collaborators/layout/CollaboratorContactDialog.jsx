import React from 'react';
import { useCollaboratorChrome } from '../context/CollaboratorChromeContext';
import { useCollaboratorCopy } from '../lib/useCollaboratorCopy';

export default function CollaboratorContactDialog() {
  const { contactRef } = useCollaboratorChrome();
  const { source } = useCollaboratorCopy();

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
