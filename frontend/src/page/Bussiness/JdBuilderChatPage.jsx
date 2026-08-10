import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Route cũ — chuyển về Quản lý JD (JobManagement + JobAiBuilderPanel). */
const JdBuilderChatPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/business/jobs/create', { replace: true });
  }, [navigate]);

  return null;
};

export default JdBuilderChatPage;
