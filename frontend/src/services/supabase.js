/**
 * SentinelAI Supabase Client & Telemetry Service
 * Handles user authentication, scan logging, and crowdsourced spam intelligence.
 */
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Clean URL: strip /rest/v1 or trailing slashes so any URL format works seamlessly
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

// Create singleton client (or null if unconfigured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Register a new user with email and password
 */
export async function signUp(email, password, fullName = '') {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase is not configured yet. Add credentials to .env.' } };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || email.split('@')[0] },
    },
  });
  return { data, error };
}

/**
 * Sign in existing user with email and password
 */
export async function signIn(email, password) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase is not configured yet. Add credentials to .env.' } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Resend email confirmation link for an unconfirmed user
 */
export async function resendConfirmation(email) {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase is not configured yet. Add credentials to .env.' } };
  }
  return await supabase.auth.resend({
    type: 'signup',
    email,
  });
}

/**
 * Sign out current user
 */
export async function signOut() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

/**
 * Log a scan result to the database for history & community telemetry.
 * Accepts an explicit userId to avoid async race conditions when the caller
 * already has the authenticated user from the global AuthContext.
 */
export async function logScanToCommunity({
  userId = null,          // Explicitly passed by caller (preferred over async getCurrentUser)
  messageText,
  sender,
  phone,
  detectedUrl,
  riskScore,
  decision,
  confidence,
  pipelineScores,
  explainability,
}) {
  if (!supabase) return null;
  try {
    // Fallback: resolve user from session if caller didn't pass userId
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      resolvedUserId = session?.user?.id || null;
    }

    const riskLevel = riskScore >= 0.7 ? 'HIGH' : riskScore >= 0.4 ? 'MEDIUM' : 'LOW';

    const { data, error } = await supabase.from('analyses').insert({
      user_id: resolvedUserId,
      message_text: messageText || '',
      sender: sender || '',
      phone: phone || '',
      detected_url: detectedUrl || '',
      risk_score: riskScore,
      risk_level: riskLevel,
      decision: decision,
      pipeline_scores: pipelineScores || {},
      explainability: explainability || {},
    }).select('id').single();

    if (error) {
      console.warn('Telemetry log warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Telemetry error:', err);
    return null;
  }
}

/**
 * Check how many other SentinelAI users have received similar spam/phishing messages
 * Queries the analyses table for matching sender or text patterns
 */
export async function getCommunitySpamCount(sender = '', messageText = '') {
  if (!supabase) {
    // If Supabase not yet connected, return simulated baseline for demo verification
    return { count: 0, isLive: false };
  }

  try {
    let query = supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('decision', 'SPAM');

    const cleanSender = sender.trim().toLowerCase();
    if (cleanSender && cleanSender !== 'unknown') {
      query = query.ilike('sender', cleanSender);
    } else if (messageText && messageText.length > 10) {
      // Extract key scam words from text (e.g. "kyc", "blocked", "lottery", "electricity")
      const keywords = ['kyc', 'block', 'suspend', 'lottery', 'electricity', 'pancard', 'refund', 'urgent'];
      const matchedWord = keywords.find(w => messageText.toLowerCase().includes(w));
      if (matchedWord) {
        query = query.ilike('message_text', `%${matchedWord}%`);
      }
    }

    const { count, error } = await query;
    if (error) {
      console.warn('Error fetching community count:', error.message);
      return { count: 0, isLive: true };
    }
    return { count: count || 0, isLive: true };
  } catch (err) {
    console.warn('Community count query error:', err);
    return { count: 0, isLive: false };
  }
}

/**
 * Fetch past scan history for the current logged-in user.
 * Uses getSession() (reads from localStorage, no network round-trip) to reliably
 * get the user ID even immediately after page load / browser refresh.
 */
export async function getUserScanHistory(limit = 20) {
  if (!supabase) return [];

  // getSession() reads the persisted JWT from localStorage — no async latency
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Error fetching history:', error.message);
    return [];
  }
  return data || [];
}
}
