import React, { useState, useEffect } from 'react';
import { Key, Trash2, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

export const Popup: React.FC = () => {
  console.log('{SPEAKIN} Popup component initializing');

  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  useEffect(() => {
    console.log('{SPEAKIN} Popup useEffect running');
    chrome.storage.local.get(['groq_api_key'], (result) => {
      const key = result.groq_api_key;
      console.log('{SPEAKIN} Retrieved API key from chrome.storage:', key ? `${key.substring(0, 12)}...` : 'null');
      if (key) {
        setSavedKey(key);
        setApiKey(key);
      }
    });
  }, []);

  const handleSave = () => {
    console.log('{SPEAKIN} handleSave called');
    if (apiKey.trim()) {
      console.log('{SPEAKIN} Saving API key to chrome.storage:', apiKey.substring(0, 12) + '...');
      chrome.storage.local.set({ groq_api_key: apiKey.trim() }, () => {
        setSavedKey(apiKey.trim());
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        console.log('{SPEAKIN} API key saved successfully to chrome.storage');
      });
    } else {
      console.log('{SPEAKIN} API key is empty, not saving');
    }
  };

  const handleClear = () => {
    console.log('{SPEAKIN} handleClear called');
    chrome.storage.local.remove('groq_api_key', () => {
      setApiKey('');
      setSavedKey('');
      setShowClearSuccess(true);
      setTimeout(() => setShowClearSuccess(false), 3000);
      console.log('{SPEAKIN} API key cleared from chrome.storage');
    });
  };

  const isKeyConfigured = savedKey.length > 0;

  return (
    <div className="w-[400px] min-h-[300px] p-6 bg-[#F5F5F4]">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D97757] flex items-center justify-center shadow-sm">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#1F1F1F]">SpeakIn</h1>
            <p className="text-sm text-[#6B6B6B]">
              Configuração da API Key
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="api-key"
              className="text-sm font-medium text-[#1F1F1F]"
            >
              GROQ API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent font-mono text-[#1F1F1F]"
            />
            <p className="text-xs text-[#6B6B6B]">
              Obtenha sua chave em{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D97757] hover:underline"
              >
                console.groq.com/keys
              </a>
            </p>
          </div>

          {showSuccess && (
            <div className="flex items-center gap-2 p-3 bg-[#FEF3EF] border border-[#F4D4C7] rounded-lg">
              <Check className="w-4 h-4 text-[#D97757]" />
              <span className="text-sm text-[#D97757] font-medium">
                API Key salva com sucesso
              </span>
            </div>
          )}

          {showClearSuccess && (
            <div className="flex items-center gap-2 p-3 bg-[#F0F0F0] border border-[#D4D4D4] rounded-lg">
              <Check className="w-4 h-4 text-[#6B6B6B]" />
              <span className="text-sm text-[#6B6B6B] font-medium">
                API Key removida com sucesso
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1"
            >
              Salvar
            </Button>
            <Button
              onClick={handleClear}
              disabled={!isKeyConfigured}
              variant="destructive"
              size="icon"
              title="Limpar API Key"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E5E5]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B6B6B]">Status:</span>
              <span
                className={`text-sm font-medium ${
                  isKeyConfigured ? 'text-[#D97757]' : 'text-[#A0A0A0]'
                }`}
              >
                {isKeyConfigured ? 'Configurado' : 'Não configurado'}
              </span>
            </div>
            {isKeyConfigured && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B6B6B]">Chave:</span>
                <span className="text-xs font-mono text-[#6B6B6B]">
                  {savedKey.substring(0, 12)}...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-[#6B6B6B] space-y-1">
          <p>
            A API key é armazenada localmente no seu navegador e nunca é
            compartilhada.
          </p>
          <p>
            Após configurar, o botão de microfone aparecerá automaticamente em
            campos de texto compatíveis.
          </p>
        </div>
      </div>
    </div>
  );
};
