'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, MicOff } from 'lucide-react';

interface VoiceNoteRecorderProps {
  clientId: string;
  onSave: (data: any) => Promise<void>;
}

export function VoiceNoteRecorder({ clientId, onSave }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [structured, setStructured] = useState<any>(null);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        clearInterval(timerRef.current!);
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        setIsProcessing(false);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((p) => p + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('clientId', clientId);

      const res = await fetch('/api/ai/voice-to-notes', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTranscript(data.transcript);
      setStructured(data.structured);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  const handleSave = async () => {
    await onSave({
      transcript,
      structured,
      clientId,
    });
    setTranscript('');
    setStructured(null);
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-slate-50">
      <h3 className="text-lg font-semibold">🎤 Record Case Note</h3>

      <div className="flex gap-2 items-center">
        {!isRecording ? (
          <Button onClick={startRecording} disabled={isProcessing || !!structured}>
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive">
            <MicOff className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
        {isRecording && (
          <span className="text-sm text-red-600 font-mono">
            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing audio...
        </div>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">⚠️ {error}</div>}

      {transcript && (
        <div>
          <label className="text-sm font-medium">Transcript</label>
          <p className="mt-2 p-3 bg-white border rounded text-sm">{transcript}</p>
        </div>
      )}

      {structured && (
        <div className="p-4 bg-green-50 border border-green-200 rounded space-y-3">
          <h4 className="font-semibold text-green-900">AI-Structured Note</h4>

          <div>
            <label className="text-sm font-medium">Summary</label>
            <textarea
              value={structured.summary || ''}
              onChange={(e) => setStructured({ ...structured, summary: e.target.value })}
              className="mt-1 w-full p-2 border rounded text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Service Type</label>
              <input
                type="text"
                value={structured.service_type || ''}
                onChange={(e) => setStructured({ ...structured, service_type: e.target.value })}
                className="mt-1 w-full p-2 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Risk Level</label>
              <select
                value={structured.mood_risk?.includes('high') ? 'high' : structured.mood_risk?.includes('medium') ? 'medium' : 'low'}
                onChange={(e) => setStructured({ ...structured, mood_risk: `risk: ${e.target.value}` })}
                className="mt-1 w-full p-2 border rounded text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Observations</label>
            <textarea
              value={structured.observations || ''}
              onChange={(e) => setStructured({ ...structured, observations: e.target.value })}
              className="mt-1 w-full p-2 border rounded text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Action Items</label>
            <textarea
              value={structured.action_items || ''}
              onChange={(e) => setStructured({ ...structured, action_items: e.target.value })}
              className="mt-1 w-full p-2 border rounded text-sm"
              rows={2}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Case Note
          </Button>
        </div>
      )}
    </div>
  );
}