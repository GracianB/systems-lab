/**
 * ============================================================================
 *  Central AI Response & Interaction Module - v6.0.0 (Robust & Refined)
 * ============================================================================
 *
 *  Key Improvements in v6.0.0:
 *  - Full Dependency Validation: The initialization context is now rigorously
 *    checked to prevent runtime errors like the one fixed from v5.6.0.
 *  - Clearer State Management: Explicitly manages `isAwaitingFollowUp` and
 *    `currentFlowOption` to handle multi-turn conversations correctly.
 *    Clicking a quick action button now definitively starts a new flow.
 *  - Enhanced TTS Logic: More robust error handling, state management, and
 *    interaction with the audio player. Stops previous audio when a new
 *    one is requested.
 *  - Refactored Handlers: `handleSendMessage` is broken down into smaller,
 *    more readable helper functions (`_prepareForSend`, `_displayUserMessage`, etc.).
 *  - Improved Error Messaging: User-facing error messages are more helpful
 *    and context-aware (e.g., distinguishing network vs. server errors).
 * ============================================================================
 */

'use strict';

// --- Provider-Specific Imports ---
import { fetchOllamaResponse } from './response_ollama.js';
import { fetchGptResponse } from './response_gpt.js';
// import { fetchGoogleResponse } from './response_google.js';

// --- Configuration ---
const DEFAULT_AI_PROVIDER_KEY = 'openai';
const LOG_PREFIX = "[RESPONSE_DISPATCHER v6.0.0]";
const TTS_API_ENDPOINT = '/api/tts/piper';
const SCROLL_DELAYS = {
    AFTER_USER_MESSAGE: 75,
    AFTER_BOT_RESPONSE: 120,
    FINAL_CLEANUP: 180
};
const TTS_REQUEST_TIMEOUT_MS = 15000;

// --- Module State & Context ---
let _isInitialized = false;
let _elements = {};
let _state = {};
let _helpers = {};
let _constants = {};
let _css = {};

/**
 * Validates the context object passed during initialization.
 * @param {object} context The context object from the main script.
 * @returns {boolean} True if the context is valid.
 * @throws {Error} If validation fails.
 */
function _validateInitializationContext(context) {
    const required = {
        elements: ['messageInput', 'sendMessageButton', 'chatMessagesContainer', 'piperTtsAudioPlayer', 'notificationSoundElement'],
        state: ['chatId', 'currentPlayingTTSMessageId', 'isTTSError', 'isChatOpen', 'isAwaitingFollowUp', 'currentFlowOption'],
        helpers: ['appendMessage', 'announceToSr', 'updateInputState', 'autoResizeTextarea', 'showTypingIndicator', 'scrollToBottom', 'sanitizeHtml'],
        constants: ['FEEDBACK_RESET_DELAY_MS', 'TYPING_INDICATOR_SCROLL_DELAY_MS'],
        css: ['QUICK_ACTION_DISABLED', 'ACTION_BTN_SUCCESS', 'ACTION_BTN_ERROR', 'PLAY_TTS_BUTTON_CLASS', 'PLAY_TTS_BUTTON_LOADING', 'PLAY_TTS_BUTTON_PLAYING', 'INFO_CARD_LINK_CLASS', 'INLINE_LINK_CLASS']
    };

    if (!context || typeof context !== 'object') throw new Error("Initialization context is missing or not an object.");

    for (const category of Object.keys(required)) {
        if (!context[category] || typeof context[category] !== 'object')
            throw new Error(`Init failed: Missing or invalid context category '${category}'.`);
        for (const key of required[category]) {
            if (context[category][key] === undefined) {
                if(category === 'elements' && key === 'notificationSoundElement') {
                    console.warn(`${LOG_PREFIX} Optional element 'notificationSoundElement' is missing in context. Sound notifications disabled.`);
                    continue;
                }
                throw new Error(`Init failed: Missing required context key '${key}' in '${category}'.`);
            }
            if (category === 'helpers' && typeof context[category][key] !== 'function')
                throw new Error(`Init failed: Helper '${key}' is not a function.`);
        }
    }
    if (!context.elements?.piperTtsAudioPlayer || !(context.elements.piperTtsAudioPlayer instanceof HTMLAudioElement)) {
        throw new Error("Init failed: 'piperTtsAudioPlayer' element missing or not an HTMLAudioElement.");
    }
    return true;
}

/**
 * Initializes the response module with necessary dependencies.
 * @param {object} context - The context object containing elements, state, helpers, etc.
 */
export function initializeResponseModule(context) {
    if (_isInitialized) {
        console.warn(`${LOG_PREFIX} Module already initialized.`);
        return;
    }
    console.log(`${LOG_PREFIX} Initializing...`);
    try {
        _validateInitializationContext(context);
    } catch (error) {
        console.error(`${LOG_PREFIX} CRITICAL: Context validation failed:`, error.message);
        throw new Error(`Response module init failed: ${error.message}`);
    }
    _elements = context.elements;
    _state = context.state;
    _helpers = context.helpers;
    _constants = context.constants;
    _css = context.css;
    _isInitialized = true;
    console.log(`${LOG_PREFIX} Initialized successfully.`);
}

function checkInitialized(functionName) {
    if (!_isInitialized) {
        const errorMsg = `${LOG_PREFIX} FATAL: '${functionName}' called before initialization.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}

function ensureLatestMessageVisible(behavior = "smooth") {
    if (!_elements.chatMessagesContainer) return;
    const lastMessage = _elements.chatMessagesContainer.querySelector('article[data-message-id]:last-child');
    if (lastMessage) {
        try {
            lastMessage.scrollIntoView({ behavior, block: 'end' });
        } catch (e) {
            _helpers.scrollToBottom('auto');
        }
    }
}

// --- Piper TTS Playback Logic ---
function _updateTTSButtonState(buttonEl, ttsButtonState) {
    if (!buttonEl) return;
    buttonEl.classList.remove(_css.PLAY_TTS_BUTTON_LOADING, _css.PLAY_TTS_BUTTON_PLAYING, _css.ACTION_BTN_ERROR);
    buttonEl.disabled = false;
    const playIcon = buttonEl.querySelector('.play-icon');
    const pauseIcon = buttonEl.querySelector('.pause-icon');
    const spinnerIcon = buttonEl.querySelector('.spinner-icon');
    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'none';
    if (spinnerIcon) spinnerIcon.style.display = 'none';

    switch (ttsButtonState) {
        case 'loading':
            buttonEl.disabled = true;
            buttonEl.setAttribute('aria-label', 'Cargando audio');
            if (spinnerIcon) spinnerIcon.style.display = 'inline-block';
            buttonEl.classList.add(_css.PLAY_TTS_BUTTON_LOADING);
            break;
        case 'playing':
            buttonEl.setAttribute('aria-label', 'Pausar audio');
            if (pauseIcon) pauseIcon.style.display = 'inline-block';
            buttonEl.classList.add(_css.PLAY_TTS_BUTTON_PLAYING);
            break;
        case 'error':
            buttonEl.setAttribute('aria-label', 'Error al reproducir. Reintentar.');
            if (playIcon) playIcon.style.display = 'inline-block';
            buttonEl.classList.add(_css.ACTION_BTN_ERROR);
            break;
        case 'idle':
        default:
            buttonEl.setAttribute('aria-label', 'Reproducir mensaje con voz');
            if (playIcon) playIcon.style.display = 'inline-block';
            break;
    }
}

async function _handlePlayTTSRequest(textToSpeak, messageId, playButtonElement) {
    const logCtx = `${LOG_PREFIX}[TTS:${messageId}]`;
    checkInitialized('_handlePlayTTSRequest');
    console.log(`${logCtx} Requesting TTS for: "${textToSpeak.substring(0, 70)}..."`);

    if (_state.currentPlayingTTSMessageId && _state.currentPlayingTTSMessageId !== messageId) {
        _elements.piperTtsAudioPlayer.pause();
        if (_elements.piperTtsAudioPlayer.src && _elements.piperTtsAudioPlayer.src.startsWith('blob:')) {
            URL.revokeObjectURL(_elements.piperTtsAudioPlayer.src);
        }
        _elements.piperTtsAudioPlayer.src = "";
        const oldButton = _elements.chatMessagesContainer.querySelector(`.${_css.PLAY_TTS_BUTTON_CLASS}[data-message-id="${_state.currentPlayingTTSMessageId}"]`);
        if (oldButton) _updateTTSButtonState(oldButton, 'idle');
    }

    _state.currentPlayingTTSMessageId = messageId;
    _state.isTTSError = false;
    _updateTTSButtonState(playButtonElement, 'loading');
    _helpers.announceToSr("Generando audio del mensaje...", "polite");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(TTS_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'audio/wav' },
            body: JSON.stringify({ text: textToSpeak, message_id: messageId }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorDetail = `Error del servidor TTS: ${response.status} ${response.statusText}`;
            try { const errData = await response.json(); errorDetail = errData.error || errorDetail; } catch (e) { /* ignore */ }
            throw new Error(errorDetail);
        }

        const audioBlob = await response.blob();
        if (!audioBlob || audioBlob.size === 0) throw new Error("Recibido archivo de audio vacío.");

        const audioUrl = URL.createObjectURL(audioBlob);
        const player = _elements.piperTtsAudioPlayer;
        player.src = audioUrl;

        const cleanup = () => {
            player.removeEventListener('play', onAudioPlay);
            player.removeEventListener('pause', onAudioPause);
            player.removeEventListener('ended', onAudioEnded);
            player.removeEventListener('error', onAudioError);
        };
        const onAudioPlay = () => _updateTTSButtonState(playButtonElement, 'playing');
        const onAudioPause = () => { if (!player.ended) _updateTTSButtonState(playButtonElement, 'idle'); };
        const onAudioEnded = () => {
            _updateTTSButtonState(playButtonElement, 'idle');
            URL.revokeObjectURL(audioUrl);
            if (_state.currentPlayingTTSMessageId === messageId) _state.currentPlayingTTSMessageId = null;
            cleanup();
        };
        const onAudioError = (e) => {
            console.error(`${logCtx} HTMLAudioPlayer error:`, e);
            _updateTTSButtonState(playButtonElement, 'error');
            _helpers.announceToSr("Error al reproducir el audio.", "assertive");
            _state.isTTSError = true;
            if (player.src && player.src.startsWith('blob:')) URL.revokeObjectURL(player.src);
            if (_state.currentPlayingTTSMessageId === messageId) _state.currentPlayingTTSMessageId = null;
            cleanup();
        };

        cleanup(); // Limpiar listeners anteriores por si acaso
        player.addEventListener('play', onAudioPlay);
        player.addEventListener('pause', onAudioPause);
        player.addEventListener('ended', onAudioEnded);
        player.addEventListener('error', onAudioError);
        
        await player.play();
        _helpers.announceToSr("Reproduciendo audio del mensaje.", "polite");

    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`${logCtx} TTS request/playback failed:`, error);
        _updateTTSButtonState(playButtonElement, 'error');
        _helpers.announceToSr(`Error al generar audio: ${error.message.substring(0, 100)}`, "assertive");
        _state.isTTSError = true;
        if (_state.currentPlayingTTSMessageId === messageId) _state.currentPlayingTTSMessageId = null;
    }
}

// --- Core Interaction Handlers ---
export const handleMessagesContainerClick = (event) => {
    checkInitialized('handleMessagesContainerClick');
    const { target } = event;
    const actionButton = target.closest('.message__action-btn');

    if (actionButton) {
        event.preventDefault();
        const action = actionButton.dataset.action;
        const msgArticle = actionButton.closest('article[data-message-id]');
        const messageId = msgArticle?.dataset.messageId;
        if (!messageId) return;

        if (action === 'play-tts') {
            const msgTextElement = msgArticle?.querySelector('.message__text');
            if (msgTextElement) {
                const textToSpeak = (msgTextElement.textContent || '').trim();
                if (textToSpeak) {
                    if (_state.currentPlayingTTSMessageId === messageId && !_elements.piperTtsAudioPlayer.paused) {
                        _elements.piperTtsAudioPlayer.pause();
                    } else {
                        _handlePlayTTSRequest(textToSpeak, messageId, actionButton);
                    }
                } else { _helpers.announceToSr("No hay texto para reproducir.", 'assertive'); }
            }
            return;
        }

        if (action === 'copy') {
            const msgElemForCopy = msgArticle?.querySelector('.message__text');
            const textToCopy = msgElemForCopy?.innerText || '';
            navigator.clipboard.writeText(textToCopy).then(() => {
                _helpers.announceToSr("Mensaje copiado."); actionButton.setAttribute('aria-label', '¡Texto Copiado!');
                actionButton.classList.add(_css.ACTION_BTN_SUCCESS);
                setTimeout(() => { actionButton.setAttribute('aria-label', 'Copiar mensaje'); actionButton.classList.remove(_css.ACTION_BTN_SUCCESS); }, _constants.FEEDBACK_RESET_DELAY_MS);
            }).catch(err => {
                console.error(`${LOG_PREFIX} Error copying text:`, err); _helpers.announceToSr("Error al copiar.", 'assertive');
                actionButton.classList.add(_css.ACTION_BTN_ERROR);
                setTimeout(() => actionButton.classList.remove(_css.ACTION_BTN_ERROR), _constants.FEEDBACK_RESET_DELAY_MS);
            });
        } else if (action === 'report') {
            _helpers.announceToSr("Reportar este mensaje aún no está implementado.");
        }
        return;
    }

    const quickButton = target.closest('.message__quick-action-btn');
    if (quickButton && !quickButton.disabled) {
        event.preventDefault();
        const query = quickButton.dataset.query;
        const initialOptionFromButton = quickButton.dataset.option;
        if (query && _elements.messageInput) {
            quickButton.closest('.message__quick-actions')?.querySelectorAll('button').forEach(btn => { btn.disabled = true; btn.classList.add(_css.QUICK_ACTION_DISABLED); });
            _elements.messageInput.value = query;
            _helpers.autoResizeTextarea(); _helpers.updateInputState();
            handleSendMessage(null, initialOptionFromButton || null);
            _helpers.announceToSr(`Enviando sugerencia: ${query}`);
        }
    }
};

function _prepareForSend() {
    if (!_elements.messageInput || _elements.sendMessageButton?.disabled) return false;
    _elements.messageInput.disabled = true;
    _elements.messageInput.setAttribute('aria-disabled', 'true');
    if (_elements.sendMessageButton) {
        _elements.sendMessageButton.disabled = true;
        _elements.sendMessageButton.setAttribute('aria-disabled', 'true');
    }
    return true;
}

function _displayUserMessageAndClearInput(userMessageText, messageExchangeId) {
    if (userMessageText) {
        _helpers.appendMessage(userMessageText, 'user', { customMessageId: `${messageExchangeId}-user` });
    }
    setTimeout(() => ensureLatestMessageVisible("smooth"), SCROLL_DELAYS.AFTER_USER_MESSAGE);
    if (_elements.messageInput) _elements.messageInput.value = '';
    _helpers.autoResizeTextarea();
    _helpers.updateInputState();
}

function _constructUserErrorMessage(error, messageExchangeId) {
    let displayError = "Lo siento, un error inesperado ha ocurrido. Por favor, inténtalo de nuevo más tarde.";
    const logCtx = `${LOG_PREFIX}[Exchange:${messageExchangeId}]`;
    if (error instanceof Error) {
        console.error(`${logCtx} Constructing user error from:`, error);
        if (error.name === 'NetworkError' || error.name === 'TimeoutError' || error.message.includes('Failed to fetch')) {
            displayError = "Error de conexión. Por favor, verifica tu conexión a internet.";
        } else if (error.status === 429) {
            displayError = "Demasiadas solicitudes. Por favor, espera un momento antes de reintentar.";
        } else if (error.message) {
            displayError = `Ha ocurrido un problema: ${error.message.substring(0, 150)}`;
        }
    }
    return `${displayError} (Ref: ${messageExchangeId.split('-').pop()})`;
}

function _restoreUiAfterSend(keepInputDisabled = false) {
    _helpers.showTypingIndicator(false);
    if (_elements.messageInput && !keepInputDisabled) {
        _elements.messageInput.disabled = false;
        _elements.messageInput.removeAttribute('aria-disabled');
        if (_state.isChatOpen && document.body.contains(_elements.messageInput)) {
            _elements.messageInput.focus();
        }
    }
    _helpers.updateInputState();
    setTimeout(() => ensureLatestMessageVisible("smooth"), SCROLL_DELAYS.FINAL_CLEANUP);
}

export const handleSendMessage = async (event = null, explicitInitialOption = null) => {
    checkInitialized('handleSendMessage');
    if (event) event.preventDefault();

    const userMessageText = _elements.messageInput?.value.trim() || "";

    if (explicitInitialOption) {
        _state.isAwaitingFollowUp = false;
        _state.currentFlowOption = explicitInitialOption;
    }

    if (!userMessageText && !explicitInitialOption && !_state.isAwaitingFollowUp) {
        return;
    }

    if (!_prepareForSend()) return;

    const messageExchangeId = `exch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logCtx = `${LOG_PREFIX}[Exchange:${messageExchangeId}]`;
    
    let optionToSend = explicitInitialOption;
    if (!optionToSend && _state.isAwaitingFollowUp && _state.currentFlowOption) {
        // En un seguimiento, el backend debe saber el flujo. Se puede enviar la opción actual
        // o, si el backend lo maneja por chat_id, no enviar nada.
        // Por claridad, es mejor NO enviar la opción para que el backend sepa que es un seguimiento.
    }
    
    console.log(`${logCtx} Sending. Text: "${userMessageText.substring(0, 50)}...", Option Sent: "${optionToSend || 'None'}", Is Follow-up: ${_state.isAwaitingFollowUp}`);
    
    _displayUserMessageAndClearInput(userMessageText, messageExchangeId);
    _helpers.showTypingIndicator(true);

    const payload = {
        chat_id: _state.chatId,
        message: userMessageText,
        ...(optionToSend && { initial_option: optionToSend })
    };

    try {
        const data = await getAIResponse(payload);
        console.info(`${logCtx} Backend response received.`, data);

        _state.isAwaitingFollowUp = data.expects_follow_up || false;
        if (!_state.isAwaitingFollowUp) {
            _state.currentFlowOption = null;
        } else if (optionToSend) {
            _state.currentFlowOption = optionToSend;
        }

        _helpers.appendMessage(
            data.reply || "(No se pudo generar una respuesta)",
            'bot',
            {
                isError: false,
                quickActions: data.quick_actions || [],
                customMessageId: `${messageExchangeId}-bot`
            }
        );
        if (_elements.notificationSoundElement && _state.settings?.notificationSound) {
            _elements.notificationSoundElement.play().catch(e => console.warn("Could not play notification sound:", e));
        }

    } catch (error) {
        const displayError = _constructUserErrorMessage(error, messageExchangeId);
        _helpers.appendMessage(displayError, 'bot', { isError: true, customMessageId: `${messageExchangeId}-error` });
        _state.isAwaitingFollowUp = false;
        _state.currentFlowOption = null;
    } finally {
        _restoreUiAfterSend(false);
    }
};

// --- AI RESPONSE DISPATCHER (getAIResponse) ---
const providerFetchFunctions = {
    'ollama': fetchOllamaResponse,
    'openai': fetchGptResponse,
    // 'google': fetchGoogleResponse,
};

export const getAIResponse = async (payload, timeout) => {
    const callId = `dispatch-${Date.now().toString().slice(-5)}`;
    const logCtx = `${LOG_PREFIX}[${callId}]`;
    checkInitialized('getAIResponse');

    try {
        if (!payload || typeof payload !== 'object' || !payload.chat_id) throw new Error("Invalid payload or missing chat_id.");
    } catch (validationError) {
        console.error(`${logCtx} Dispatch validation error:`, validationError);
        throw validationError;
    }

    const providerKey = (payload.preferred_ai || DEFAULT_AI_PROVIDER_KEY).toLowerCase();
    const fetchFunction = providerFetchFunctions[providerKey];
    const availableProviders = Object.keys(providerFetchFunctions);

    if (!fetchFunction) {
        console.warn(`${logCtx} Provider '${providerKey}' not found. Falling back to default or first available.`);
        const fallbackProviderKey = availableProviders.includes(DEFAULT_AI_PROVIDER_KEY.toLowerCase())
            ? DEFAULT_AI_PROVIDER_KEY.toLowerCase()
            : availableProviders[0];
        if (!fallbackProviderKey) {
            const error = new Error("CRITICAL: No AI provider fetch functions are configured.");
            console.error(`${logCtx} ${error.message}`);
            throw error;
        }
        console.log(`${logCtx} Using fallback provider: '${fallbackProviderKey}'`);
        return await providerFetchFunctions[fallbackProviderKey](payload, timeout);
    }

    console.info(`${logCtx} Dispatching to provider: '${providerKey}'.`);
    try {
        const responseData = await fetchFunction(payload, timeout);
        if (!responseData || typeof responseData.reply !== 'string') {
            throw new Error(`Invalid response structure from '${providerKey}'.`);
        }
        console.info(`${logCtx} Successfully received response via '${providerKey}'.`);
        return responseData;
    } catch (error) {
        console.error(`${logCtx} Error during dispatch to '${providerKey}':`, error);
        error.provider = providerKey;
        throw error;
    }
};

// --- Initial Self-Check ---
(() => {
     const availableFetchers = Object.keys(providerFetchFunctions).filter(k => typeof providerFetchFunctions[k] === 'function');
     console.log(`${LOG_PREFIX} Module loaded. Default AI Provider: '${DEFAULT_AI_PROVIDER_KEY}'. Mapped Fetchers: [${availableFetchers.join(', ')}].`);
     if (availableFetchers.length === 0) console.error(`${LOG_PREFIX} CRITICAL: No provider fetch functions available!`);
})();