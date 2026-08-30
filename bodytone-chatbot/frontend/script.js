/**
 * ============================================================================
 *  Main Frontend Script for CS Chat Widget - v6.0.6 (The Final Menu)
 * ============================================================================
 *
 *  Key Improvements in v6.0.6:
 *  - **Definitive & Complete Welcome Menu**: The welcome menu now features five
 *    clear, distinct, and essential user actions. No more mixing, no more
 *    omissions. All primary user intents are directly accessible.
 *    - Resolver un Problema (RAG)
 *    - Buscar un Manual (CSV/Direct)
 *    - Estado de mi Envío (API)
 *    - Disponibilidad de Productos (API)
 *    - Abrir un Ticket (Zendesk Forms)
 *  - Corrected all previous dependency issues (`INLINE_LINK_CLASS`).
 *  - All advanced features (Markdown, info cards, etc.) are maintained.
 *  - This version is intended to be robust, complete, and logical.
 * ============================================================================
 */

// --- Strict Mode & Module Scope ---
'use strict';

// --- Library Verification ---
if (typeof DOMPurify === 'undefined') {
    const errorMsg = "CRITICAL: DOMPurify library not found. HTML sanitization will be basic and potentially insecure. Include DOMPurify script in HTML before this script.";
    console.error(errorMsg);
}

// --- Module Imports ---
import { initializeResponseModule, handleSendMessage, handleMessagesContainerClick } from './response.js';
import { initializeVoiceInput } from './transcribe.js';
import { initializeSettings, openSettingsModal, closeSettingsModal } from './settings.js';

// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    const SCRIPT_LOG_PREFIX = "[script.js v6.0.6]"; // Version updated
    console.log(`${SCRIPT_LOG_PREFIX} DOM Ready. Initializing Chat Widget...`);

    // --- Constants ---
    const CSS = Object.freeze({
        WIDGET_OPEN: 'chat-widget--open',
        WIDGET_CLOSED: 'chat-widget--closed',
        WIDGET_MINIMIZED: 'chat-widget--minimized',
        WIDGET_MAXIMIZED: 'chat-widget--maximized',
        MESSAGE_NO_AVATAR: 'message--no-avatar',
        SR_OPTIMIZED: 'sr-optimized',
        INPUT_BTN_DISABLED: 'chat-widget__input-btn--disabled',
        COUNTER_WARN: 'chat-widget__char-counter--warning',
        COUNTER_ERROR: 'chat-widget__char-counter--error',
        QUICK_ACTION_DISABLED: 'message__quick-action-btn--disabled',
        ACTION_BTN_SUCCESS: 'message__action-btn--success',
        ACTION_BTN_ERROR: 'message__action-btn--error',
        PLAY_TTS_BUTTON_CLASS: 'message__action-btn--play-tts',
        PLAY_TTS_BUTTON_LOADING: 'is-loading',
        PLAY_TTS_BUTTON_PLAYING: 'is-playing',
        MODAL_OVERLAY_VISIBLE: 'is-visible',
        SETTINGS_STATUS_VISIBLE: 'is-visible',
        SETTINGS_STATUS_SUCCESS: 'settings-form__status--success',
        SETTINGS_STATUS_ERROR: 'settings-form__status--error',
        SETTINGS_STATUS_LOADING: 'settings-form__status--loading',
        INFO_CARD_LINK_CLASS: 'message__info-card-link',
        INLINE_LINK_CLASS: 'message__inline-link'
    });

    const TIMINGS = Object.freeze({
        FOCUS_DELAY_MS: 150,
        FEEDBACK_RESET_DELAY_MS: 1500,
        SETTINGS_FEEDBACK_DELAY_MS: 3000,
        ARIA_LIVE_DELAY_MS: 75,
        MODAL_TRANSITION_DURATION_MS: 300,
        SCROLL_TO_BOTTOM_DELAY_MS: 50,
        TYPING_INDICATOR_SCROLL_DELAY_MS: 60
    });

    const FOCUSABLE_ELEMENTS_SELECTOR = 'a[href]:not([tabindex="-1"]), button:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([type="hidden"]):not([tabindex="-1"]), select:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

    // --- Element Selection ---
    const querySelector = (selector, parent = document) => parent.querySelector(selector);

    const selectElements = (selectors, essentialKeys = []) => {
        const selected = {};
        let hasFatalError = false;
        const missingEssential = [];

        for (const key in selectors) {
            try {
                selected[key] = querySelector(selectors[key]);
                if (!selected[key]) {
                    if (essentialKeys.includes(key)) {
                        missingEssential.push(key);
                        hasFatalError = true;
                    } else {
                        console.warn(`${SCRIPT_LOG_PREFIX} Optional element not found for key '${key}' (selector: '${selectors[key]}').`);
                    }
                }
            } catch (e) {
                console.error(`${SCRIPT_LOG_PREFIX} Error selecting element for key '${key}' (selector: '${selectors[key]}'):`, e);
                selected[key] = null;
                if (essentialKeys.includes(key)) {
                    missingEssential.push(`${key} (due to error)`);
                    hasFatalError = true;
                }
            }
        }
        if (hasFatalError) {
            console.error(`${SCRIPT_LOG_PREFIX} Fatal error: Missing essential DOM elements: [${missingEssential.join(', ')}].`);
        }
        return { elements: selected, error: hasFatalError, missingEssential };
    };

    const elementSelectors = {
        chatWidget: '#bodytone-chat-widget',
        toggleButton: '#chat-toggle-btn',
        chatContainer: '#chat-container',
        chatBody: '#chat-body',
        chatMessagesContainer: '#chat-messages',
        messageForm: '#message-form',
        messageInput: '#message-input',
        sendMessageButton: '#send-message',
        charCounter: '#message-counter',
        messageInputError: '#message-input-error',
        closeButton: '#close-chat',
        minimizeButton: '#minimize-chat-btn',
        typingIndicator: '#typing-indicator',
        settingsButton: '#settings-btn',
        toggleSizeButton: '#toggle-size-btn',
        suggestionsPanel: '#suggestions-panel',
        voiceInputButton: '#voice-input',
        voiceFeedbackArea: '#voice-feedback-area',
        voiceStatusDisplay: '#voice-status-display',
        voiceTimerDisplay: '#voice-timer-display',
        voiceVisualizerContainer: '#voice-visualizer-container',
        announcer: '#chat-widget-announcer',
        toggleSrText: '#chat-toggle-sr-text',
        settingsModalOverlay: '#settings-modal-overlay',
        settingsModalDialog: '#settings-modal-dialog',
        closeSettingsModalButton: '#close-settings-modal',
        settingsForm: '#settings-form',
        settingsStatus: '#settings-status',
        cancelSettingsButton: '#cancel-settings',
        clearConversationButton: '#clear-conversation-data',
        newConversationButton: '#new-conversation-btn',
        clearSettingsButton: '#clear-settings',
        notificationSoundElement: '#chat-notification-sound',
        piperTtsAudioPlayer: '#piper-tts-audio-player'
    };

    const essentialElementKeys = [
        'chatWidget', 'toggleButton', 'chatContainer', 'messageInput', 'sendMessageButton',
        'chatMessagesContainer', 'chatBody', 'messageForm', 'announcer', 'closeButton',
        'minimizeButton', 'settingsButton', 'toggleSizeButton',
        'voiceInputButton',
        'settingsModalOverlay', 'settingsModalDialog', 'closeSettingsModalButton', 'settingsForm',
        'cancelSettingsButton', 'clearConversationButton', 'newConversationButton',
        'settingsStatus',
        'piperTtsAudioPlayer'
    ];

    const { elements: widgetElements, error: elementSelectionError, missingEssential: missingEssentialElements } =
        selectElements(elementSelectors, essentialElementKeys);

    if (elementSelectionError) {
        const errorMsg = `${SCRIPT_LOG_PREFIX} FATAL: Cannot initialize. Missing: [${missingEssentialElements.join(', ')}].`;
        console.error(errorMsg);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Error Crítico al cargar el chat. Contacte soporte. Detalles: ${missingEssentialElements.join(', ')}.`;
        errorDiv.style.cssText = 'color:red; padding:15px; text-align:center; background:#ffebee; border:2px solid #c62828; margin:10px; font-weight:bold; position:relative; z-index:999999;';
        document.body.prepend(errorDiv);
        return;
    }
    
    if (!widgetElements.notificationSoundElement) {
        console.warn(`${SCRIPT_LOG_PREFIX} Notification sound element not found. Sound notifications will be disabled.`);
    }

    const state = {
        isChatOpen: widgetElements.chatWidget.classList.contains(CSS.WIDGET_OPEN),
        isChatMaximized: widgetElements.chatWidget.classList.contains(CSS.WIDGET_MAXIMIZED),
        chatId: sessionStorage.getItem('bodytoneChatId') || `bt-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        isTyping: false,
        settings: {},
        lastFocusedElement: null,
        isSettingsOpen: false,
        currentPlayingTTSMessageId: null,
        isTTSError: false,
        isAwaitingFollowUp: false,
        currentFlowOption: null,
    };
    sessionStorage.setItem('bodytoneChatId', state.chatId);
    widgetElements.chatWidget.dataset.chatId = state.chatId;
    const MAX_MESSAGE_LENGTH = parseInt(widgetElements.messageInput?.getAttribute('maxlength') || '1000', 10);
    
    // --- Helper Functions ---
    const announceToSr = (message, politeness = 'polite') => {
        if (!widgetElements.announcer) return;
        const validPoliteness = ['polite', 'assertive', 'off'].includes(politeness) ? politeness : 'polite';
        widgetElements.announcer.setAttribute('aria-live', validPoliteness);
        widgetElements.announcer.textContent = '';
        setTimeout(() => {
            widgetElements.announcer.textContent = message;
        }, TIMINGS.ARIA_LIVE_DELAY_MS);
    };

    const scrollToBottom = (instant = false) => {
        if (!widgetElements.chatBody) return;
        widgetElements.chatBody.scrollTo({
            top: widgetElements.chatBody.scrollHeight,
            behavior: instant ? 'instant' : 'smooth'
        });
    };

    const _processMarkdown = (text) => {
        if (typeof text !== 'string') {
            return '';
        }
    
        // =======================================================================
        //              *** VERSIÓN DEFINITIVA DEL PARSER MARKDOWN ***
        // Procesa el texto línea por línea para evitar conflictos entre reglas.
        // =======================================================================
    
        const lines = text.split('\n');
    
        const processedLines = lines.map(line => {
            let processedLine = line;
    
            // 1. Convertir **negrita** y *cursiva*
            processedLine = processedLine.replace(/\*{2}(.*?)\*{2}/g, '<strong>$1</strong>');
            processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
            // 2. Convertir [Texto](URL) en botones/tarjetas de información
            const cardLinkRegex = /\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g;
            processedLine = processedLine.replace(cardLinkRegex, (match, linkText, url) => {
                const isPdf = url.toLowerCase().endsWith('.pdf');
                const cardType = isPdf ? 'pdf' : 'web';
                const iconSvg = isPdf
                    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zM9.5 11.5c0 .83-.67 1.5-1.5 1.5H7v-3h1c.83 0 1.5.67 1.5 1.5v0zm-1.5-2.5H7V9h1c.55 0 1 .45 1 1s-.45 1-1 1h-1v-1zm5 4.5H11v-3h1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm1-3.5h-1v2h1c.28 0 .5-.22.5-.5s-.22-.5-.5-.5zm4-1H15v4h-1.5V9H12v-1.5h6v1.5z"/></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`;
                
                const sanitizedLinkText = sanitizeHtml(linkText);
                return `
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="${CSS.INFO_CARD_LINK_CLASS}" data-card-type="${cardType}">
                        <span class="info-card__icon" aria-hidden="true">${iconSvg}</span>
                        <span class="info-card__text">${sanitizedLinkText}</span>
                    </a>
                `;
            });
    
            // 3. Convertir URLs de texto plano restantes en enlaces simples
            const urlRegex = /(?<!<a href=")(?<!\(|=")(https?:\/\/[^\s<]+)/g;
            processedLine = processedLine.replace(urlRegex, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CSS.INLINE_LINK_CLASS}">${url}</a>`;
            });
    
            return processedLine;
        });
    
        // Unir las líneas procesadas con <br> para mantener la estructura de párrafos
        return processedLines.join('<br>');
    };

    const sanitizeHtml = (unsafeHtml) => {
        if (typeof unsafeHtml !== 'string') return '';

        // Si DOMPurify está disponible y tiene la función sanitize
        if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
            try {
                return DOMPurify.sanitize(unsafeHtml, {
                    USE_PROFILES: { html: true },
                    FORBID_TAGS: [
                        'script', 'style', 'iframe', 'form', 'object',
                        'embed', 'input', 'textarea', 'select', 'button'
                    ],
                    FORBID_ATTR: [
                        'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
                        'onblur', 'onchange', 'onsubmit', 'oninput',
                        'onforminput', 'onformchange'
                    ],
                    ADD_ATTR: ['target'],
                    ALLOW_DATA_ATTR: false
                });
            } catch (e) {
                const logPrefix = typeof SCRIPT_LOG_PREFIX !== 'undefined' ? SCRIPT_LOG_PREFIX : '[SanitizeHtml]';
                console.error(`${logPrefix} Error during DOMPurify sanitization:`, e);
                return 'Error: Contenido no pudo ser procesado.';
            }
        }

        // Si DOMPurify no está disponible, hacer un escape básico
        const logPrefix = typeof SCRIPT_LOG_PREFIX !== 'undefined' ? SCRIPT_LOG_PREFIX : '[SanitizeHtml]';
        console.warn(`${logPrefix} DOMPurify not available. Using basic HTML escaping.`);

        // Escape básico de HTML (corregido)
        const escapedHtml = unsafeHtml
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

        // Convertir saltos de línea a <br> después del escape
        return escapedHtml.replace(/\n/g, '<br>');
    };
    
    const updateInputState = () => {
        if (!widgetElements.messageInput || !widgetElements.sendMessageButton) return;
        const message = widgetElements.messageInput.value; const len = message.length; const trimmedLen = message.trim().length;
        const hasContent = trimmedLen > 0; const isOverLimit = len > MAX_MESSAGE_LENGTH; const isInputDisabled = widgetElements.messageInput.disabled;
        widgetElements.sendMessageButton.disabled = isInputDisabled || !hasContent || isOverLimit;
        widgetElements.sendMessageButton.setAttribute('aria-disabled', String(widgetElements.sendMessageButton.disabled));
        if (widgetElements.charCounter) {
            widgetElements.charCounter.textContent = `${len} / ${MAX_MESSAGE_LENGTH}`;
            widgetElements.charCounter.setAttribute('aria-label', `${len} de ${MAX_MESSAGE_LENGTH} caracteres.`);
            widgetElements.charCounter.classList.toggle(CSS.COUNTER_WARN, len > MAX_MESSAGE_LENGTH * 0.9 && !isOverLimit);
            widgetElements.charCounter.classList.toggle(CSS.COUNTER_ERROR, isOverLimit);
            widgetElements.charCounter.setAttribute('aria-invalid', String(isOverLimit));
        }
        if (widgetElements.messageInputError) {
            widgetElements.messageInputError.textContent = isOverLimit ? `Máximo ${MAX_MESSAGE_LENGTH} caracteres.` : '';
            widgetElements.messageInputError.hidden = !isOverLimit;
        }
        widgetElements.messageInput.setAttribute('aria-invalid', String(isOverLimit));
        const describedBy = ['message-counter'];
        if (isOverLimit && widgetElements.messageInputError && !widgetElements.messageInputError.hidden) {
            describedBy.push(widgetElements.messageInputError.id || 'message-input-error');
        }
        widgetElements.messageInput.setAttribute('aria-describedby', describedBy.join(' '));
    };

    const autoResizeTextarea = () => {
        if (!widgetElements.messageInput || typeof getComputedStyle === 'undefined') return;
        const input = widgetElements.messageInput; const minRows = parseInt(input.dataset.minRows, 10) || 1; const maxRows = parseInt(input.dataset.maxRows, 10) || 6;
        input.style.height = 'auto'; const styles = getComputedStyle(input); let lineHeight = parseFloat(styles.lineHeight);
        if (isNaN(lineHeight) || styles.lineHeight === 'normal') {
            const tempDiv = document.createElement('div');
            Object.assign(tempDiv.style, { fontSize: styles.fontSize, fontFamily: styles.fontFamily, lineHeight: 'normal', position: 'absolute', visibility: 'hidden', padding: '0', border: 'none', width: input.clientWidth + 'px' });
            tempDiv.innerText = 'M'; document.body.appendChild(tempDiv); lineHeight = tempDiv.offsetHeight; document.body.removeChild(tempDiv);
            if (isNaN(lineHeight) || lineHeight <= 0) lineHeight = (parseFloat(styles.fontSize) || 16) * 1.2;
        }
        const paddingTop = parseFloat(styles.paddingTop) || 0; const paddingBottom = parseFloat(styles.paddingBottom) || 0;
        const borderTop = parseFloat(styles.borderTopWidth) || 0; const borderBottom = parseFloat(styles.borderBottomWidth) || 0;
        const verticalPaddingAndBorder = paddingTop + paddingBottom + borderTop + borderBottom;
        const minHeight = (minRows * lineHeight) + verticalPaddingAndBorder; const maxHeight = (maxRows * lineHeight) + verticalPaddingAndBorder;
        let contentHeight = input.scrollHeight; if (styles.boxSizing !== 'border-box') contentHeight += borderTop + borderBottom;
        const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));
        input.style.height = `${newHeight}px`; input.style.overflowY = (contentHeight > maxHeight && contentHeight > minHeight) ? 'auto' : 'hidden';
    };

    const appendMessage = (rawContent, sender, options = {}) => {
        const { isError = false, quickActions = [], shouldScroll = true, customMessageId = null, showAvatar = true } = options;
        if (!widgetElements.chatMessagesContainer) { console.error(`${SCRIPT_LOG_PREFIX} appendMessage: chatMessagesContainer not found!`); return null; }
        if (typeof rawContent !== 'string' || !['user', 'bot', 'system'].includes(sender)) { console.error(`${SCRIPT_LOG_PREFIX} appendMessage: Invalid arguments.`); return null; }
        const article = document.createElement('article'); const msgId = customMessageId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const noAvatarClass = (sender === 'bot' && !showAvatar) ? ` ${CSS.MESSAGE_NO_AVATAR}` : '';
        article.className = `message message--${sender}${isError ? ' message--error' : ''}${noAvatarClass}`;
        article.setAttribute('role', 'article'); article.dataset.messageId = msgId;
        const timestamp = new Date(); article.dataset.timestamp = timestamp.toISOString();
        const timeStr = timestamp.toLocaleTimeString(navigator.language || 'es-ES', { hour: '2-digit', minute: '2-digit' });
        let finalHtml = '';
        const sanitizedBubbleContent = _processMarkdown(rawContent);

        if (sender === 'user' || sender === 'bot') {
            const senderName = sender === 'user' ? 'Tú' : 'Agente CS';
            const textElementId = `${msgId}-text`; const senderNameId = `${msgId}-sender`;
            article.setAttribute('aria-labelledby', `${senderNameId} ${textElementId}`);
            let avatarHtml = '';
            if (sender === 'bot' && showAvatar) { avatarHtml = `<div class="message__avatar"><img src="./images/avatar.png" alt="" aria-hidden="true" loading="lazy"></div>`; }
            const quickActionsHtml = (sender === 'bot' && !isError && Array.isArray(quickActions) && quickActions.length > 0) ? `<div class="message__quick-actions" role="group" aria-label="Acciones rápidas sugeridas">${quickActions.map(qa => { const escapeAttr = (str) => (typeof str === 'string' ? str.replace(/"/g, '"') : ''); const buttonText = qa?.text || 'Acción'; const sanitizedButtonText = sanitizeHtml(buttonText); const messageForPayload = qa?.payload?.message ?? qa?.query ?? buttonText; const optionForPayload = qa?.payload?.initial_option ?? qa?.option; let dataAttrs = `data-query="${escapeAttr(messageForPayload)}"`; if (optionForPayload !== null && optionForPayload !== undefined) { dataAttrs += ` data-option="${escapeAttr(optionForPayload)}"`; } if (qa?.tracking) { dataAttrs += ` data-tracking="${escapeAttr(qa.tracking)}"`; } return `<button type="button" class="message__quick-action-btn bt-button" ${dataAttrs}>${sanitizedButtonText}</button>`; }).join('')}</div>` : '';
            const bubbleInnerHtml = `<div class="message__text" id="${textElementId}">${sanitizedBubbleContent}</div>`;
            const playTTSButtonHtml = (sender === 'bot' && !isError) ? `<button type="button" class="message__action-btn bt-button ${CSS.PLAY_TTS_BUTTON_CLASS}" aria-label="Reproducir mensaje con voz" data-action="play-tts" data-message-id="${msgId}" title="Reproducir mensaje"><svg class="play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" focusable="false" aria-hidden="true"><path d="M8 5v14l11-7L8 5z"/></svg><svg class="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" focusable="false" aria-hidden="true" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span class="spinner-icon" style="display:none;"></span></button>` : '';
            const messageActionsHtml = `<div class="message__actions" role="group" aria-label="Acciones del mensaje ${msgId}">${playTTSButtonHtml}<button type="button" class="message__action-btn bt-button" aria-label="Copiar mensaje" data-action="copy" data-message-id="${msgId}" title="Copiar mensaje"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" focusable="false" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button><button type="button" class="message__action-btn bt-button" aria-label="Reportar problema" data-action="report" data-message-id="${msgId}" title="Reportar mensaje"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" focusable="false" aria-hidden="true"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></svg></button></div>`;
            finalHtml = `${avatarHtml}<div class="message__main"><header class="message__header"><h3 id="${senderNameId}" class="message__sender-name ${sender === 'user' ? CSS.SR_OPTIMIZED : ''}">${senderName}</h3><time class="message__time" datetime="${timestamp.toISOString()}" aria-label="Enviado a las ${timeStr}">${timeStr}</time>${sender === 'user' ? '<span class="message__status-indicator" aria-label="Enviado" data-status="sent" title="Enviado"></span>' : ''}</header><div class="message__bubble${isError ? ' message__bubble--error' : ''}">${bubbleInnerHtml}</div>${quickActionsHtml}</div>${messageActionsHtml}`;
        } else if (sender === 'system') {
            const systemTextId = `${msgId}-text`; article.setAttribute('aria-labelledby', systemTextId); article.setAttribute('role', 'status'); article.classList.add('message--system');
            finalHtml = `<p class="message__text" id="${systemTextId}">${sanitizedBubbleContent}</p>`;
        }
        article.innerHTML = finalHtml;
        widgetElements.chatMessagesContainer.appendChild(article);
        if (typeof announceToSr === 'function' && typeof TIMINGS === 'object') {
            let textToAnnounce = ""; const textElement = article.querySelector('.message__text');
            if (textElement) { const clone = textElement.cloneNode(true); clone.querySelectorAll('a, button, .message__actions, .message__quick-actions').forEach(el => el.remove()); textToAnnounce = (clone.textContent || clone.innerText || "").trim().replace(/\s+/g, ' '); }
            else { textToAnnounce = (rawContent.replace(/<[^>]+>/g, '') || "").trim().replace(/\s+/g, ' '); }
            if (textToAnnounce) { const announcementPrefix = isError ? 'Error:' : (sender === 'user' ? 'Tú dijiste:' : (sender === 'bot' ? 'Asistente dice:' : 'Sistema:')); const announcementText = `${announcementPrefix} ${textToAnnounce.substring(0, 250)}${textToAnnounce.length > 250 ? '...' : ''}`; setTimeout(() => announceToSr(announcementText, isError ? 'assertive' : 'polite'), TIMINGS.ARIA_LIVE_DELAY_MS + 100); }
        }
        if (shouldScroll) { setTimeout(() => scrollToBottom(false), TIMINGS.SCROLL_TO_BOTTOM_DELAY_MS); }
        return article;
    };

    /**
     * Appends the initial welcome message with clear, distinct, and complete user actions.
     */
    const appendWelcomeMessage = (isNewConversation = false) => {
        const welcomeMessageHtml = "👋 Hola. Soy un agente de CS. Pregunta por un envío, un manual o un ticket — o suelta un archivo.";
        
        // <<< MENÚ DE BIENVENIDA DEFINITIVO Y COMPLETO >>>
        const welcomeQuickActions = [
            {
                text: "Resolver un Problema",
                payload: { message: "Tengo un problema con un equipo", initial_option: "soporte_tecnico_avanzado" },
                tracking: "quick-solve-problem"
            },
            {
                text: "Buscar un Manual",
                payload: { message: "Quiero buscar un manual", initial_option: "manuales" },
                tracking: "quick-find-manual"
            },
            {
                text: "Estado de mi Envío",
                payload: { message: "Consultar estado de envío", initial_option: "estado_envio" },
                tracking: "quick-shipping"
            },
            {
                text: "Disponibilidad de Productos",
                payload: { message: "Consultar disponibilidad de un producto", initial_option: "disponibilidad_productos" },
                tracking: "quick-availability"
            },
            {
                text: "Abrir un Ticket / Contactar",
                payload: { message: "Necesito otras opciones de soporte", initial_option: "soporte" },
                tracking: "quick-open-ticket"
            }
        ];
        
        const welcomeArticle = appendMessage(welcomeMessageHtml, 'bot', {
            isError: false,
            quickActions: welcomeQuickActions,
            shouldScroll: !isNewConversation,
            customMessageId: isNewConversation ? 'msg-welcome-new' : 'msg-welcome',
            showAvatar: false
        });

        if (welcomeArticle) {
            welcomeArticle.id = isNewConversation ? 'welcome-message-article-new' : 'welcome-message-article';
        }
        if (isNewConversation) {
            scrollToBottom(true);
        }
    };
    
    const showTypingIndicator = (show) => {
        if (!widgetElements.typingIndicator || !widgetElements.chatMessagesContainer) return;
        const indicatorElement = widgetElements.typingIndicator; const messagesContainer = widgetElements.chatMessagesContainer;
        if (show && !state.isTyping) { messagesContainer.appendChild(indicatorElement); indicatorElement.hidden = false; indicatorElement.setAttribute('aria-hidden', 'false'); state.isTyping = true; setTimeout(() => scrollToBottom(), TIMINGS.TYPING_INDICATOR_SCROLL_DELAY_MS); announceToSr("Asistente está escribiendo...", 'polite');
        } else if (!show && state.isTyping) { indicatorElement.hidden = true; indicatorElement.setAttribute('aria-hidden', 'true'); state.isTyping = false; }
    };

    const clearChatMessages = () => { 
        if (!widgetElements.chatMessagesContainer) return;
        const messagesToClear = widgetElements.chatMessagesContainer.querySelectorAll('article.message--user, article.message--bot:not([data-message-id="msg-welcome"]):not([id^="welcome-message-article"])');
        if (messagesToClear.length > 0) { messagesToClear.forEach(msg => msg.remove()); appendMessage("Mensajes de la sesión borrados de la pantalla.", "system");
        } else { const lastMessage = widgetElements.chatMessagesContainer.lastElementChild; if (!lastMessage || !lastMessage.classList.contains('message--system') || !lastMessage.textContent?.includes("borrados")) { appendMessage("No hay mensajes de usuario o asistente para borrar.", "system"); } }
        setTimeout(() => scrollToBottom(), TIMINGS.SCROLL_TO_BOTTOM_DELAY_MS);
    };

    const handleNewConversation = () => {
        const confirmed = confirm("¿Estás seguro de que quieres iniciar una nueva conversación?\n\nSe borrarán todos los mensajes y se reiniciará el contexto con el asistente.");
        if (!confirmed) { announceToSr("Nueva conversación cancelada."); return; }
        
        console.log(`${SCRIPT_LOG_PREFIX} Initiating new conversation.`);
        announceToSr("Iniciando nueva conversación...", "assertive");
        
        if (widgetElements.chatMessagesContainer) { widgetElements.chatMessagesContainer.innerHTML = ''; }
        
        const oldChatId = state.chatId;
        state.chatId = `bt-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem('bodytoneChatId', state.chatId);
        if (widgetElements.chatWidget) { widgetElements.chatWidget.dataset.chatId = state.chatId; }
        
        console.log(`${SCRIPT_LOG_PREFIX} New Chat ID generated: ${state.chatId} (was ${oldChatId})`);
        
        state.isAwaitingFollowUp = false;
        state.currentFlowOption = null;
        
        appendWelcomeMessage(true); 
        
        if (state.isSettingsOpen && typeof closeSettingsModal === 'function') { closeSettingsModal(); }
        
        if (widgetElements.messageInput) {
            widgetElements.messageInput.disabled = false;
            widgetElements.messageInput.removeAttribute('aria-disabled');
            widgetElements.messageInput.value = ''; 
            autoResizeTextarea();
            updateInputState(); 
            widgetElements.messageInput.focus();
        }
        announceToSr("Nueva conversación iniciada. Chat reiniciado.");
    };

    const handleToggleChat = (triggeredByCloseButton = false) => {
        const wasOpen = state.isChatOpen; state.isChatOpen = !wasOpen;
        console.log(`${SCRIPT_LOG_PREFIX} Toggling chat ${state.isChatOpen ? 'OPEN' : 'CLOSED'}.`);
        if (!state.isChatOpen) { 
            state.lastFocusedElementBeforeClose = (document.activeElement === widgetElements.toggleButton || widgetElements.chatContainer.contains(document.activeElement)) ? widgetElements.toggleButton : document.activeElement;
            if (widgetElements.toggleButton && (triggeredByCloseButton || document.activeElement === widgetElements.closeButton || document.activeElement === widgetElements.minimizeButton)) {
                setTimeout(() => widgetElements.toggleButton.focus(), TIMINGS.MODAL_TRANSITION_DURATION_MS + 50);
            }
        }
        widgetElements.chatWidget.classList.toggle(CSS.WIDGET_OPEN, state.isChatOpen);
        widgetElements.chatWidget.classList.toggle(CSS.WIDGET_CLOSED, !state.isChatOpen);
        if (state.isChatOpen && state.isChatMaximized) { widgetElements.chatWidget.classList.add(CSS.WIDGET_MAXIMIZED); }
        widgetElements.chatContainer.inert = !state.isChatOpen;
        widgetElements.chatContainer.setAttribute('aria-hidden', String(!state.isChatOpen));
        widgetElements.toggleButton.setAttribute('aria-expanded', String(state.isChatOpen));
        widgetElements.toggleButton.style.display = state.isChatOpen ? 'none' : '';
        if (widgetElements.toggleSrText) { widgetElements.toggleSrText.textContent = state.isChatOpen ? 'Cerrar chat' : 'Abrir chat'; }
        
        if (state.isChatOpen) {
            if (state.isSettingsOpen) closeSettingsModal();
            setTimeout(() => widgetElements.messageInput?.focus(), TIMINGS.FOCUS_DELAY_MS);
            scrollToBottom(true); announceToSr("Chat abierto.");
        } else {
            if (state.isSettingsOpen) closeSettingsModal();
            if (state.lastFocusedElementBeforeClose && typeof state.lastFocusedElementBeforeClose.focus === 'function') {
                setTimeout(() => { try { state.lastFocusedElementBeforeClose.focus(); } catch(e){ console.warn("Failed to restore focus:", e); } }, TIMINGS.MODAL_TRANSITION_DURATION_MS + 50);
            }
            announceToSr("Chat cerrado.");
        }
    };

    const handleToggleMaximize = () => {
        state.isChatMaximized = !state.isChatMaximized;
        console.log(`${SCRIPT_LOG_PREFIX} Toggling maximize. Chat is now ${state.isChatMaximized ? 'MAXIMIZED' : 'RESTORED'}.`);
        if (!state.isChatOpen && state.isChatMaximized) { handleToggleChat(); }
        widgetElements.chatWidget.classList.toggle(CSS.WIDGET_MAXIMIZED, state.isChatMaximized);
        if (widgetElements.toggleSizeButton) {
            widgetElements.toggleSizeButton.setAttribute('aria-expanded', String(state.isChatMaximized));
            
            // Se definen las variables 'initialLabel' e 'initialTooltip' aquí mismo,
            // donde se necesitan, en lugar de depender de otra función.
            const initialLabel = state.isChatMaximized ? 'Restaurar tamaño del chat' : 'Maximizar chat';
            const initialTooltip = state.isChatMaximized ? 'Restaurar' : 'Maximizar';
            
            widgetElements.toggleSizeButton.setAttribute('aria-label', initialLabel);
            widgetElements.toggleSizeButton.dataset.tooltip = initialTooltip; // Se usa la variable correcta.
        }

        announceToSr(state.isChatMaximized ? "Chat maximizado." : "Chat restaurado a tamaño normal.");
        if (state.isChatOpen) { setTimeout(() => scrollToBottom(true), 50); }
    };

    const handleVoiceStateChange = (isRecording, statusText) => {
        if (!widgetElements.messageInput) return; widgetElements.messageInput.disabled = isRecording;
        if (widgetElements.messageInput.placeholder) { widgetElements.messageInput.dataset.originalPlaceholder = widgetElements.messageInput.dataset.originalPlaceholder || widgetElements.messageInput.placeholder; widgetElements.messageInput.placeholder = isRecording ? statusText || 'Escuchando...' : (widgetElements.messageInput.dataset.originalPlaceholder || 'Escribe tu mensaje...'); }
        updateInputState();
    };

    const handleVoiceTranscriptionComplete = (transcript) => {
        if (!widgetElements.messageInput) return; widgetElements.messageInput.disabled = false;
        if (widgetElements.messageInput.dataset.originalPlaceholder) { widgetElements.messageInput.placeholder = widgetElements.messageInput.dataset.originalPlaceholder; }
        const currentVal = widgetElements.messageInput.value.trim(); const separator = currentVal ? ' ' : '';
        widgetElements.messageInput.value = transcript ? `${currentVal}${separator}${transcript}`.trim() : currentVal;
        if (transcript) { announceToSr(`Texto reconocido: ${transcript.substring(0, 150)}...`); autoResizeTextarea(); updateInputState(); widgetElements.messageInput.focus(); const len = widgetElements.messageInput.value.length; widgetElements.messageInput.setSelectionRange(len, len); }
        else { announceToSr("No se reconoció texto."); widgetElements.messageInput.focus(); }
    };

    const setupEventListeners = () => {
        console.log(`${SCRIPT_LOG_PREFIX} Setting up core event listeners...`);
        const addListener = (element, event, handler) => { if (element) element.addEventListener(event, handler); };
        addListener(widgetElements.toggleButton, 'click', () => handleToggleChat(false));
        addListener(widgetElements.closeButton, 'click', () => handleToggleChat(true));
        addListener(widgetElements.minimizeButton, 'click', () => handleToggleChat(true));
        addListener(widgetElements.settingsButton, 'click', openSettingsModal);
        addListener(widgetElements.toggleSizeButton, 'click', handleToggleMaximize);
        addListener(widgetElements.messageForm, 'submit', (e) => { e.preventDefault(); handleSendMessage(null, null); });
        if (widgetElements.messageInput) {
            addListener(widgetElements.messageInput, 'input', () => { autoResizeTextarea(); updateInputState(); });
            addListener(widgetElements.messageInput, 'keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey && !widgetElements.sendMessageButton?.disabled) { e.preventDefault(); handleSendMessage(null, null); } });
            addListener(widgetElements.messageInput, 'paste', () => setTimeout(() => { autoResizeTextarea(); updateInputState(); }, 0));
            addListener(widgetElements.messageInput, 'blur', () => { if (!widgetElements.messageInput.disabled && widgetElements.messageInput.dataset.originalPlaceholder) { widgetElements.messageInput.placeholder = widgetElements.messageInput.dataset.originalPlaceholder; } });
        }
        addListener(widgetElements.chatMessagesContainer, 'click', handleMessagesContainerClick);
        console.log(`${SCRIPT_LOG_PREFIX} Core event listeners setup complete.`);
    };

    const initializeChat = () => {
        console.log(`${SCRIPT_LOG_PREFIX} Starting Full Initialization Sequence...`);
        try {
            const settingsDeps = {
                elements: {
                    overlay: widgetElements.settingsModalOverlay, dialog: widgetElements.settingsModalDialog, form: widgetElements.settingsForm,
                    closeButton: widgetElements.closeSettingsModalButton, cancelButton: widgetElements.cancelSettingsButton,
                    clearConversationButton: widgetElements.clearConversationButton, newConversationButton: widgetElements.newConversationButton,
                    status: widgetElements.settingsStatus, triggerButton: widgetElements.settingsButton
                },
                state,
                helpers: { announceToSr, clearChatMessages, handleNewConversation },
                constants: { FOCUSABLE_SELECTOR: FOCUSABLE_ELEMENTS_SELECTOR, MODAL_TRANSITION_DURATION_MS: TIMINGS.MODAL_TRANSITION_DURATION_MS, SETTINGS_FEEDBACK_DELAY_MS: TIMINGS.SETTINGS_FEEDBACK_DELAY_MS, FEEDBACK_RESET_DELAY_MS: TIMINGS.FEEDBACK_RESET_DELAY_MS },
                css: { MODAL_OVERLAY_VISIBLE: CSS.MODAL_OVERLAY_VISIBLE, SETTINGS_STATUS_VISIBLE: CSS.SETTINGS_STATUS_VISIBLE, SETTINGS_STATUS_SUCCESS: CSS.SETTINGS_STATUS_SUCCESS, SETTINGS_STATUS_ERROR: CSS.SETTINGS_STATUS_ERROR, SETTINGS_STATUS_LOADING: CSS.SETTINGS_STATUS_LOADING }
            };
            console.log(`${SCRIPT_LOG_PREFIX} Initializing Settings Module...`);
            if (!initializeSettings(settingsDeps)) {
                console.error(`${SCRIPT_LOG_PREFIX} Settings module critical initialization failed.`);
                if (widgetElements.settingsButton) { widgetElements.settingsButton.disabled = true; widgetElements.settingsButton.title = "Configuración no disponible"; widgetElements.settingsButton.setAttribute('aria-disabled', 'true'); }
            } else { console.log(`${SCRIPT_LOG_PREFIX} Settings Module Initialized.`); }

            state.isChatOpen = widgetElements.chatWidget.classList.contains(CSS.WIDGET_OPEN);
            state.isChatMaximized = widgetElements.chatWidget.classList.contains(CSS.WIDGET_MAXIMIZED);
            widgetElements.chatContainer.inert = !state.isChatOpen;
            widgetElements.chatContainer.setAttribute('aria-hidden', String(!state.isChatOpen));
            widgetElements.toggleButton.setAttribute('aria-expanded', String(state.isChatOpen));
            widgetElements.toggleButton.style.display = state.isChatOpen ? 'none' : '';
            if (widgetElements.toggleSizeButton) {
                widgetElements.toggleSizeButton.setAttribute('aria-expanded', String(state.isChatMaximized));
                const initialLabel = state.isChatMaximized ? 'Restaurar tamaño del chat' : 'Maximizar chat';
                const initialTooltip = state.isChatMaximized ? 'Restaurar' : 'Maximizar';
                widgetElements.toggleSizeButton.setAttribute('aria-label', initialLabel);
                widgetElements.toggleSizeButton.dataset.tooltip = initialTooltip; 
            }
            if (widgetElements.toggleSrText) { widgetElements.toggleSrText.textContent = state.isChatOpen ? 'Cerrar chat' : 'Abrir chat'; }
            if (widgetElements.messageInput) { widgetElements.messageInput.dataset.originalPlaceholder = widgetElements.messageInput.placeholder; updateInputState(); autoResizeTextarea(); }
            
            const responseDeps = {
                elements: {
                     messageInput: widgetElements.messageInput,
                     sendMessageButton: widgetElements.sendMessageButton,
                     chatMessagesContainer: widgetElements.chatMessagesContainer,
                     piperTtsAudioPlayer: widgetElements.piperTtsAudioPlayer,
                     notificationSoundElement: widgetElements.notificationSoundElement
                },
                state, 
                helpers: { 
                    appendMessage, 
                    announceToSr, 
                    updateInputState, 
                    autoResizeTextarea, 
                    showTypingIndicator, 
                    scrollToBottom, 
                    sanitizeHtml 
                },
                constants: { 
                    FEEDBACK_RESET_DELAY_MS: TIMINGS.FEEDBACK_RESET_DELAY_MS, 
                    TYPING_INDICATOR_SCROLL_DELAY_MS: TIMINGS.TYPING_INDICATOR_SCROLL_DELAY_MS 
                },
                css: { 
                    QUICK_ACTION_DISABLED: CSS.QUICK_ACTION_DISABLED,
                    ACTION_BTN_SUCCESS: CSS.ACTION_BTN_SUCCESS, 
                    ACTION_BTN_ERROR: CSS.ACTION_BTN_ERROR,
                    PLAY_TTS_BUTTON_CLASS: CSS.PLAY_TTS_BUTTON_CLASS, 
                    PLAY_TTS_BUTTON_LOADING: CSS.PLAY_TTS_BUTTON_LOADING, 
                    PLAY_TTS_BUTTON_PLAYING: CSS.PLAY_TTS_BUTTON_PLAYING,
                    INFO_CARD_LINK_CLASS: CSS.INFO_CARD_LINK_CLASS,
                    INLINE_LINK_CLASS: CSS.INLINE_LINK_CLASS
                }
            };
            console.log(`${SCRIPT_LOG_PREFIX} Initializing Response Module...`);
            initializeResponseModule(responseDeps);
            console.log(`${SCRIPT_LOG_PREFIX} Response Module Initialized.`);

            const voiceDeps = {
                 messageInput: widgetElements.messageInput, sendMessageButton: widgetElements.sendMessageButton, voiceInputButton: widgetElements.voiceInputButton,
                 voiceFeedbackArea: widgetElements.voiceFeedbackArea, voiceStatusDisplay: widgetElements.voiceStatusDisplay,
                 voiceTimerDisplay: widgetElements.voiceTimerDisplay, voiceVisualizerContainer: widgetElements.voiceVisualizerContainer,
                 announceFn: announceToSr, onStateChange: handleVoiceStateChange, onTranscriptionComplete: handleVoiceTranscriptionComplete,
            };
            console.log(`${SCRIPT_LOG_PREFIX} Initializing Voice Input Module...`);
            if (!initializeVoiceInput(voiceDeps)) {
                 console.warn(`${SCRIPT_LOG_PREFIX} Voice input module failed to initialize. Voice input may be disabled.`);
                 if(widgetElements.voiceInputButton) { widgetElements.voiceInputButton.disabled = true; widgetElements.voiceInputButton.hidden = true; widgetElements.voiceInputButton.setAttribute('aria-disabled', 'true'); }
            } else { console.log(`${SCRIPT_LOG_PREFIX} Voice Input Module Initialized.`); }

            setupEventListeners();

            if (widgetElements.chatMessagesContainer && widgetElements.chatMessagesContainer.children.length <= 1) { 
                if (widgetElements.chatMessagesContainer.children.length === 1 && widgetElements.chatMessagesContainer.firstElementChild.classList.contains('message--system')) {
                    widgetElements.chatMessagesContainer.innerHTML = '';
                }
                console.log(`${SCRIPT_LOG_PREFIX} Appending initial welcome message...`);
                appendWelcomeMessage(false);
            }

            if (state.isChatOpen) scrollToBottom(true);
            const widgetVersion = widgetElements.chatWidget?.dataset.widgetVersion || 'N/A';
            console.log(`${SCRIPT_LOG_PREFIX} Chat Widget Initialized (v6.0.6). Widget HTML Version: ${widgetVersion}`);
            announceToSr("Agente CS listo.", "assertive");
        } catch (error) {
             console.error(`${SCRIPT_LOG_PREFIX} FATAL ERROR during main initialization sequence:`, error);
             announceToSr("Error crítico al inicializar el asistente.", "assertive");
             if (!document.querySelector('[style*="darkred"]')) {
                 const errorDiv = document.createElement('div');
                 errorDiv.textContent = `Error grave al cargar el asistente: ${error.message || 'Desconocido'}. Refresque o contacte soporte.`;
                 errorDiv.style.cssText = 'color:red;padding:15px;text-align:center;background:#ffebee;border:2px solid #c62828;margin:10px;font-weight:bold;position:fixed;top:10px;left:10px;right:10px;z-index:999999;';
                 document.body.prepend(errorDiv);
             }
        }
    };

    initializeChat();
});