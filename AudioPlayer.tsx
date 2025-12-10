import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Volume2 } from 'lucide-react';
import { generateSpeech, decodePCM } from '../services/gemini';

interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [error, setError] = useState<boolean>(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    stopAudio();
    setAudioBuffer(null);
    setIsPlaying(false);
    setError(false);
    
    return () => {
      stopAudio();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [text]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
  };

  const getAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const loadAndPlayAudio = async () => {
    setIsLoading(true);
    setError(false);

    try {
      let buffer = audioBuffer;
      if (!buffer) {
        const pcmData = await generateSpeech(text);
        const ctx = getAudioContext();
        buffer = decodePCM(pcmData, ctx);
        setAudioBuffer(buffer);
      }
      playBuffer(buffer);
    } catch (err) {
      console.error("Audio Load Error", err);
      setError(true);
      setIsLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    stopAudio();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    sourceNodeRef.current = source;
    source.start(0);
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handleStop = () => {
    stopAudio();
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-5 p-5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm mb-6 transition-all hover:shadow-md hover:bg-white/80">
      <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white shadow-lg shadow-indigo-200 shrink-0">
        <Volume2 size={24} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide mb-1">Hörverstehen</h4>
        <p className="text-sm text-slate-500 truncate">Listen to the audio clip carefully.</p>
      </div>

      <div className="shrink-0">
        {isPlaying ? (
          <button 
            onClick={handleStop}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all active:scale-95"
          >
            <Pause size={24} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={loadAndPlayAudio}
            disabled={isLoading}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:shadow-none"
          >
             {isLoading ? (
               <RefreshCw size={24} className="animate-spin" />
             ) : (
               <Play size={24} fill="currentColor" className="ml-1" />
             )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;