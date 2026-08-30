// frontend/settings.js (v1.3.5 - New Conversation Button Support)
'use strict';

/**
 * ============================================================================
 * Settings Module for Bodytone Chat Widget
 * ============================================================================
 *
 * Manages the settings modal: Sound, Analytics, Clear Conversation, New Conversation.
 *
 * **Change Notes (v1.3.5):**
 * - Added support for "New Conversation" button.
 * - Expects `handleNewConversation` helper function in dependencies.
 *
 * @version 1.3.5
 * @exports initializeSettings - Initializes the module.
 * @exports openSettingsModal - Shows the modal.
 * @exports closeSettingsModal - Hides the modal.
 * ============================================================================
 */

// --- Module-Level Scope ---
let elements = {
    overlay: null, dialog: null, form: null, closeButton: null, cancelButton: null,
    clearConversationButton: null, newConversationButton: null, // NUEVO
    status: null, triggerButton: null,
    soundCheckbox: null, analyticsCheckbox: null
};
let state = {};
let helpers = {}; // Espera: announceToSr, clearChatMessages, handleNewConversation
let constants = {};
let cssClasses = {};

let isInitialized = false;
let settingsModalFocusTrapActive = false;
let statusClearTimer = null;

const SCRIPT_LOG_PREFIX = "[settings.js v1.3.5]";
const LOCAL_STORAGE_KEY = 'bodytoneChatSettings_v2';

const defaultSettings = Object.freeze({
    notificationSound: true,
    allowAnalytics: true,
});

// --- Internal Utility Functions (Unchanged) ---
const logError = (message, error) => console.error(`${SCRIPT_LOG_PREFIX} ${message}`, error || '');
const logWarn = (message) => console.warn(`${SCRIPT_LOG_PREFIX} ${message}`);
const logDebug = (message) => console.debug(`${SCRIPT_LOG_PREFIX} ${message}`);

const validateDependencies = () => {
    const requiredElements = ['overlay', 'dialog', 'closeButton', 'cancelButton', 'status', 'triggerButton'];
    const optionalElements = ['form', 'clearConversationButton', 'newConversationButton', 'soundCheckbox', 'analyticsCheckbox']; // newConversationButton añadido
    const requiredHelpers = ['announceToSr', 'clearChatMessages', 'handleNewConversation']; // handleNewConversation añadido
    const requiredConstants = ['FOCUSABLE_SELECTOR', 'MODAL_TRANSITION_DURATION_MS', 'SETTINGS_FEEDBACK_DELAY_MS', 'FEEDBACK_RESET_DELAY_MS'];
    const requiredCssClasses = ['MODAL_OVERLAY_VISIBLE', 'SETTINGS_STATUS_VISIBLE', 'SETTINGS_STATUS_SUCCESS', 'SETTINGS_STATUS_ERROR', 'SETTINGS_STATUS_LOADING'];
    let isValid = true;
    requiredElements.forEach(key => { if (!elements[key]) { logError(`FATAL: Missing essential DOM element dependency: '${key}'.`); isValid = false; } });
    optionalElements.forEach(key => { if (!elements[key]) { logWarn(`Optional DOM element '${key}' not found. Related functionality may be unavailable.`); } });
    requiredHelpers.forEach(key => { if (typeof helpers[key] !== 'function') { logError(`FATAL: Missing essential helper function dependency: '${key}'.`); isValid = false; } });
    requiredConstants.forEach(key => { if (typeof constants[key] === 'undefined') { logError(`FATAL: Missing essential constant dependency: '${key}'.`); isValid = false; } else if (key.includes('_MS') && typeof constants[key] !== 'number') { logError(`FATAL: Constant '${key}' should be a number (milliseconds).`); isValid = false; } });
    requiredCssClasses.forEach(key => { if (typeof cssClasses[key] !== 'string') { logError(`FATAL: Missing essential CSS class name dependency: '${key}'.`); isValid = false; } });
    if (!state || typeof state !== 'object') { logError(`FATAL: Shared state object is missing or invalid.`); isValid = false; }
    return isValid;
};
const focusTrapHandler = (event) => {
    if (!state.isSettingsOpen || !settingsModalFocusTrapActive || event.key !== 'Tab') return;
    const focusableElements = Array.from(elements.dialog.querySelectorAll(constants.FOCUSABLE_SELECTOR)).filter(el => el.offsetParent !== null);
    if (focusableElements.length === 0) { event.preventDefault(); return; }
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentActiveElement = document.activeElement;
    if (event.shiftKey) { if (currentActiveElement === firstElement || currentActiveElement === elements.dialog) { event.preventDefault(); lastElement.focus(); } }
    else { if (currentActiveElement === lastElement) { event.preventDefault(); firstElement.focus(); } }
};
const activateFocusTrap = () => { if (settingsModalFocusTrapActive) return; const focusableInDialog = elements.dialog.querySelector(constants.FOCUSABLE_SELECTOR); if (!focusableInDialog && elements.dialog.getAttribute('tabindex') !== '-1') { elements.dialog.setAttribute('tabindex', '-1'); } else if (focusableInDialog) { elements.dialog.removeAttribute('tabindex'); } document.addEventListener('keydown', focusTrapHandler, true); settingsModalFocusTrapActive = true; };
const deactivateFocusTrap = () => { if (!settingsModalFocusTrapActive) return; document.removeEventListener('keydown', focusTrapHandler, true); settingsModalFocusTrapActive = false; };

const displayStatus = (message, type = 'info', duration = constants.SETTINGS_FEEDBACK_DELAY_MS) => {
    if (!elements.status || !isInitialized) return;
    const statusEl = elements.status; clearTimeout(statusClearTimer); statusEl.textContent = message; statusEl.className = 'settings-form__status';
    const typeClassMap = { success: cssClasses.SETTINGS_STATUS_SUCCESS, error: cssClasses.SETTINGS_STATUS_ERROR, loading: cssClasses.SETTINGS_STATUS_LOADING, info: '' };
    if (typeClassMap[type]) { statusEl.classList.add(typeClassMap[type]); }
    statusEl.classList.add(cssClasses.SETTINGS_STATUS_VISIBLE); helpers.announceToSr(message, type === 'error' ? 'assertive' : 'polite');
    if (type !== 'loading' && duration > 0) { statusClearTimer = setTimeout(() => { statusEl.classList.remove(cssClasses.SETTINGS_STATUS_VISIBLE); }, duration); }
};
const clearStatus = () => { if (!elements.status) return; clearTimeout(statusClearTimer); elements.status.classList.remove(cssClasses.SETTINGS_STATUS_VISIBLE); elements.status.className = 'settings-form__status'; elements.status.textContent = ''; };
const loadSettings = () => {
    const currentDefaults = { ...defaultSettings };
    try {
        const savedJson = localStorage.getItem(LOCAL_STORAGE_KEY); if (!savedJson) { logDebug("No saved settings found, using defaults."); return currentDefaults; }
        const loaded = JSON.parse(savedJson); const validSettings = {};
        Object.keys(currentDefaults).forEach(key => { if (loaded && typeof loaded[key] === typeof currentDefaults[key]) { validSettings[key] = loaded[key]; } else { if (loaded && typeof loaded[key] !== 'undefined') { logWarn(`Loaded setting '${key}' has incorrect type. Using default.`); } validSettings[key] = currentDefaults[key]; } });
        logDebug("Loaded settings from localStorage:", validSettings); return validSettings;
    } catch (error) { logError("Error parsing settings from localStorage. Using defaults.", error); localStorage.removeItem(LOCAL_STORAGE_KEY); return currentDefaults; }
};
const applySettings = (settingsToApply) => {
    if (!settingsToApply) { logError("Cannot apply settings: No settings object provided."); return; }
    if (elements.soundCheckbox) { elements.soundCheckbox.checked = !!settingsToApply.notificationSound; }
    if (elements.analyticsCheckbox) { elements.analyticsCheckbox.checked = !!settingsToApply.allowAnalytics; }
    logDebug("Applied settings to form controls (if found):", settingsToApply);
    if (state.settings && typeof state.settings === 'object') { Object.keys(defaultSettings).forEach(key => { if (Object.prototype.hasOwnProperty.call(settingsToApply, key)) { state.settings[key] = settingsToApply[key]; } }); logDebug("Shared state settings updated:", state.settings); }
    else { logError("Cannot update shared state: 'state.settings' object not available or invalid."); }
};
const handleFormSubmit = (event) => {
    event.preventDefault(); if (!isInitialized) return; logDebug("Handling form submit (Save Changes)..."); displayStatus("Guardando...", "loading", 0);
    try {
        const newSettings = { notificationSound: elements.soundCheckbox?.checked ?? defaultSettings.notificationSound, allowAnalytics: elements.analyticsCheckbox?.checked ?? defaultSettings.allowAnalytics };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings)); logDebug("Settings saved to localStorage:", newSettings); applySettings(newSettings);
        displayStatus("Configuración guardada.", "success", constants.SETTINGS_FEEDBACK_DELAY_MS);
        setTimeout(closeSettingsModal, constants.FEEDBACK_RESET_DELAY_MS);
    } catch (error) { logError("Error saving settings.", error); displayStatus("Error al guardar la configuración.", "error", constants.SETTINGS_FEEDBACK_DELAY_MS); }
};
const handleClearConversation = () => {
    if (!isInitialized) return; logDebug("Handling Clear Conversation request...");
    const confirmed = confirm("¿Estás seguro de que quieres borrar los mensajes de la VENTANA DE CHAT?\n\nEsto solo limpia la pantalla en tu navegador para esta sesión.\nLa conversación real con el asistente NO se elimina.");
    if (!confirmed) { displayStatus("Acción cancelada.", "info", 2000); return; }
    displayStatus("Borrando mensajes...", "loading", 0);
    try { helpers.clearChatMessages(); logDebug("clearChatMessages helper executed successfully."); displayStatus("Mensajes borrados de la ventana.", "success", constants.SETTINGS_FEEDBACK_DELAY_MS); }
    catch (error) { logError("Error executing clearChatMessages.", error); displayStatus("Error al intentar borrar los mensajes.", "error", constants.SETTINGS_FEEDBACK_DELAY_MS); }
};
const handleGlobalEscapeKey = (event) => { if (event.key === 'Escape' && state.isSettingsOpen) { logDebug("Closing settings modal via global Escape key listener."); event.preventDefault(); closeSettingsModal(); } };
const handleOverlayClick = (event) => { if (event.target === elements.overlay && state.isSettingsOpen) { logDebug("Closing settings modal via overlay click."); closeSettingsModal(); } };


// --- Public API ---

export const initializeSettings = (dependencies) => {
    if (isInitialized) {
        logWarn("Initialization attempted again, but already initialized.");
        return true;
    }
    logDebug("Initializing settings module...");

    elements = { ...elements, ...(dependencies.elements || {}) };
    state = dependencies.state || {};
    helpers = dependencies.helpers || {}; // helpers ahora incluye handleNewConversation
    constants = { ...constants, ...(dependencies.constants || {}) };
    cssClasses = { ...cssClasses, ...(dependencies.css || {}) };

    if (elements.form) {
        elements.soundCheckbox = elements.form.elements['notificationSound'];
        elements.analyticsCheckbox = elements.form.elements['allowAnalytics'];
    } else {
        elements.soundCheckbox = null;
        elements.analyticsCheckbox = null;
    }

    if (!validateDependencies()) {
        logError("Settings module initialization failed: Essential dependencies missing.");
        return false;
    }

    try {
        const initialSettings = loadSettings();
        applySettings(initialSettings);
    } catch (error) {
        logError("Critical error during initial settings load/apply.", error);
        return false;
    }

    let eventListenersAttachedSuccessfully = true;
    const safeAddListener = (element, eventName, handler, elementNameForLog) => {
        if (element) {
            try {
                element.removeEventListener(eventName, handler);
                element.addEventListener(eventName, handler);
            } catch (e) {
                logError(`Error attaching ${eventName} listener to ${elementNameForLog}:`, e);
                eventListenersAttachedSuccessfully = false;
            }
        }
    };

    safeAddListener(elements.form, 'submit', handleFormSubmit, 'settingsForm');
    safeAddListener(elements.closeButton, 'click', closeSettingsModal, 'closeSettingsModalButton');
    safeAddListener(elements.cancelButton, 'click', closeSettingsModal, 'cancelSettingsButton');
    safeAddListener(elements.clearConversationButton, 'click', handleClearConversation, 'clearConversationButton');
    
    // NUEVO: Listener para el botón de Nueva Conversación
    if (elements.newConversationButton && typeof helpers.handleNewConversation === 'function') {
        safeAddListener(elements.newConversationButton, 'click', helpers.handleNewConversation, 'newConversationButton');
    } else if (elements.newConversationButton) {
        logError("New Conversation button found, but handleNewConversation helper is missing/invalid.");
        eventListenersAttachedSuccessfully = false; // Opcional: considerar esto un fallo crítico
    }


    safeAddListener(elements.overlay, 'click', handleOverlayClick, 'settingsModalOverlay');
    try {
        document.removeEventListener('keydown', handleGlobalEscapeKey);
        document.addEventListener('keydown', handleGlobalEscapeKey);
    } catch (e) {
        logError(`Error attaching global keydown listener:`, e);
        eventListenersAttachedSuccessfully = false;
    }

    if (!eventListenersAttachedSuccessfully) {
        logError("Settings module initialization failed: One or more crucial event listeners could not be attached.");
        return false;
    }

    isInitialized = true;
    logDebug("Settings module initialization successful.");
    return true;
};

export const openSettingsModal = () => {
    if (!isInitialized) { logError("Cannot open modal: Settings module not initialized or init failed."); return; }
    if (state.isSettingsOpen) { return; }

    logDebug("Opening settings modal...");
    state.lastFocusedElement = document.activeElement;
    state.isSettingsOpen = true;

    try {
        const currentSettings = loadSettings();
        applySettings(currentSettings);
        clearStatus();
    } catch (error) {
        logError("Error preparing UI on modal open.", error);
    }

    elements.overlay.hidden = false;
    elements.dialog.hidden = false;

    if ('inert' in elements.dialog) { elements.dialog.inert = false; }
    if ('inert' in elements.overlay) { elements.overlay.inert = false; }
    
    elements.overlay.setAttribute('aria-hidden', 'false');
    elements.dialog.setAttribute('aria-modal', 'true');
    elements.dialog.setAttribute('aria-hidden', 'false');
    elements.triggerButton?.setAttribute('aria-expanded', 'true');

    requestAnimationFrame(() => {
        elements.overlay.classList.add(cssClasses.MODAL_OVERLAY_VISIBLE);
        setTimeout(() => {
            activateFocusTrap();
            const focusTargets = [
                elements.soundCheckbox, elements.analyticsCheckbox,
                elements.clearConversationButton, elements.newConversationButton, // NUEVO: añadido para el focus trap
                elements.form,
                elements.cancelButton, elements.closeButton,
                elements.dialog
            ].filter(el => el && el.offsetParent !== null && !el.disabled);

            const elementToFocus = focusTargets[0];
            if (elementToFocus) {
                elementToFocus.focus();
                logDebug(`Initial focus set to: ${elementToFocus.id || elementToFocus.name || elementToFocus.tagName}`);
            } else {
                 logWarn("No suitable element found for initial focus in settings modal.");
                 if (elements.dialog.getAttribute('tabindex') === '-1') elements.dialog.focus();
            }
        }, 50);
    });
    helpers.announceToSr("Panel de configuración abierto.");
};

export const closeSettingsModal = () => {
    if (!state.isSettingsOpen || !isInitialized) {
        return;
    }

    logDebug("Closing settings modal...");
    state.isSettingsOpen = false;
    deactivateFocusTrap();

    if ('inert' in elements.dialog) { elements.dialog.inert = true; }
    if ('inert' in elements.overlay) { elements.overlay.inert = true; }

    const elementToRestoreFocus = state.lastFocusedElement;
    let didRestore = false;
    if (elementToRestoreFocus && typeof elementToRestoreFocus.focus === 'function' && document.body.contains(elementToRestoreFocus)) {
        try { elementToRestoreFocus.focus(); didRestore = true; } catch (e) { logWarn("Error restoring focus to last element.", e); }
    }
    if (!didRestore && elements.triggerButton && typeof elements.triggerButton.focus === 'function') {
        try { elements.triggerButton.focus(); didRestore = true; } catch (e) { logWarn("Error restoring focus to trigger button.", e); }
    }
    state.lastFocusedElement = null;

    elements.overlay.classList.remove(cssClasses.MODAL_OVERLAY_VISIBLE);
    elements.dialog.setAttribute('aria-hidden', 'true');
    elements.dialog.removeAttribute('aria-modal');
    elements.overlay.setAttribute('aria-hidden', 'true');
    elements.triggerButton?.setAttribute('aria-expanded', 'false');

    const transitionDuration = constants.MODAL_TRANSITION_DURATION_MS ?? 300;
    let cleanupDone = false;
    const finalCleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;
        elements.overlay.hidden = true;
        elements.dialog.hidden = true;
        elements.overlay.removeEventListener('transitionend', onTransitionEnd);
    };
    const onTransitionEnd = (event) => {
        if (event.target === elements.overlay && event.propertyName === 'opacity') {
            finalCleanup();
        }
    };
    elements.overlay.addEventListener('transitionend', onTransitionEnd);
    setTimeout(finalCleanup, transitionDuration + 50);

    helpers.announceToSr("Panel de configuración cerrado.");
};

// --- END OF settings.js (v1.3.5) ---