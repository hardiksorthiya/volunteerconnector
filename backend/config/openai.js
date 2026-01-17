const OpenAI = require('openai');
// Use override to ensure .env file values take precedence over system env vars
require('dotenv').config({ override: true });

// Initialize OpenAI client
let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI client initialized');
} else {
  console.warn('⚠️  OPENAI_API_KEY not found in environment variables. AI chat will not work.');
}

/**
 * Get OpenAI client instance
 * @returns {OpenAI|null} OpenAI client or null if not configured
 */
const getOpenAIClient = () => {
  return openai;
};

/**
 * Check if OpenAI is configured
 * @returns {boolean}
 */
const isConfigured = () => {
  return openai !== null;
};

/**
 * Send chat message to OpenAI
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional parameters (model, temperature, etc.)
 * @returns {Promise<Object>} OpenAI response
 */
const chatCompletion = async (messages, options = {}) => {
  if (!openai) {
    throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY in .env file');
  }

  const defaultOptions = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
  };

  const chatOptions = {
    ...defaultOptions,
    ...options,
    messages: messages,
  };

  try {
    const response = await openai.chat.completions.create(chatOptions);
    return response;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    // Preserve the original error structure for better error handling
    // OpenAI SDK errors have status, statusText, and response properties
    if (error.response) {
      // Attach status code from response if available
      error.status = error.response.status;
      error.statusCode = error.response.status;
    }
    throw error;
  }
};

module.exports = {
  getOpenAIClient,
  isConfigured,
  chatCompletion,
};

