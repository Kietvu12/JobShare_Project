import React from 'react';
import { AdminAddJobPage } from '../Admin/AddJobPage';

/** Wrapper — chiều cao full để 2 cột scroll độc lập */
const BusinessAddJobPage = () => (
  <div className="h-full min-h-0 w-full min-w-0 flex flex-col overflow-hidden px-1 sm:px-2">
    <AdminAddJobPage portal="business" />
  </div>
);

export default BusinessAddJobPage;
