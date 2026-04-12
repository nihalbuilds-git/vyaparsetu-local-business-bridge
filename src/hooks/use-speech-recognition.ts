import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    if (!SpeechRecognition || isListening) return;

    // Instantiate synchronously within the user gesture handler
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "hi-IN";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t;
        } else {
          interimText += t;
        }
      }
      setTranscript(finalText + interimText);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (e: any) => {
      // Don't stop for 'no-speech' — keep listening
      if (e.error === "no-speech") return;
      shouldRestartRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    setTranscript("");
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      shouldRestartRef.current = false;
    }
  }, [SpeechRecognition, isListening]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported };
}
