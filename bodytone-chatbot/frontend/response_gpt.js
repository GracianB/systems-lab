// frontend/response_gpt.js (Ultra Improved - v2.3 - Backend Error in 2xx Handling)

/**
 * ============================================================================
 *  OpenAI/GPT Provider Fetch Handler (Frontend) - v2.3
 * ============================================================================
 *
 *  Purpose:
 *  Handles frontend communication with the backend API when routing to an
 *  OpenAI GPT provider is intended. Sends payload via POST, manages timeouts,
 *  parses responses, and throws detailed, categorized errors.
 *
 *  Key Improvements in v2.3:
 *  - Robust Handling of Backend Errors in 2xx Responses:
 *    - Checks the structure of the parsed JSON from a 2xx response.
 *    - If it contains 'error' and 'error_type', it's treated as a BackendError,
 *      even if the HTTP status was technically "OK".
 *  - More specific error types returned (using an ErrorFactory pattern).
 *  - Enhanced timeout handling to always clear the timeout.
 *  - Improved robustness in parsing backend error responses (JSON or text).
 *  - Clearer JSDoc, more detailed logging.
 *  - Standardized error propagation.
 * ============================================================================
 */

// --- Configuration ---
const API_ENDPOINT = '/api/chat'; // Central API endpoint
const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds timeout for potentially long GPT responses
const PROVIDER_KEY = 'openai';    // Specific key for this provider
// -------------------

// --- Logging ---
const LOG_PREFIX = `[FETCHER:${PROVIDER_KEY.toUpperCase()} v2.3]`; // Version updated
// -------------------

// --- Standardized Error Factory (for consistency with dispatcher and other fetchers) ---
class FetcherError extends Error {
    constructor(message, name = 'FetcherError', details = {}) {
        super(message);
        this.name = name;
        this.details = details; // Will hold things like status, errorType, requestId, provider
        // Ensure standard properties are attached
        this.status = details.status;
        this.errorType = details.errorType;
        this.requestId = details.requestId;
        this.provider = details.provider || PROVIDER_KEY; // Default to this fetcher's provider
    }
}

const ErrorFactory = {
    ValidationError: (message, details) => new FetcherError(message, 'ValidationError', details),
    NetworkError: (message, details) => new FetcherError(message, 'NetworkError', details),
    TimeoutError: (message, details) => new FetcherError(message, 'TimeoutError', details),
    BackendError: (message, details) => new FetcherError(message, 'BackendError', details),
    DataProcessingError: (message, details) => new FetcherError(message, 'DataProcessingError', details),
    UnexpectedError: (message, originalError, details) => {
        const err = new FetcherError(message, 'UnexpectedError', details);
        err.originalError = originalError;
        return err;
    }
};
// -------------------------------------------------------------------------------------

export const fetchGptResponse = async (payload, timeout = DEFAULT_TIMEOUT_MS) => {
    const requestId = `fetch-${PROVIDER_KEY}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const logCtx = `${LOG_PREFIX}[${requestId}]`;
    let timeoutId = null; // For clearTimeout

    // --- 1. Input Validation & Payload Preparation ---
    try {
        if (!payload || typeof payload !== 'object') {
            throw ErrorFactory.ValidationError("Input payload must be a non-null object.", { requestId });
        }
        const { chat_id, message, preferred_ai: preferredAiInPayload } = payload;

        if (!chat_id || typeof chat_id !== 'string' || !chat_id.trim()) {
            throw ErrorFactory.ValidationError("Missing or invalid 'chat_id' (must be a non-empty string).", { requestId });
        }
        if (!message || typeof message !== 'string' || !message.trim()) {
            throw ErrorFactory.ValidationError("Missing or invalid 'message' (must be a non-empty string for GPT).", { requestId });
        }
        if (preferredAiInPayload && typeof preferredAiInPayload === 'string' && preferredAiInPayload.toLowerCase() !== PROVIDER_KEY) {
            console.warn(`${logCtx} Payload specified 'preferred_ai: ${preferredAiInPayload}'. This fetcher will hint '${PROVIDER_KEY}' to the backend.`);
        }
        payload.preferred_ai = PROVIDER_KEY; // Standardize hint

        if (typeof timeout !== 'number' || !Number.isInteger(timeout) || timeout <= 0) {
             console.warn(`${logCtx} Invalid timeout value (${timeout}). Using default: ${DEFAULT_TIMEOUT_MS}ms.`);
             timeout = DEFAULT_TIMEOUT_MS;
        }
        console.debug(`${logCtx} Payload validated. Hinting provider '${PROVIDER_KEY}'. Timeout: ${timeout}ms.`);

    } catch (validationError) {
        console.error(`${logCtx} Invalid payload for ${PROVIDER_KEY} request: ${validationError.message}`, { payload, error: validationError });
        if (!(validationError instanceof FetcherError)) {
            const newError = ErrorFactory.ValidationError(validationError.message, { requestId });
            newError.originalError = validationError;
            throw newError;
        }
        throw validationError;
    }
    // ------------------------------------

    const requestUrl = API_ENDPOINT;
    console.info(`${logCtx} Sending POST to ${requestUrl} (Provider Hint: ${PROVIDER_KEY}).`);
    console.debug(`${logCtx} Full payload being sent:`, JSON.stringify(payload));

    // --- 2. Setup Timeout Controller ---
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
        console.warn(`${logCtx} Request to ${requestUrl} is being aborted due to timeout (${timeout}ms).`);
        controller.abort();
    }, timeout);
    // -----------------------------------

    try {
        // --- 3. Perform Fetch Request ---
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;

        console.info(`${logCtx} Received response from ${requestUrl}. Status: ${response.status} ${response.statusText}`);

        // --- 4. Handle HTTP Error Status (Non-2xx) ---
        if (!response.ok) {
            let errorMsg = `Server responded with ${response.status}: ${response.statusText}`;
            let backendErrorDetails = null;
            let backendErrorType = 'UnknownBackendHttpError'; // More specific type for HTTP errors

            try {
                backendErrorDetails = await response.json();
                errorMsg = backendErrorDetails?.error || backendErrorDetails?.message || errorMsg;
                backendErrorType = backendErrorDetails?.error_type || backendErrorType;
                console.warn(`${logCtx} Backend HTTP error (Status ${response.status}). Parsed details:`, backendErrorDetails);
            } catch (parseJsonError) {
                console.warn(`${logCtx} Failed to parse backend HTTP error response (Status ${response.status}) as JSON. Reading as text.`);
                try {
                    const rawText = await response.text();
                    if (rawText) errorMsg = rawText.substring(0, 500);
                    console.error(`${logCtx} Raw backend HTTP error text (first 500 chars):`, errorMsg);
                } catch (parseTextError) {
                    console.error(`${logCtx} Failed to read backend HTTP error response body as text.`, parseTextError);
                }
            }
            throw ErrorFactory.BackendError(errorMsg, {
                status: response.status,
                errorType: backendErrorType,
                details: backendErrorDetails,
                requestId
            });
        }
        // ------------------------------------

        // --- 5. Handle Successful HTTP Response (2xx Status) ---
        let data;
        try {
            data = await response.json();
            console.info(`${logCtx} Successfully parsed backend response JSON (Status ${response.status}).`);
            console.debug(`${logCtx} Received data structure:`, data);
        } catch (parseSuccessError) {
            console.error(`${logCtx} Error parsing successful HTTP response (Status ${response.status}) as JSON.`, parseSuccessError);
            throw ErrorFactory.DataProcessingError(`Failed to parse valid backend response: ${parseSuccessError.message}`, {
                originalError: parseSuccessError,
                requestId,
                status: response.status // Include status for context
            });
        }

        // **NEW/REFINED VALIDATION: Check if the 2xx response is actually an error object from backend**
        if (data && typeof data === 'object' && data.error && data.error_type) {
            console.warn(`${logCtx} Backend returned an error structure within a 2xx response (Status ${response.status}). Treating as BackendError. Error: '${data.error_type} - ${data.error}'`);
            throw ErrorFactory.BackendError(data.error, {
                status: response.status, // Keep original 2xx status for logging, but it's an app-level error
                errorType: data.error_type,
                details: data, // The whole error object from backend
                requestId
            });
        }

        // **Strict validation of the SUCCESSFUL response structure**
        if (!data || typeof data !== 'object') {
             throw ErrorFactory.DataProcessingError("Successful response from backend is not a valid object.", { responseData: data, requestId, status: response.status });
        }
        // Check for 'reply' field - it's okay if it's an empty string, but it MUST be a string
        if (typeof data.reply !== 'string') {
            console.error(`${logCtx} Response format invalid: 'reply' field is missing or not a string. Received data:`, data);
            throw ErrorFactory.DataProcessingError("Response format invalid: 'reply' field is missing or not a string.", { responseData: data, requestId, status: response.status });
        }
        if (typeof data.ai_provider_used !== 'string' || !data.ai_provider_used.trim()) {
            console.warn(`${logCtx} Backend response 'ai_provider_used' is missing, empty, or not a string. Received:`, data.ai_provider_used);
            // Potentially add a default or handle this less strictly if 'ai_provider_used' isn't critical for the frontend logic itself
        } else if (data.ai_provider_used.toLowerCase() !== PROVIDER_KEY) {
            console.warn(`${logCtx} Backend used provider '${data.ai_provider_used}', while frontend fetcher is for '${PROVIDER_KEY}'. This might be unexpected if a specific provider was requested by the dispatcher.`);
        }
        // Optional: Validate other expected fields like context_obtained, retrieval_method if they are critical

        return data; // Resolve with validated data
        // ---------------------------------------------

    } catch (error) {
        // --- 6. Centralized Error Catching & Refinement ---
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;

        let finalError = error;

        if (error.name === 'AbortError') {
            finalError = ErrorFactory.TimeoutError(`Request Timeout: The ${PROVIDER_KEY} request exceeded ${timeout / 1000} seconds.`, { requestId });
        } else if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
            finalError = ErrorFactory.NetworkError(`Network Error: Could not connect to the backend API at ${requestUrl}. Check network and server status.`, { requestId });
        } else if (!(error instanceof FetcherError)) {
            console.warn(`${logCtx} Caught an unclassified error ('${error.name}'), classifying as UnexpectedError:`, error.message);
            finalError = ErrorFactory.UnexpectedError(`Unexpected issue during ${PROVIDER_KEY} request: ${error.message}`, error, { requestId });
        }
        finalError.requestId = finalError.requestId || requestId;
        finalError.provider = finalError.provider || PROVIDER_KEY;

        console.error(
            `${logCtx} Final error for ${PROVIDER_KEY} request (${finalError.name}): ${finalError.message}`,
            (finalError.status ? ` Status: ${finalError.status}` : ''),
            (finalError.errorType ? ` BackendType: ${finalError.errorType}` : ''),
            (finalError.details && Object.keys(finalError.details).length > 0 ? ` Details: ${JSON.stringify(finalError.details)}` : ''),
            finalError
        );
        throw finalError;
        // --------------------------------------------------
    }
};
// ============================================================================
//                       End of frontend/response_gpt.js
// ============================================================================