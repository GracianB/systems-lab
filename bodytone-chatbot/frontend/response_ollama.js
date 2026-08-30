// frontend/response_ollama.js (Optimized Frontend Handler - v4.0)

/**
 * ============================================================================
 *  Ollama Provider Fetch Handler (Frontend) - v4.0
 * ============================================================================
 *
 *  Purpose:
 *  - Handles frontend communication with the central backend API endpoint,
 *    specifically indicating a preference for the Ollama provider.
 *  - Uses the native Fetch API with AbortController for timeouts.
 *  - Provides detailed, categorized error handling compatible with response.js v5.3.
 *  - Includes robust logging with unique request IDs.
 *
 *  Improvements in v4.0:
 *  - Standardized error names for direct use by response.js error handling.
 *  - Ensured requestId is attached to all thrown error objects.
 *  - Refined backend error parsing to extract 'error' and 'error_type'.
 *  - Improved logging clarity and consistency.
 *  - Enhanced JSDoc for better understanding.
 *  - Explicitly sets 'preferred_ai' hint for Ollama.
 * ============================================================================
 */

// --- Configuration ---
const API_ENDPOINT = '/api/chat'; // Central backend endpoint URL
const DEFAULT_TIMEOUT_MS = 120000; // 120 seconds (Ollama might need time)
// -------------------

// --- Constants ---
const LOG_PREFIX = "[response_ollama.js]";
// Standardized Error Names (match names used in response.js error handling)
const VALIDATION_ERROR = 'ValidationError';
const NETWORK_ERROR = 'NetworkError';
const TIMEOUT_ERROR = 'TimeoutError';
const BACKEND_ERROR = 'BackendError'; // Errors originating from the backend server (e.g., 5xx, 4xx handled server-side)
const DATA_PROCESSING_ERROR = 'DataProcessingError'; // Errors parsing/validating response data
const UNEXPECTED_ERROR = 'UnexpectedError'; // Fallback for unclassified errors
// -------------------
 
export const fetchOllamaResponse = async (payload, timeout = DEFAULT_TIMEOUT_MS) => {
    // Generate a unique ID for this specific fetch attempt
    const requestId = `ollama-fetch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const logCtx = `${LOG_PREFIX}[${requestId}]`; // Context for logging

    // --- 1. Input Validation & Preparation ---
    try {
        if (!payload || typeof payload !== 'object') {
            throw new Error("Input payload must be a non-null object.");
        }
        // chat_id and message should have been validated by the dispatcher (response.js)
        // but a lightweight check here adds robustness.
        if (!payload.chat_id || typeof payload.chat_id !== 'string') {
            throw new Error("Payload missing or invalid 'chat_id'.");
        }
        if (typeof payload.message !== 'string') { // Allow empty string if needed later, but validate type
            throw new Error("Payload 'message' must be a string.");
        }

        // Ensure preferred_ai hint is correctly set for Ollama for this specific fetcher
        if (payload.preferred_ai && payload.preferred_ai.toLowerCase() !== 'ollama') {
             console.warn(`${logCtx} Payload had 'preferred_ai=${payload.preferred_ai}'. Overriding hint to 'ollama' for this fetcher.`);
        }
        payload.preferred_ai = 'ollama'; // Explicitly set the hint

        // Validate timeout type and value, use default if invalid
        if (typeof timeout !== 'number' || !Number.isInteger(timeout) || timeout <= 0) {
             console.warn(`${logCtx} Invalid timeout value provided (${timeout}). Using default: ${DEFAULT_TIMEOUT_MS}ms.`);
             timeout = DEFAULT_TIMEOUT_MS;
        }
        console.debug(`${logCtx} Payload prepared for Ollama request.`);

    } catch (validationError) {
        console.error(`${logCtx} Internal payload preparation failed: ${validationError.message}`, payload);
        // Ensure error conforms to expected structure
        validationError.name = VALIDATION_ERROR;
        validationError.requestId = requestId;
        throw validationError;
    }
    // -----------------------------

    const requestUrl = API_ENDPOINT;
    console.log(`${logCtx} Sending POST to ${requestUrl} (Hint: Ollama). Timeout: ${timeout}ms.`);
    console.debug(`${logCtx} Payload:`, JSON.stringify(payload)); // Log sanitized or truncated payload in production

    // --- 2. Abort Controller for Timeout ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.warn(`${logCtx} Request timed out after ${timeout}ms. Aborting fetch.`);
        controller.abort(); // Trigger the AbortError
    }, timeout);
    // -------------------------------

    try {
        // --- 3. Execute Fetch Request ---
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // Explicitly expect JSON back
            },
            body: JSON.stringify(payload),
            signal: controller.signal // Link fetch to the abort controller
        });
        // ------------------------

        // --- Request completed (HTTP success or error), clear the timeout ---
        clearTimeout(timeoutId);
        console.log(`${logCtx} Response received from backend. Status: ${response.status} ${response.statusText}`);

        // --- 4. Handle HTTP Response Status Codes ---
        if (!response.ok) { // Status code is NOT in the 200-299 range
            let errorMsg = `Server responded with ${response.status}: ${response.statusText}`;
            let backendErrorDetails = null;
            // Default to backend's generic type, or unknown if backend doesn't provide one
            let backendErrorType = 'UnknownBackendError';

            // Attempt to parse structured error details from the backend response body
            try {
                backendErrorDetails = await response.json();
                // Prioritize specific fields from our standardized backend error response
                const specificMsg = backendErrorDetails?.error; // User-facing message from backend
                const specificType = backendErrorDetails?.error_type; // Technical type from backend

                if (specificMsg && typeof specificMsg === 'string') {
                    errorMsg = specificMsg; // Use backend's user-friendly message
                }
                if (specificType && typeof specificType === 'string') {
                    backendErrorType = specificType; // Use backend's specific error type
                }
                console.warn(`${logCtx} Backend returned error ${response.status}. Parsed details:`, backendErrorDetails);
            } catch (parseJsonError) {
                console.warn(`${logCtx} Failed to parse backend error response as JSON (Status: ${response.status}). Attempting to read as text.`);
                // Fallback: Try reading raw text if JSON parsing fails
                try {
                    const rawText = await response.text();
                    console.error(`${logCtx} Raw backend error response text (first 500 chars):`, rawText.substring(0, 500));
                    // Only use raw text snippet if we didn't get a specific message from JSON
                    if (errorMsg === `Server responded with ${response.status}: ${response.statusText}`) {
                         errorMsg = `Backend error (Status ${response.status}): ${rawText.substring(0, 200) || response.statusText}`;
                    }
                } catch (parseTextError) {
                    console.error(`${logCtx} Failed to read error response body as text.`, parseTextError);
                     // Use the original HTTP status text if all parsing fails
                     errorMsg = `Backend Request Failed (${response.status}): ${response.statusText}`;
                }
            }

            // Construct and throw a categorized BackendError
            const backendError = new Error(errorMsg); // Use the most specific message obtained
            backendError.name = BACKEND_ERROR; // Standardized name
            backendError.status = response.status;
            backendError.errorType = backendErrorType; // Store specific type from backend
            backendError.details = backendErrorDetails; // Attach parsed JSON details if available
            backendError.requestId = requestId; // Attach request ID
            throw backendError;
        }
        // ----------------------------------------

        // --- 5. Handle Successful Response (2xx) ---
        let data;
        try {
            data = await response.json();
            console.log(`${logCtx} Successfully parsed backend response JSON.`);
            console.debug(`${logCtx} Received data:`, data); // Be cautious logging full replies in prod

        } catch (parseError) {
            console.error(`${logCtx} Error parsing successful response body (Status: ${response.status}) as JSON.`, parseError);
            const processingError = new Error(`Failed to parse successful backend response: ${parseError.message}`);
            processingError.name = DATA_PROCESSING_ERROR;
            processingError.requestId = requestId;
            throw processingError;
        }

        // **Strictly validate the expected successful response structure**
        if (!data || typeof data !== 'object') {
            const validationError = new Error("Response is not a valid JSON object.");
            validationError.name = DATA_PROCESSING_ERROR;
            validationError.details = data; // Include received data for debugging
            validationError.requestId = requestId;
            throw validationError;
        }
        if (typeof data.reply !== 'string') {
            // The backend API contract guarantees a 'reply' string on success
            const validationError = new Error("Response format invalid: required 'reply' field is missing or not a string.");
            validationError.name = DATA_PROCESSING_ERROR;
            validationError.details = data;
            validationError.requestId = requestId;
            throw validationError;
        }
        // Log warnings for empty or whitespace-only replies, but still return them
        if (!data.reply.trim()) {
             console.warn(`${logCtx} Backend returned an empty or whitespace-only reply string.`);
        }

        // Add provider hint to the response data (might be useful for dispatcher or UI)
        data.provider = 'ollama';

        return data; // Resolve the promise with the validated data
        // -----------------------------------------

    } catch (error) {
        // --- 6. Centralized Error Catching & Final Categorization ---
        clearTimeout(timeoutId); // Ensure timeout is always cleared on error

        let finalError = error; // Start with the error that was caught/thrown

        // Standardize the error name if it's not already one we expect
        if (error.name === 'AbortError') {
            // Fetch was aborted by our timeout controller
            finalError = new Error(`Request Timeout: The request to Ollama backend exceeded ${timeout / 1000} seconds.`);
            finalError.name = TIMEOUT_ERROR;
        } else if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
            // Browsers often throw this TypeError for network issues (CORS, DNS, offline, refused connection)
            finalError = new Error(`Network Error: Unable to connect to the backend API at ${requestUrl}. Please check the network connection and ensure the backend server is running.`);
            finalError.name = NETWORK_ERROR;
        } else if (!(error instanceof Error)) {
            // Handle rare cases where a non-Error type might be thrown
             console.error(`${logCtx} Non-error type thrown:`, error);
             finalError = new Error(`An unexpected issue occurred: ${String(error)}`);
             finalError.name = UNEXPECTED_ERROR;
        } else if (![VALIDATION_ERROR, NETWORK_ERROR, TIMEOUT_ERROR, BACKEND_ERROR, DATA_PROCESSING_ERROR].includes(error.name)) {
            // If it's a generic Error or another type not specifically handled, classify it as Unexpected
            console.warn(`${logCtx} Caught unclassified error (${error.name}), marking as ${UNEXPECTED_ERROR}:`, error);
            // Preserve original message and potentially stack, but standardize the name
            const unexpected = new Error(`Unexpected issue: ${error.message}`);
            unexpected.name = UNEXPECTED_ERROR;
            unexpected.originalError = error; // Keep original error for inspection if needed
            finalError = unexpected;
        }

        // Ensure requestId is attached to the final error object for traceability
        finalError.requestId = finalError.requestId || requestId; // Use existing if set, otherwise add it

        // Log the categorized error before throwing
        console.error(
            `${logCtx} Error during Ollama fetch (${finalError.name}): ${finalError.message}`,
            // Include extra details if available
            (finalError.status ? ` Status: ${finalError.status}` : ''),
            (finalError.errorType ? ` Type: ${finalError.errorType}` : ''),
            (finalError.details ? ` Details: ${JSON.stringify(finalError.details)}` : ''),
            finalError // Log the full error object for stack trace etc. in browser console
        );

        throw finalError; // Re-throw the consistently named and enriched error
        // ----------------------------------------------------
    }
};
// ============================================================================
//                       End of frontend/response_ollama.js
// ============================================================================