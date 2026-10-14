import React, { useEffect, useState } from 'react';
import { useCandidateCopy } from '../lib/useCandidateCopy';

export default function CandidateBackToTop() {
  const { ui } = useCandidateCopy();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 650);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a href="#top" className={`back-top${show ? ' show' : ''}`} aria-label={ui.top}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m6 14 6-6 6 6M12 8v13" />
      </svg>
    </a>
  );
}
