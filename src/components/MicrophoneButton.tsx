import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onTranscription,
  className,
}) => {
  console.log('{SPEAKIN} MicrophoneButton component mounted');

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const getApiKey = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['groq_api_key'], (result) => {
        const key = result.groq_api_key || null;
        console.log('{SPEAKIN} Retrieved API key from chrome.storage:', key ? `${key.substring(0, 12)}...` : 'null');
        resolve(key);
      });
    });
  };

  const startRecording = async () => {
    console.log('{SPEAKIN} startRecording called');
    try {
      console.log('{SPEAKIN} Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('{SPEAKIN} Microphone access granted');

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      console.log('{SPEAKIN} MediaRecorder created');

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('{SPEAKIN} Audio chunk received, size:', event.data.size);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('{SPEAKIN} Recording stopped, total chunks:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('{SPEAKIN} Audio blob created, size:', audioBlob.size);
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        console.log('{SPEAKIN} Stream tracks stopped');
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('{SPEAKIN} Recording started');
    } catch (error) {
      console.error('{SPEAKIN} ERROR starting recording:', error);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    console.log('{SPEAKIN} stopRecording called');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      console.log('{SPEAKIN} MediaRecorder stopped, processing...');
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    console.log('{SPEAKIN} transcribeAudio called with blob size:', audioBlob.size);
    try {
      const apiKey = await getApiKey();
      console.log('{SPEAKIN} API key retrieved:', apiKey ? `${apiKey.substring(0, 12)}...` : 'null');

      if (!apiKey) {
        console.error('{SPEAKIN} ERROR: No API key configured');
        alert(
          'API Key do GROQ não configurada. Clique no ícone da extensão para configurar.'
        );
        setIsProcessing(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'pt');
      console.log('{SPEAKIN} FormData prepared, sending to GROQ API...');

      const response = await fetch(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        }
      );

      console.log('{SPEAKIN} API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('{SPEAKIN} API error:', errorData);
        throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      console.log('{SPEAKIN} Transcription received:', data);

      if (data.text) {
        console.log('{SPEAKIN} Calling onTranscription callback with text:', data.text);
        onTranscription(data.text);
      } else {
        console.log('{SPEAKIN} No text detected in response');
        alert('Nenhum texto detectado');
      }
    } catch (error) {
      console.error('{SPEAKIN} ERROR in transcribeAudio:', error);
      alert(`Erro ao transcrever: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
      console.log('{SPEAKIN} Processing complete');
    }
  };

  const handleClick = () => {
    console.log('{SPEAKIN} Button clicked, isRecording:', isRecording, 'isProcessing:', isProcessing);
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        'shrink-0 transition-all h-8 min-w-8 rounded-lg',
        isRecording && 'text-red-500 hover:text-red-600',
        className
      )}
      aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <Square className="h-4 w-4 fill-current" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
