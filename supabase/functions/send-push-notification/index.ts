import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface PushNotificationPayload {
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
  target_user?: string;
  target_device_ids?: string[];
}

interface FCMMessage {
  to?: string;
  registration_ids?: string[];
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  data?: any;
  webpush?: {
    headers: {
      TTL: string;
    };
    notification: {
      icon: string;
      badge: string;
      click_action?: string;
    };
  };
}

async function sendFCMNotification(tokens: string[], notification: any): Promise<{ success: boolean; results?: any; error?: string }> {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  
  if (!fcmServerKey) {
    console.warn('FCM_SERVER_KEY not configured, skipping FCM send');
    return { success: false, error: 'FCM_SERVER_KEY not configured' };
  }

  // Split tokens into batches of 1000 (FCM limit)
  const batchSize = 1000;
  const batches = [];
  for (let i = 0; i < tokens.length; i += batchSize) {
    batches.push(tokens.slice(i, i + batchSize));
  }

  const results = [];

  for (const batch of batches) {
    const message: FCMMessage = {
      registration_ids: batch,
      notification: {
        title: notification.title,
        body: notification.message,
        icon: '/assets/images/icon.png',
      },
      data: {
        ...notification.data,
        notification_id: notification.id,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      webpush: {
        headers: {
          TTL: '86400', // 24 hours
        },
        notification: {
          icon: '/assets/images/icon.png',
          badge: '/assets/images/icon.png',
          click_action: '/',
        },
      },
    };

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${fcmServerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FCM request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      results.push(result);
      
      console.log(`FCM batch sent successfully:`, {
        success: result.success || 0,
        failure: result.failure || 0,
        canonical_ids: result.canonical_ids || 0,
      });
    } catch (error) {
      console.error('Error sending FCM batch:', error);
      results.push({ error: error.message });
    }
  }

  const totalSuccess = results.reduce((sum, result) => sum + (result.success || 0), 0);
  const totalFailure = results.reduce((sum, result) => sum + (result.failure || 0), 0);

  return {
    success: totalSuccess > 0,
    results: {
      total_sent: totalSuccess,
      total_failed: totalFailure,
      batches: results.length,
      details: results,
    },
  };
}

async function sendExpoNotification(tokens: string[], notification: any): Promise<{ success: boolean; results?: any; error?: string }> {
  // Filter tokens to only include Expo push tokens
  const expoPushTokens = tokens.filter(token => token.startsWith('ExponentPushToken'));
  
  if (expoPushTokens.length === 0) {
    return { success: false, error: 'No Expo push tokens found' };
  }

  const messages = expoPushTokens.map(token => ({
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.message,
    data: {
      ...notification.data,
      notification_id: notification.id,
    },
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo push request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Expo push sent successfully:', result);

    return {
      success: true,
      results: result,
    };
  } catch (error) {
    console.error('Error sending Expo push notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const payload: PushNotificationPayload = await req.json();

      console.log('Processing push notification:', {
        type: payload.type,
        title: payload.title,
        target_user: payload.target_user,
      });

      // If this is called from a trigger, the notification might already exist
      // Otherwise, create a new notification record
      let notificationId = payload.data?.notification_id;
      
      if (!notificationId) {
        const { data: notification, error: insertError } = await supabase
          .from('notifications')
          .insert({
            type: payload.type,
            title: payload.title,
            message: payload.message,
            data: payload.data,
            target_user: payload.target_user,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to insert notification: ${insertError.message}`);
        }

        notificationId = notification.id;
      }

      // Get FCM tokens for target users
      let fcmTokensQuery = supabase
        .from('user_profiles')
        .select('fcm_token, user_id, device_type')
        .not('fcm_token', 'is', null);

      if (payload.target_user) {
        fcmTokensQuery = fcmTokensQuery.eq('user_id', payload.target_user);
      } else if (payload.target_device_ids && payload.target_device_ids.length > 0) {
        fcmTokensQuery = fcmTokensQuery.in('user_id', payload.target_device_ids);
      }

      const { data: userProfiles, error: profilesError } = await fcmTokensQuery;

      if (profilesError) {
        throw new Error(`Failed to get user profiles: ${profilesError.message}`);
      }

      console.log(`Found ${userProfiles?.length || 0} user profiles with FCM tokens`);

      const allTokens = userProfiles?.map(profile => profile.fcm_token).filter(Boolean) || [];
      
      // Separate FCM tokens from Expo tokens
      const fcmTokens = allTokens.filter(token => !token.startsWith('ExponentPushToken'));
      const expoTokens = allTokens.filter(token => token.startsWith('ExponentPushToken'));

      const sendResults = [];

      // Send FCM notifications
      if (fcmTokens.length > 0) {
        console.log(`Sending FCM notifications to ${fcmTokens.length} tokens`);
        const fcmResult = await sendFCMNotification(fcmTokens, {
          id: notificationId,
          title: payload.title,
          message: payload.message,
          data: payload.data,
        });
        sendResults.push({ type: 'fcm', ...fcmResult });
      }

      // Send Expo notifications
      if (expoTokens.length > 0) {
        console.log(`Sending Expo notifications to ${expoTokens.length} tokens`);
        const expoResult = await sendExpoNotification(expoTokens, {
          id: notificationId,
          title: payload.title,
          message: payload.message,
          data: payload.data,
        });
        sendResults.push({ type: 'expo', ...expoResult });
      }

      // Determine overall success
      const overallSuccess = sendResults.some(result => result.success);

      // Update notification status
      if (notificationId) {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            status: overallSuccess ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
          })
          .eq('id', notificationId);

        if (updateError) {
          console.error('Failed to update notification status:', updateError);
        }
      }

      return new Response(
        JSON.stringify({
          success: overallSuccess,
          notification_id: notificationId,
          recipients: userProfiles?.length || 0,
          fcm_tokens: fcmTokens.length,
          expo_tokens: expoTokens.length,
          send_results: sendResults,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // GET request - fetch recent notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ notifications }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Notification function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process notification',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});