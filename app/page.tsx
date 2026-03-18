"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [textToSpeech, setTextToSpeech] = useState("");
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<any>(null);

  const handleSpeak = () => {
    if (!textToSpeech.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeech);
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudioWithGemini(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Start Web Speech API for live transcription
      if (typeof window !== "undefined") {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            setLiveTranscript(currentTranscript);
          };

          recognition.start();
          recognitionRef.current = recognition;
        }
      }

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript("");
      setLiveTranscript("");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAudioWithGemini = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/gemini/stt", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setTranscript(data.transcript);
      } else {
        setTranscript(`Error: ${data.error}`);
      }
    } catch (error: any) {
      setTranscript(`Failed to process audio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-black text-zinc-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-zinc-800/40 via-black to-black"></div>
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Header */}
      <header className="w-full bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-emerald-500">
            Voice Hub
          </h1>
        </div>
      </header>

      <main className="grow p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-12 relative z-10">
        {/* Intro Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-6">
          <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">
            Your All-In-One AI Audio Assistant
          </h2>
          <p className="text-lg text-zinc-400">
            Easily convert your spoken words to highly accurate text using the power of Google Gemini AI, or turn any written text into natural-sounding speech instantly right in your browser.
          </p>
        </section>
        
        <div className="grid gap-8 md:grid-cols-2">
          {/* Text to Speech Section */}
          <section className="bg-black/40 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_40px_-15px_rgba(255,255,255,0.1)] border border-white/10 transition-all hover:bg-black/60 hover:border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" /><path d="M18.5 12c0-1.892-.888-3.582-2.28-4.664a.75.75 0 10-.94 1.156A6.47 6.47 0 0117 12c0 2.01-1.127 3.8-2.72 4.664a.75.75 0 10.94 1.156A7.97 7.97 0 0018.5 12zM21 12c0-2.91-1.488-5.46-3.8-7.06a.75.75 0 10-.853 1.218A8.47 8.47 0 0119.5 12c0 3.013-1.642 5.6-4.153 7.06a.75.75 0 10.853 1.218A9.97 9.97 0 0021 12z" /></svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100">Text to Speech</h2>
            </div>
            <textarea
              className="w-full p-4 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none min-h-55 mb-6 bg-black/40 text-zinc-100 placeholder-zinc-500 resize-none transition-all"
              placeholder="Type or paste your text here to hear it spoken back to you..."
              value={textToSpeech}
              onChange={(e) => setTextToSpeech(e.target.value)}
            />
            <button
              onClick={handleSpeak}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>Speak Text</span>
            </button>
          </section>

          {/* Speech to Text Section */}
          <section className="bg-black/40 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_40px_-15px_rgba(255,255,255,0.1)] border border-white/10 transition-all hover:bg-black/60 hover:border-white/20 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" /></svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100">Speech to Text</h2>
            </div>
            
            <div className="w-full p-4 border border-white/10 rounded-xl grow min-h-55 mb-6 bg-black/40 overflow-y-auto aspect-auto relative shadow-inner">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                  <span className="text-emerald-400 font-medium tracking-wide">Gemini is transcribing...</span>
                </div>
              ) : isRecording ? (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 text-red-500 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    <span className="text-sm font-semibold tracking-wider">LIVE</span>
                  </div>
                  <p className="text-zinc-400 italic text-lg leading-relaxed">
                    {liveTranscript || "Listening..."}
                  </p>
                </div>
              ) : transcript ? (
                <p className="text-zinc-100 text-lg leading-relaxed">{transcript}</p>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <span className="text-zinc-500 italic">Click "Start Recording", speak your mind, and then click "Stop" to get a highly accurate Gemini transcription...</span>
                </div>
              )}
            </div>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-full px-6 py-3.5 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 text-white ${
                isProcessing 
                  ? "bg-zinc-600 cursor-not-allowed opacity-50" 
                  : isRecording 
                    ? "bg-red-500 hover:bg-red-600 hover:shadow-red-500/25 animate-pulse" 
                    : "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/25"
              }`}
            >
              {isProcessing ? "Processing Audio..." : isRecording ? "Stop Recording" : "Start Recording"}
            </button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-black/60 backdrop-blur-xl border-t border-white/10 py-8 mt-auto relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <p>© {new Date().getFullYear()} Voice Hub. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">Powered by Next.js & Gemini AI</span>
            <a href="#" className="hover:text-zinc-100 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
