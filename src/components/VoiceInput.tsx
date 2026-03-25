import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  lang: string;
  onTranscript: (text: string) => void;
  onParsedEntry?: (entry: { customer_name: string; amount: string; entry_type: "credit" | "debit"; description: string }) => void;
  businessId?: string | null;
}

export default function VoiceInput({ lang, onTranscript, onParsedEntry, businessId }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: lang === "hi" ? "ब्राउज़र सपोर्ट नहीं करता" : "Browser not supported",
        description: lang === "hi" ? "कृपया Chrome ब्राउज़र इस्तेमाल करें" : "Please use Chrome browser",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
      onTranscript(finalTranscript);
    };

    recognition.onend = () => {
      setListening(false);
      // Auto-parse if we have a transcript
      if (recognitionRef.current?._lastTranscript && onParsedEntry) {
        parseWithAI(recognitionRef.current._lastTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error === "not-allowed") {
        toast({
          title: lang === "hi" ? "माइक्रोफ़ोन की अनुमति दें" : "Allow microphone access",
          variant: "destructive",
        });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onTranscript, onParsedEntry, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current._lastTranscript = transcript;
      recognitionRef.current.stop();
    }
  }, [transcript]);

  const parseWithAI = async (text: string) => {
    if (!text.trim() || !onParsedEntry) return;
    setParsing(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const resp = await supabase.functions.invoke("parse-voice-entry", {
        body: { text, lang },
      });

      if (resp.error) throw resp.error;
      const parsed = resp.data;
      if (parsed && parsed.customer_name && parsed.amount) {
        onParsedEntry({
          customer_name: parsed.customer_name,
          amount: String(parsed.amount),
          entry_type: parsed.entry_type || "credit",
          description: parsed.description || text,
        });
        toast({
          title: lang === "hi" ? "✅ एंट्री पार्स हो गई!" : "✅ Entry parsed!",
          description: `${parsed.customer_name} — ₹${parsed.amount} (${parsed.entry_type === "credit" ? "उधार" : "पैसे मिले"})`,
        });
      } else {
        toast({
          title: lang === "hi" ? "समझ नहीं आया" : "Could not understand",
          description: lang === "hi" ? "कृपया दोबारा बोलें जैसे 'राजू को 500 रुपये दिए'" : "Try saying like 'Gave 500 rupees to Raju'",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: lang === "hi" ? "त्रुटि" : "Error",
        description: err.message || "Failed to parse",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={listening ? "destructive" : "outline"}
          size="lg"
          className={`gap-2 rounded-xl h-12 font-bold transition-all ${
            listening ? "animate-pulse shadow-lg" : "border-primary/30 hover:bg-primary/5"
          }`}
          onClick={listening ? stopListening : startListening}
          disabled={parsing}
        >
          {parsing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {lang === "hi" ? "पार्स हो रहा है..." : "Parsing..."}
            </>
          ) : listening ? (
            <>
              <MicOff size={18} />
              {lang === "hi" ? "🔴 सुन रहा है... टैप करें" : "🔴 Listening... Tap to stop"}
            </>
          ) : (
            <>
              <Mic size={18} />
              {lang === "hi" ? "🎙️ बोलकर एंट्री करें" : "🎙️ Voice Entry"}
            </>
          )}
        </Button>
      </div>

      {transcript && (
        <div className="rounded-xl bg-accent/50 border border-border/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">
            {lang === "hi" ? "📝 आपने कहा:" : "📝 You said:"}
          </p>
          <p className="text-sm font-medium text-foreground">{transcript}</p>
        </div>
      )}

      {!listening && !transcript && (
        <p className="text-xs text-muted-foreground">
          {lang === "hi"
            ? "💡 बोलें: \"राजू को 500 रुपये दिए\" या \"श्याम से 1000 रुपये मिले\""
            : "💡 Say: \"Gave 500 rupees to Raju\" or \"Received 1000 from Shyam\""}
        </p>
      )}
    </div>
  );
}
