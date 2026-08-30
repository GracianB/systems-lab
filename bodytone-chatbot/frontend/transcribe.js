// frontend/transcribe.js (v3.1 - Optional Send Button Dependency)

/**
 * ============================================================================
 *  Web Speech API Voice Input Module - v3.1
 * ============================================================================
 *
 *  Purpose:
 *  - Manages browser-based speech recognition (SpeechRecognition API).
 *  - Handles starting, stopping, and canceling voice recording.
 *  - Provides real-time interim and final transcription results.
 *  - Updates UI elements to reflect recording state.
 *  - Communicates state changes and final transcripts back to the main script.
 *
 *  Key Improvements in v3.1:
 *  - Optional `sendMessageButton` Dependency: The module no longer requires the
 *    send button to initialize. It will gracefully handle its absence, making the
 *    module more robust and adaptable to different UI configurations. This
 *    resolves initialization failures if the send button is not found.
 *  - Enhanced Initialization Logs: Logs now clearly distinguish between
 *    required and optional dependencies.
 *  - Maintained Core Logic: The robust transcription and state management
 *    logic from v3 remains unchanged.
 * ============================================================================
 */

const VOICE_LOG_PREFIX = "[voice.js v3.1]";

// --- Module State ---
let state = {
    isRecording: false,
    speechRecognition: null,
    finalTranscript: '',
    interimTranscript: '',
};

// --- Module Dependencies ---
let dependencies = {
    messageInput: null,
    sendMessageButton: null, // Now optional
    voiceInputButton: null,
    announceFn: (message) => console.log(`[Voice Announce Fallback] ${message}`),
    onStateChange: () => {},
    onTranscriptionComplete: () => {},
};

/**
 * Sets up the SpeechRecognition instance and its event handlers.
 */
function setupSpeechRecognition() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
        console.error(`${VOICE_LOG_PREFIX} Speech Recognition API not supported in this browser.`);
        return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'es-ES';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        console.log(`${VOICE_LOG_PREFIX} Speech recognition started.`);
        state.isRecording = true;
        state.finalTranscript = '';
        state.interimTranscript = '';
        updateVoiceUI();
        dependencies.announceFn("Grabación de voz iniciada.");
        dependencies.onStateChange(true);
    };

    recognition.onresult = (event) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                state.finalTranscript += transcriptPart;
            } else {
                currentInterim += transcriptPart;
            }
        }
        state.interimTranscript = currentInterim;
        if (dependencies.messageInput) {
            dependencies.messageInput.value = (state.finalTranscript + state.interimTranscript).trim();
            dependencies.messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    recognition.onerror = (event) => {
        console.error(`${VOICE_LOG_PREFIX} Speech recognition error:`, event.error, event.message);
        let errorMessage = "Error en el reconocimiento de voz.";
        if (event.error === 'no-speech') errorMessage = "No se detectó habla.";
        else if (event.error === 'audio-capture') errorMessage = "Error al capturar audio. Revisa tu micrófono.";
        else if (event.error === 'not-allowed') errorMessage = "Permiso para micrófono denegado.";
        dependencies.announceFn(errorMessage, 'assertive');
        internalStopRecording(false); // Cancel on error
    };

    recognition.onend = () => {
        console.log(`${VOICE_LOG_PREFIX} Speech recognition service ended.`);
        if (state.isRecording) { // Finalizing a recording session
            state.isRecording = false;
            updateVoiceUI();
            const finalTranscriptToSend = state.finalTranscript.trim();
            if (dependencies.messageInput) {
                dependencies.messageInput.value = finalTranscriptToSend;
                dependencies.messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            dependencies.onStateChange(false);
            dependencies.onTranscriptionComplete(finalTranscriptToSend);
        } else { // Ended after a cancellation or error
             updateVoiceUI();
             dependencies.onStateChange(false);
        }
    };

    return recognition;
}

/**
 * Updates UI elements based on the recording state.
 */
function updateVoiceUI() {
    const { messageInput, sendMessageButton, voiceInputButton } = dependencies;
    const isRec = state.isRecording;

    if (voiceInputButton) {
        voiceInputButton.setAttribute('aria-pressed', String(isRec));
        voiceInputButton.setAttribute('aria-label', isRec ? 'Detener grabación' : 'Iniciar grabación');
        voiceInputButton.classList.toggle('recording', isRec);
        const icon = voiceInputButton.querySelector('svg');
        if (icon) { // Simple and robust icon toggling
            icon.style.fill = isRec ? '#FF3B30' : 'currentColor';
        }
    }

    if (messageInput) {
        messageInput.disabled = isRec;
        messageInput.placeholder = isRec ? "Escuchando..." : "Escribe tu consulta...";
    }

    // Gracefully handle missing sendMessageButton
    if (sendMessageButton) {
        sendMessageButton.disabled = isRec || !dependencies.messageInput?.value.trim();
    }
}

/**
 * Safely stops the speech recognition process.
 * @param {boolean} processTranscript - If true, the final transcript will be processed. If false, it's a cancellation.
 */
function internalStopRecording(processTranscript = true) {
    if (!state.speechRecognition || !state.isRecording) {
        return;
    }
    
    console.log(`${VOICE_LOG_PREFIX} internalStopRecording called. Process transcript: ${processTranscript}`);
    
    // If cancelling, clear transcripts immediately.
    if (!processTranscript) {
        state.finalTranscript = '';
        state.interimTranscript = '';
        if (dependencies.messageInput) {
            dependencies.messageInput.value = '';
            dependencies.messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        dependencies.onTranscriptionComplete('');
    }

    // This flag is critical. The onend event will behave differently based on this.
    state.isRecording = false; 
    state.speechRecognition.stop();
    updateVoiceUI(); // Immediate UI feedback
}


/**
 * Starts the voice recording process.
 */
async function startRecording() {
    if (state.isRecording || !state.speechRecognition) {
        return;
    }

    try {
        // This implicitly handles permissions.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // We only need permission, not the stream itself.
        
        console.log(`${VOICE_LOG_PREFIX} Microphone permission granted. Starting recognition.`);
        if (dependencies.messageInput) dependencies.messageInput.value = '';
        state.speechRecognition.start();
    } catch (err) {
        console.error(`${VOICE_LOG_PREFIX} Error obtaining microphone permission:`, err);
        const permissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
        dependencies.announceFn(
            permissionDenied ? "Permiso para micrófono denegado." : "No se pudo iniciar la grabación.",
            'assertive'
        );
        updateVoiceUI();
        dependencies.onStateChange(false);
    }
}

/**
 * Stops recording and processes the result.
 */
function stopRecordingAndProcess() {
    if (!state.isRecording) return;
    dependencies.announceFn("Grabación detenida.");
    internalStopRecording(true);
}

/**
 * Toggles the recording state.
 */
function handleToggleVoiceRecording() {
    if (!state.speechRecognition) {
         dependencies.announceFn("Reconocimiento de voz no disponible.", 'assertive');
         return;
    }
    if (state.isRecording) {
        stopRecordingAndProcess();
    } else {
        startRecording();
    }
}

/**
 * Initializes the voice input module.
 * @param {object} config - Configuration object with dependencies.
 * @returns {boolean} True if initialization was successful, false otherwise.
 */
export function initializeVoiceInput(config) {
    console.log(`${VOICE_LOG_PREFIX} Initializing...`);

    dependencies = { ...dependencies, ...config };

    // Define which elements are absolutely required vs. optional
    const requiredElements = ['messageInput', 'voiceInputButton'];
    const optionalElements = ['sendMessageButton'];

    const missingRequired = requiredElements.filter(key => !dependencies[key]);
    if (missingRequired.length > 0) {
        console.error(`${VOICE_LOG_PREFIX} Initialization failed: Missing required DOM elements: [${missingRequired.join(', ')}].`);
        if (dependencies.voiceInputButton) dependencies.voiceInputButton.disabled = true;
        return false;
    }

    const missingOptional = optionalElements.filter(key => !dependencies[key]);
    if (missingOptional.length > 0) {
         console.warn(`${VOICE_LOG_PREFIX} Optional elements not found: [${missingOptional.join(', ')}]. Module will proceed.`);
    }

    state.speechRecognition = setupSpeechRecognition();

    if (!state.speechRecognition) {
        if (dependencies.voiceInputButton) {
            dependencies.voiceInputButton.disabled = true;
            dependencies.voiceInputButton.title = 'Voz no soportada';
        }
        console.warn(`${VOICE_LOG_PREFIX} Initialization failed: Speech Recognition not supported.`);
        return false;
    }

    dependencies.voiceInputButton.addEventListener('click', handleToggleVoiceRecording);
    updateVoiceUI();

    console.log(`${VOICE_LOG_PREFIX} Initialized Successfully.`);
    return true;
}