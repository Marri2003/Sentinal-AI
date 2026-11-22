/**
 * SentinelAI Supabase Client & Production Cloud Telemetry Service
 * Implements authoritative PostgreSQL cloud persistence with local resilience:
 * 1. Cloud Supabase PostgreSQL (analyses & profiles tables with RLS) is the PERMANENT SOURCE OF TRUTH.
 * 2. Automatic retry with exponential backoff for temporary network failures.
 * 3. Stable UUID primary keys for guaranteed duplicate prevention on upsert/sync.
 * 4. Transparent sync tracking: 'synced' | 'pending' | 'failed' with visible error logging.
 * 5. Automatic background synchronization of pending records when cloud is reachable.
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
 * Save or update a scan record in the local cache
 */
export function saveLocalScan(userId, record) {
  try {
    const key = getStorageKey(userId);
    const existing = getLocalScans(userId);
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
 * Retry helper with exponential backoff for database writes
 */
async function retryWithBackoff(fn, retries = 2, delayMs = 400) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
    }
  }
}

/**
 * Log a scan result to the cloud database with confirmation and local resilience.
 * - Primary: Cloud Supabase PostgreSQL 'analyses' table
 * - Fallback: Client-side storage with explicit 'pending' status
 * - Never silently discards database errors.
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
  // Resolve user ID from session if not explicitly passed
  let resolvedUserId = userId;
  if (!resolvedUserId && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      resolvedUserId = session?.user?.id || null;
    } catch {
      resolvedUserId = null;
    }
  }

  // Stable UUID for primary key and duplicate prevention
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
    sync_status: 'pending',
    last_sync_error: null
  };

  // 1. Immediately cache locally with 'pending' status
  saveLocalScan(resolvedUserId, scanRecord);

  // 2. Perform authoritative cloud insert to Supabase PostgreSQL
  if (supabase && isSupabaseConfigured) {
    try {
      const cloudResult = await retryWithBackoff(async () => {
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

        if (error) throw error;
        return data;
      }, 1, 500);

      if (cloudResult) {
        // Confirmation of successful cloud persistence
        scanRecord.sync_status = 'synced';
        scanRecord.last_sync_error = null;
        saveLocalScan(resolvedUserId, scanRecord);
        console.log('✓ Cloud persistence confirmed on Supabase PostgreSQL:', recordId);
        return { data: cloudResult, error: null, sync_status: 'synced', source: 'SUPABASE_CLOUD' };
      }
    } catch (dbErr) {
      scanRecord.sync_status = 'failed';
      scanRecord.last_sync_error = dbErr.message || 'Database write rejected';
      saveLocalScan(resolvedUserId, scanRecord);
      console.error('[Sentinel Cloud Persistence Error]:', dbErr.message || dbErr);
      return { data: scanRecord, error: dbErr.message, sync_status: 'failed', source: 'LOCAL_FALLBACK' };
    }
  }

  return { data: scanRecord, error: 'Supabase unconfigured', sync_status: 'pending', source: 'LOCAL_CACHE' };
}

/**
 * Synchronize previously cached pending/failed records to Supabase
 * Prevents duplicates by using stable UUID primary keys and upsert logic.
 */
export async function syncPendingRecords(userId) {
  if (!supabase || !isSupabaseConfigured) return;

  const localItems = getLocalScans(userId);
  const pendingItems = localItems.filter(item => item.sync_status === 'pending' || item.sync_status === 'failed');

  if (pendingItems.length === 0) return;

  for (const item of pendingItems) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .upsert({
          id: item.id,
          user_id: item.user_id,
          message_text: item.message_text,
          sender: item.sender,
          phone: item.phone,
          detected_url: item.detected_url,
          risk_score: item.risk_score,
          risk_level: item.risk_level,
          decision: item.decision,
          pipeline_scores: item.pipeline_scores,
          explainability: item.explainability,
          created_at: item.created_at
        }, { onConflict: 'id' })
        .select('id')
        .single();

      if (!error && data) {
        item.sync_status = 'synced';
        item.last_sync_error = null;
        saveLocalScan(userId, item);
      }
    } catch (syncErr) {
      console.warn('Pending sync retry failed for record:', item.id, syncErr.message);
    }
  }
}

/**
 * Retrieve user scans with Supabase PostgreSQL as the AUTHORITATIVE source of truth.
 * - Primary: Reads actual database records from Supabase cloud.
 * - Synchronizes any pending local scans.
 * - Falls back to local cache only if network or permissions fail, clearly indicating sync state.
 */
export async function getUserScans(userId, limit = 100) {
  let cloudRecords = null;
  let cloudError = null;

  // 1. Fetch from authoritative Supabase PostgreSQL database
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
        // Trigger background sync for any unsynced local records
        syncPendingRecords(userId).catch(() => {});
      } else if (error) {
        cloudError = error.message;
        console.error('[Sentinel Cloud Read Error]:', error.message, error.hint || '');
      }
    } catch (err) {
      cloudError = err.message;
      console.error('[Sentinel Cloud Network Error]:', err);
    }
  }

  // 2. If cloud read was successful, merge any in-flight pending local items not yet in cloud
  if (cloudRecords !== null) {
    const cloudIds = new Set(cloudRecords.map(r => r.id));
    const localItems = getLocalScans(userId);
    const inFlightPending = localItems.filter(item => item.sync_status !== 'synced' && !cloudIds.has(item.id));
    
    // Tag records with cloud telemetry metadata
    const finalRecords = [...inFlightPending, ...cloudRecords].slice(0, limit).map(r => ({
      ...r,
      source: cloudIds.has(r.id) ? 'SUPABASE_CLOUD' : 'IN_FLIGHT_SYNC'
    }));

    finalRecords.cloudSynced = true;
    finalRecords.cloudError = null;
    return finalRecords;
  }

  // 3. Fallback to local cache if cloud database is unreachable / permissions pending
  const fallbackRecords = getLocalScans(userId).slice(0, limit).map(r => ({
    ...r,
    source: 'LOCAL_FALLBACK'
  }));
  fallbackRecords.cloudSynced = false;
  fallbackRecords.cloudError = cloudError || 'Supabase unavailable';
  return fallbackRecords;
}

/**
 * Delete an individual scan record from both Supabase and local cache
 */
export async function deleteUserScan(scanId, userId) {
  removeLocalScan(userId, scanId);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', scanId);
      if (error) console.error('[Sentinel DB Delete Error]:', error.message);
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
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('user_id', userId);
      if (error) console.error('[Sentinel DB Clear All Error]:', error.message);
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
