import { supabase } from '@/integrations/supabase/client';

/**
 * Diagnose and fix common realtime connection issues
 */
export const diagnoseRealtimeIssues = async (): Promise<string[]> => {
  const issues: string[] = [];
  
  try {
    // Check basic connection
    const channel = supabase.channel('connection_test');
    let connectionSuccess = false;
    
    // Try to connect with a timeout
    const connectPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      channel
        .on('system', { event: 'connected' }, () => {
          clearTimeout(timeout);
          connectionSuccess = true;
          resolve();
        })
        .on('system', { event: 'error' }, (err) => {
          clearTimeout(timeout);
          reject(new Error(`Connection error: ${JSON.stringify(err)}`));
        })
        .subscribe();
    });
    
    try {
      await connectPromise;
    } catch (err) {
      issues.push(`Realtime connection failed: ${err}`);
    } finally {
      // Clean up
      supabase.removeChannel(channel);
    }
    
    // Check if tables are enabled for realtime
    const tablesToCheck = ['orders', 'ride_requests', 'notifications'];
    for (const table of tablesToCheck) {
      const testChannel = supabase.channel(`test_${table}`);
      let eventReceived = false;
      
      const testPromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 3000);
        
        testChannel
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table 
          }, () => {
            clearTimeout(timeout);
            eventReceived = true;
            resolve();
          })
          .subscribe();
      });
      
      await testPromise;
      supabase.removeChannel(testChannel);
      
      if (!eventReceived) {
        issues.push(`⚠️ No realtime events detected for table ${table}. Make sure realtime is enabled in Supabase Dashboard for this table.`);
      }
    }
    
    return issues;
  } catch (error) {
    issues.push(`Error checking realtime: ${error}`);
    return issues;
  }
};

/**
 * Attempts to fix realtime connection issues
 */
export const fixRealtimeConnection = async (): Promise<boolean> => {
  // Check if we're using localhost - if so, try 127.0.0.1 instead
  const currentUrl = localStorage.getItem('supabase-url') || '';
  
  if (currentUrl.includes('localhost')) {
    console.log('Detected localhost URL, trying 127.0.0.1 instead...');
    
    // Store the original URL in case we need to revert
    localStorage.setItem('original-supabase-url', currentUrl);
    
    // Replace localhost with 127.0.0.1
    const newUrl = currentUrl.replace('localhost', '127.0.0.1');
    localStorage.setItem('supabase-url', newUrl);
    
    // The page will need to be reloaded to take effect
    return true;
  }
  
  return false;
};

/**
 * Clears all browser storage and reloads the page
 * This can fix many realtime issues
 */
export const clearBrowserStorageAndReload = () => {
  console.log('Clearing browser storage to fix realtime issues...');
  
  // Clear localStorage except for crucial items
  const authToken = localStorage.getItem('unineeds-auth-storage-key');
  const supabaseUrl = localStorage.getItem('supabase-url');
  
  localStorage.clear();
  
  // Restore crucial items
  if (authToken) localStorage.setItem('unineeds-auth-storage-key', authToken);
  if (supabaseUrl) localStorage.setItem('supabase-url', supabaseUrl);
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear cookies related to Supabase
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (name.includes('supabase')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }
  });
  
  // Reload the page
  window.location.reload();
};

/**
 * Initialize realtime fixes by setting up Supabase client with best URL
 */
export const initRealtimeFixes = () => {
  // Check if we need to update the Supabase URL
  const storedUrl = localStorage.getItem('supabase-url');
  
  if (storedUrl && (window as any).SUPABASE_URL !== storedUrl) {
    console.log(`Using stored Supabase URL: ${storedUrl}`);
    (window as any).SUPABASE_URL = storedUrl;
  } else if (window.location.hostname === 'localhost') {
    // If we're on localhost, try IP address version too
    const currentUrl = (window as any).SUPABASE_URL || '';
    if (currentUrl.includes('localhost')) {
      const ipUrl = currentUrl.replace('localhost', '127.0.0.1');
      console.log(`Trying IP address version of Supabase URL: ${ipUrl}`);
      localStorage.setItem('supabase-url-ip', ipUrl);
    }
  }
  
  // Make helper functions available globally for debugging
  (window as any).diagnoseRealtimeIssues = diagnoseRealtimeIssues;
  (window as any).fixRealtimeConnection = fixRealtimeConnection;
  (window as any).clearBrowserStorageAndReload = clearBrowserStorageAndReload;
}; 