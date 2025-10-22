import React, { useState, useEffect } from 'react';
import { Key, Trash2, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

export const Popup: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('groq_api_key');
    if (key) {
      setSavedKey(key);
      setApiKey(key);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('groq_api_key', apiKey.trim());
      setSavedKey(apiKey.trim());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('groq_api_key');
    setApiKey('');
    setSavedKey('');
    setShowClearSuccess(true);
    setTimeout(() => setShowClearSuccess(false), 3000);
  };

  const isKeyConfigured = savedKey.length > 0;

  return (
    <div className="w-[400px] min-h-[300px] p-6 bg-background">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">SpeakIn</h1>
            <p className="text-sm text-muted-foreground">
              Configuração da API Key
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="api-key"
              className="text-sm font-medium text-foreground"
            >
              GROQ API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Obtenha sua chave em{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.groq.com/keys
              </a>
            </p>
          </div>

          {showSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400">
                API Key salva com sucesso
              </span>
            </div>
          )}

          {showClearSuccess && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
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

        <div className="pt-4 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span
                className={`text-sm font-medium ${
                  isKeyConfigured ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {isKeyConfigured ? 'Configurado' : 'Não configurado'}
              </span>
            </div>
            {isKeyConfigured && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chave:</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {savedKey.substring(0, 12)}...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            A API key é armazenada localmente no seu navegador e nunca é
            compartilhada.
          </p>
          <p>
            Após configurar, o botão de microfone aparecerá automaticamente em
            campos de texto.
          </p>
        </div>
      </div>
    </div>
  );
};
