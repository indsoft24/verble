import { useCallback, useEffect, useRef, useState } from 'react';
import { speakPreferredEnglish } from '../utils/ttsVoice';

export function useActivitySpeaker() {
    const [playingKey, setPlayingKey] = useState<string | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => {
            audioRef.current?.pause();
            synthRef.current?.cancel();
        };
    }, []);

    const stop = useCallback(() => {
        audioRef.current?.pause();
        synthRef.current?.cancel();
        setPlayingKey(null);
    }, []);

    const play = useCallback(
        (text: string, key: string, audioUrl?: string) => {
            if (!text?.trim()) return;
            if (playingKey === key) {
                stop();
                return;
            }
            stop();
            setPlayingKey(key);
            const finish = () => setPlayingKey(null);

            if (audioUrl) {
                try {
                    const audio = new Audio(audioUrl);
                    audioRef.current = audio;
                    audio.onended = finish;
                    audio.onerror = () => speakPreferredEnglish(text, synthRef.current, finish);
                    void audio.play().catch(() => speakPreferredEnglish(text, synthRef.current, finish));
                    return;
                } catch {
                    /* TTS fallback */
                }
            }
            speakPreferredEnglish(text, synthRef.current, finish);
        },
        [playingKey, stop]
    );

    return { playingKey, play, stop };
}
