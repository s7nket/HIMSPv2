import React, { useEffect, useState } from 'react';
import { checkServerHealth } from '../utils/api';

const ServerHealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState('checking');
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      console.log('🔍 Checking server health on app load...');
      const result = await checkServerHealth();

      if (result.healthy) {
        console.log('✅ Server is healthy');
        setHealthStatus('healthy');
        setHealthData(result.data);
      } else {
        console.log('❌ Server is unhealthy');
        setHealthStatus('unhealthy');
        setHealthData(result.error);
      }
    };

    checkHealth();
  }, []);

  if (healthStatus === 'healthy') {
    return null; // Don't show anything if server is healthy
  }

  /*
    UI/UX Enhancement: Replaced hard-coded colors with CSS variables
    from the new design system (defined in Login.css/Navigation.css).
    This makes the banner theme-consistent.
    - Added a box-shadow to lift it off the page.
    - Used --color-danger and --color-warning for status.
  */
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      // UI/UX Enhancement: Use theme variables
      background: healthStatus === 'unhealthy' ? 'var(--color-danger)' : 'var(--color-warning)',
      color: 'white',
      padding: '10px 16px', // Increased padding
      textAlign: 'center',
      fontSize: '14px',
      zIndex: 9999,
      // UI/UX Enhancement: Add shadow
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      {healthStatus === 'checking' && '🔄 Checking server connection...'}
      {healthStatus === 'unhealthy' && '⚠️ Backend server is not responding. Please start the server with "npm run dev" in the backend folder.'}
    </div>
  );
};

export default ServerHealthCheck;