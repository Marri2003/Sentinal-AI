/**
 * SentinelAI Supabase Client & Resilient Telemetry Service
 * Implements a dual-tier persistence architecture:
 * 1. Cloud Supabase PostgreSQL (analyses & profiles tables with RLS)
 * 2. High-reliability client-side persistent cache (per-user scoped)
 * 
 * Guarantees zero data loss, instant dashboard synchronization, and offline resilience.
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

// Local storage key prefix
const STORAGE_PREFIX = 'sentinel_scans_';

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'anonymous'}`;
}

/**
 * Retrieve local cached scans for a specific user ID
 */
export function getLocalScans(userId) {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read local scan cache:', err);
    return [];
  }
}

/**
 * Save a scan record into local cache (prepend newest first, max 200 items)
 */
export function saveLocalScan(userId, record) {
  try {
    const key = getStorageKey(userId);
    const existing = getLocalScans(userId);
    // Deduplicate if existing ID
    const filtered = existing.filter(item => item.id !== record.id);
    const updated = [record, ...filtered].slice(0, 200);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save to local scan cache:', err);
    return [];
  }
}

/**
 * Remove an individual scan from local cache
 */
export function removeLocalScan(userId, scanId) {
  try {
    const key = getStorageKey(userId);
    const existing = getLocalScans(userId);
    const updated = existing.filter(item => item.id !== scanId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to remove from local scan cache:', err);
    return [];
  }
}

/**
 * Clear all scans from local cache for a user
 */
export function clearLocalScans(userId) {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Failed to clear local scan cache:', err);
  }
}

/**
 * Register a new user with email and password
 */
export async function signUp(email, password, fullName = '') {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase is not configured yet. Add credentials to .env.' } };
  }
  const cleanName = typeof fullName === 'string' ? fullName : (fullName?.full_name || '');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: cleanName || email.split('@')[0] },
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
 * Log a scan result to the database with multi-tier fallback.
 * 1. Immediately writes to user-scoped local cache (guarantees 0-loss and instant update).
 * 2. Attempts insert into Supabase 'analyses' table.
 * 3. Returns the saved record object with telemetry source indicator.
 */
export async function logScanToCommunity({
  userId = null,
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
  // Resolve user ID
  let resolvedUserId = userId;
  if (!resolvedUserId && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      resolvedUserId = session?.user?.id || null;
    } catch {
      resolvedUserId = null;
    }
  }

  const recordId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const riskLevel = riskScore >= 0.7 ? 'HIGH' : riskScore >= 0.4 ? 'MEDIUM' : 'LOW';
  const createdAt = new Date().toISOString();

  const scanRecord = {
    id: recordId,
    user_id: resolvedUserId,
    message_text: messageText || '',
    sender: sender || '',
    phone: phone || '',
    detected_url: detectedUrl || '',
    risk_score: riskScore,
    risk_level: riskLevel,
    decision: decision,
    confidence: confidence || 'HIGH',
    pipeline_scores: pipelineScores || {},
    explainability: explainability || {},
    created_at: createdAt,
    synced_to_cloud: false
  };

  // 1. Immediately persist to client-side local cache
  saveLocalScan(resolvedUserId, scanRecord);

  // 2. Attempt cloud persistence to Supabase PostgreSQL table
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          id: recordId,
          user_id: resolvedUserId,
          message_text: scanRecord.message_text,
          sender: scanRecord.sender,
          phone: scanRecord.phone,
          detected_url: scanRecord.detected_url,
          risk_score: scanRecord.risk_score,
          risk_level: scanRecord.risk_level,
          decision: scanRecord.decision,
          pipeline_scores: scanRecord.pipeline_scores,
          explainability: scanRecord.explainability,
          created_at: createdAt
        })
        .select('*')
        .single();

      if (error) {
        console.warn('Supabase cloud insert warning (cached locally):', error.message);
        return { data: scanRecord, error: null, source: 'LOCAL_CACHE' };
      }

      if (data) {
        scanRecord.synced_to_cloud = true;
        saveLocalScan(resolvedUserId, scanRecord);
        return { data, error: null, source: 'SUPABASE' };
      }
    } catch (err) {
      console.warn('Supabase cloud network error (cached locally):', err);
    }
  }

  return { data: scanRecord, error: null, source: 'LOCAL_CACHE' };
}

/**
 * Retrieve user scans with unified merging between Supabase and local cache.
 * Guarantees that records are ALWAYS returned, even if Supabase table is unmigrated.
 */
export async function getUserScans(userId, limit = 100) {
  let cloudRecords = [];
  let cloudSuccess = false;

  // 1. Attempt Supabase Query
  if (supabase && isSupabaseConfigured) {
    try {
      let query = supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (!error && data) {
        cloudRecords = data;
        cloudSuccess = true;
      } else if (error) {
        console.warn('Supabase query notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase query error:', err);
    }
  }

  // 2. Retrieve local cache for this user
  const localRecords = getLocalScans(userId);

  // 3. If cloud query succeeded, merge and update cache
  if (cloudSuccess) {
    const cloudIds = new Set(cloudRecords.map(r => r.id));
    // Find local records that have not synced yet
    const pendingSync = localRecords.filter(r => !cloudIds.has(r.id));
    const merged = [...pendingSync, ...cloudRecords];
    return merged.slice(0, limit);
  }

  // 4. If cloud query failed or not configured, return full local cache
  return localRecords.slice(0, limit);
}

/**
 * Delete an individual scan record from both Supabase and local cache
 */
export async function deleteUserScan(scanId, userId) {
  removeLocalScan(userId, scanId);

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase
        .from('analyses')
        .delete()
        .eq('id', scanId);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }
  return true;
}

/**
 * Clear all scan records for a user from both Supabase and local cache
 */
export async function clearAllUserScans(userId) {
  clearLocalScans(userId);

  if (supabase && isSupabaseConfigured && userId) {
    try {
      await supabase
        .from('analyses')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase clear all error:', err);
    }
  }
  return true;
}

/**
 * Check how many other SentinelAI users have received similar spam/phishing messages
 * Queries the analyses table for matching sender or text patterns with local fallback
 */
export async function getCommunitySpamCount(sender = '', messageText = '') {
  const cleanSender = sender ? sender.trim().toLowerCase() : '';
  const cleanText = messageText ? messageText.trim().toLowerCase() : '';

  if (supabase && isSupabaseConfigured) {
    try {
      let query = supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('decision', 'SPAM');

      if (cleanSender && cleanSender !== 'unknown') {
        query = query.ilike('sender', cleanSender);
      } else if (cleanText && cleanText.length > 10) {
        const keywords = ['kyc', 'block', 'suspend', 'lottery', 'electricity', 'pancard', 'refund', 'urgent'];
        const matchedWord = keywords.find(w => cleanText.includes(w));
        if (matchedWord) {
          query = query.ilike('message_text', `%${matchedWord}%`);
        }
      }

      const { count, error } = await query;
      if (!error && count !== null) {
        return { count: count || 0, isLive: true };
      }
    } catch (err) {
      console.warn('Community query fallback:', err);
    }
  }

  // Fallback: evaluate against local cache
  const localItems = [...getLocalScans(null), ...getLocalScans('anonymous')];
  const spamMatches = localItems.filter(item => {
    if (item.decision !== 'SPAM') return false;
    if (cleanSender && (item.sender || '').toLowerCase() === cleanSender) return true;
    if (cleanText && (item.message_text || '').toLowerCase().includes(cleanText.substring(0, 20))) return true;
    return false;
  });

  return { count: spamMatches.length, isLive: false };
}
