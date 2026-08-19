import React from 'react';
import { Helmet } from 'react-helmet-async';
import BusinessHeader from './BusinessHeader';
import BusinessFooter from './BusinessFooter';
import { FONT_STACK } from './businessShared.jsx';

/**
 * Shared layout for all JobShare Business landing pages.
 * Renders the shared fixed header + page content + shared footer.
 * Children must clear the fixed header themselves (the home hero already
 * has top padding; subpage iframes carry their own top spacing).
 */
export default function BusinessLandingLayout({ children, className = '' }) {
  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </Helmet>
    <div
      className={`bl-business-landing bg-white text-[#282c32] antialiased overflow-x-hidden ${className}`}
      style={{ fontFamily: FONT_STACK }}
    >
      <BusinessHeader />
      {children}
      <BusinessFooter />
    </div>
    </>
  );
}
