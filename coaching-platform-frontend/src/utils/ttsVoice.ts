/**
 * Pick a clearer English female voice for SpeechSynthesis (OS/browser dependent).
 * Names vary by platform (e.g. Google UK English Female, Microsoft Zira, Samantha on macOS).
 */

let cachedListKey = '';
let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesListenerInstalled = false;

function ensureVoicesChangedListener(): void {
    if (voicesListenerInstalled || typeof window === 'undefined' || !window.speechSynthesis) return;
    voicesListenerInstalled = true;
    window.speechSynthesis.addEventListener('voiceschanged', () => {
        cachedListKey = '';
        cachedVoice = null;
    });
}

function voiceListFingerprint(voices: SpeechSynthesisVoice[]): string {
    return voices.map((v) => `${v.voiceURI}|${v.lang}`).join('\n');
}

function isEnglishVoice(v: SpeechSynthesisVoice): boolean {
    const lang = (v.lang || '').toLowerCase();
    return lang.startsWith('en');
}

/** Substrings often associated with female-presenting system voices (heuristic). */
const FEMALE_VOICE_HINT =
    /female|woman|zira|sonia|aria|jenny|samantha|victoria|karen|moira|susan|linda|tessa|fiona|serena|veena|emma|amy|hazel|google uk english female|google us english female/i;

function scoreEnglishFemaleCandidate(v: SpeechSynthesisVoice): number {
    if (!isEnglishVoice(v)) return -1;
    const label = `${v.name} ${v.voiceURI}`.toLowerCase();
    let s = 0;
    if (FEMALE_VOICE_HINT.test(label)) s += 100;
    if (/^en-us$/i.test(v.lang.trim())) s += 15;
    if (/^en-gb$/i.test(v.lang.trim())) s += 12;
    if (/^en-in$/i.test(v.lang.trim())) s += 10;
    if ((v as SpeechSynthesisVoice & { localService?: boolean }).localService) s += 5;
    return s;
}

export function pickEnglishFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices.length) return null;
    const ranked = voices
        .map((v) => ({ v, s: scoreEnglishFemaleCandidate(v) }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => b.s - a.s);
    if (ranked.length && ranked[0].s >= 100) return ranked[0].v;
    const fallback = voices.find(isEnglishVoice);
    return fallback ?? null;
}

/**
 * Attach best available female English voice and mild rate tuning for readability.
 */
export function applyPreferredFemaleEnVoice(utterance: SpeechSynthesisUtterance): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    ensureVoicesChangedListener();
    const voices = window.speechSynthesis.getVoices();
    const key = voiceListFingerprint(voices);
    if (key !== cachedListKey) {
        cachedListKey = key;
        cachedVoice = pickEnglishFemaleVoice(voices);
    }

    if (cachedVoice) {
        utterance.voice = cachedVoice;
        utterance.lang = cachedVoice.lang || 'en-US';
    } else {
        utterance.lang = 'en-US';
    }

    utterance.rate = 0.92;
    utterance.pitch = 1.02;
}

/** Call once on app load so Chrome/Edge populate voices before first speak. */
export function primeSpeechSynthesisVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
        ensureVoicesChangedListener();
        window.speechSynthesis.getVoices();
    } catch {
        /* ignore */
    }
}

/**
 * Speak English with the same preferred female voice used in Scene / Word activities.
 * Cancels any in-progress speech on the given synthesizer before speaking.
 */
export function speakPreferredEnglish(
    text: string,
    synth: SpeechSynthesis | null | undefined,
    onDone?: () => void
): void {
    if (!synth || !text.trim()) {
        onDone?.();
        return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    applyPreferredFemaleEnVoice(utterance);
    const finish = () => onDone?.();
    utterance.onend = finish;
    utterance.onerror = finish;
    synth.speak(utterance);
}
