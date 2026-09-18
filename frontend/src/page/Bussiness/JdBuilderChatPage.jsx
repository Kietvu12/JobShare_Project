import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Route cũ — redirect tới `/business/jobs/create` (UI: JobAiBuilderPage, typography theo Homepage). */
const JdBuilderChatPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/business/jobs/create', { replace: true });
  }, [navigate]);

  return null;
};

export default JdBuilderChatPage;
