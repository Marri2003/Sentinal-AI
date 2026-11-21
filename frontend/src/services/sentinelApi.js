/**
 * SentinelAI API Client Service
 * Communicates with the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Health check endpoint
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Predict phishing risk from text, image, and metadata
 * @param {Object} data - { text, image, metadata: { sender, url, timestamp } }
 */
export async function predictPhishing(data) {
  const payload = {
    text: data.text || '',
    image: data.image || null,
    metadata: {
      sender: data.metadata?.sender || '',
      url: data.metadata?.url || '',
      timestamp: data.metadata?.timestamp || new Date().toISOString()
    }
  };

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `API request failed with status ${response.status}`;
    try {
      const err = JSON.parse(errorText);
      message = err.message || err.detail || message;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * Generate LLM-based explanation/justification
 */
export async function getJustification(result, language = 'english', originalMessage = '') {
  const payload = {
    final_score: result.final_score,
    decision: result.decision,
    confidence: result.confidence,
    pipeline_scores: result.pipeline_scores,
    explainability: result.explainability,
    fusion_weights_used: result.fusion_weights_used,
    language,
    original_message: originalMessage
  };

  try {
    const response = await fetch(`${API_BASE_URL}/justify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Justification endpoint status ${response.status}`);
    }

    const data = await response.json();
    return data.justification;
  } catch (err) {
    console.error('Error fetching justification:', err);
    throw err;
  }
}
