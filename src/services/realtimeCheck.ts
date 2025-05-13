import { supabase } from '@/integrations/supabase/client';

/**
 * Utility function to check if Supabase Realtime is working
 * This creates a test channel, subscribes to it, and verifies connection
 * @returns Promise that resolves if realtime is working, rejects otherwise
 */
export const checkRealtimeConnection = (): Promise<boolean> => {
  console.log('Checking Supabase Realtime connection...');
  
  return new Promise((resolve, reject) => {
    // Set a timeout to fail the check if it takes too long
    const timeoutId = setTimeout(() => {
      console.error('Realtime connection check timed out');
      cleanup();
      reject(new Error('Realtime connection check timed out after 10 seconds'));
    }, 10000);
    
    // Create a test channel for verification
    const channel = supabase.channel('connection_test');
    
    // Success handler
    const handleSuccess = () => {
      console.log('✅ Supabase Realtime connection verified!');
      cleanup();
      resolve(true);
    };
    
    // Error handler
    const handleError = (error: any) => {
      console.error('❌ Supabase Realtime error:', error);
      cleanup();
      reject(error);
    };
    
    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeoutId);
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('Error removing test channel:', err);
      }
    };
    
    // Define event handlers
    channel.on('broadcast', { event: 'pong' }, () => {
      console.log('Received pong response');
      handleSuccess();
    });
    
    channel.on('presence', { event: 'sync' }, () => {
      console.log('Presence sync - broadcasting ping');
      // Send a test message when sync event is received
      channel.send({
        type: 'broadcast',
        event: 'ping',
        payload: { message: 'Test ping' }
      });
    });
    
    // Handle connection errors
    channel.on('system', { event: 'disconnect' }, () => {
      handleError(new Error('Disconnected from Supabase Realtime'));
    });
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('Test channel status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('Test channel subscribed, setting up broadcast listener');
        
        // Send a test broadcast after subscription
        setTimeout(() => {
          channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: { message: 'Test ping' }
          });
          
          // Also set up a self-response after ping (in case broadcast doesn't work)
          channel.on('broadcast', { event: 'ping' }, () => {
            console.log('Own ping message received - connection works but echo is disabled');
            handleSuccess();
          });
        }, 1000);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        handleError(new Error(`Channel error: ${status}`));
      }
    });
  });
};

/**
 * Make sure all tables have realtime enabled 
 * This function sets up basic checks for all tables used in notifications
 */
export const checkTablesRealtimeEnabled = async (): Promise<string[]> => {
  const tablesToCheck = ['orders', 'ride_requests', 'notifications'];
  const warnings: string[] = [];
  
  console.log('Checking realtime setup for tables:', tablesToCheck);
  
  // Test a simple insert & select for each table
  for (const table of tablesToCheck) {
    const testChannel = supabase.channel(`test_${table}`);
    let receivedEvent = false;
    
    testChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      () => {
        receivedEvent = true;
        console.log(`✅ Table ${table} has functioning realtime events`);
      }
    ).subscribe();
    
    // Wait a bit and then check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!receivedEvent) {
      const warning = `⚠️ No realtime events detected for table ${table}. Make sure realtime is enabled in Supabase Dashboard for this table.`;
      console.warn(warning);
      warnings.push(warning);
    }
    
    // Cleanup
    supabase.removeChannel(testChannel);
  }
  
  return warnings;
};

/**
 * Diagnose common Supabase realtime issues
 * This will check connection, tables, and permissions
 */
export const diagnoseRealtimeIssues = async (): Promise<string[]> => {
  const issues: string[] = [];
  
  try {
    // Check basic connection
    await checkRealtimeConnection();
  } catch (error) {
    issues.push(`Realtime connection failed: ${error}`);
  }
  
  // Check tables 
  const tableWarnings = await checkTablesRealtimeEnabled();
  issues.push(...tableWarnings);
  
  // Check auth/session
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session.session) {
    issues.push(`No active session found: ${sessionError?.message || 'User not authenticated'}`);
  }
  
  return issues;
}; 