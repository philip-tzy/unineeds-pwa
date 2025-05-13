import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initDatabaseFixes } from './helpers/databaseFixes';
import { checkDatabasePermissions } from './integrations/supabase/client';
import { initRealtimeFixes } from './helpers/realtimeFixes';

// Initialize realtime fixes first (this might update the Supabase URL)
initRealtimeFixes();

// Setup global fetch timeout - 30 seconds max for any fetch request
const originalFetch = window.fetch;
window.fetch = function fetchWithTimeout(...args: any[]) {
  const [resource, config] = args;
  
  // Skip timeout for non-API requests
  if (typeof resource === 'string' && 
      !resource.includes('supabase') && 
      !resource.includes('/api/') &&
      !resource.includes('/auth/')) {
    return originalFetch(resource, config);
  }
  
  // Implement timeout for API requests
  const timeout = 30000; // 30 seconds
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Add abort signal to config
  const updatedConfig = {
    ...(config || {}),
    signal: controller.signal
  };
  
  return Promise.race([
    originalFetch(resource, updatedConfig)
      .then(response => {
        clearTimeout(timeoutId);
        return response;
      }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network request timeout')), timeout)
    )
  ]).catch(error => {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Network request timeout');
    }
    throw error;
  });
};

// Function to clear all caches
const clearAllCaches = async () => {
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear service worker caches
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    console.log('All caches cleared');
  }
  
  // Clear service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    console.log('Service workers unregistered');
  }
  
  return true;
};

// Make clearAllCaches available globally for debugging
(window as any).clearAllCaches = clearAllCaches;

// Initialize database fixes to resolve permission issues
// This needs to run early to fix errors before components mount
initDatabaseFixes();

// Make database permission check available globally for debugging
(window as any).checkDatabasePermissions = checkDatabasePermissions;

// Register service worker for PWA with improved error handling
if ('serviceWorker' in navigator) {
  // Delay service worker registration until after page load
  window.addEventListener('load', () => {
    // Don't register service worker if in login page to avoid caching issues
    if (window.location.pathname.includes('/login')) {
      console.log('Skipping SW registration on login page');
      // Unregister any existing service workers on login page
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('SW unregistered on login page');
        }
      });
    } else {
      const swUrl = './service-worker.js';
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content is available; please refresh.');
                  } else {
                    console.log('Content is cached for offline use.');
                  }
                }
              });
            }
          });
        })
        .catch(registrationError => {
          console.error('SW registration failed: ', registrationError);
        });
        
      // Handle controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed');
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
