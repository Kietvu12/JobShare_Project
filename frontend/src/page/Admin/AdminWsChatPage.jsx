import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

/** Redirect legacy /admin/ws-chat links into Tin nhắn → tab Doanh nghiệp (WS). */
export default function AdminWsChatPage() {
  const [searchParams] = useSearchParams();
  const qs = new URLSearchParams({ tab: 'business' });
  const sessionId = searchParams.get('sessionId');
  const requestId = searchParams.get('requestId');
  if (sessionId) qs.set('sessionId', sessionId);
  if (requestId) qs.set('requestId', requestId);
  return <Navigate to={`/admin/public-ctv-chat?${qs.toString()}`} replace />;
}
