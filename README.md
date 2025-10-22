# SpeakIn

Extensão de navegador para transcrever áudio em texto usando Whisper da GROQ.

## Funcionalidades

- Gravação de áudio direto do navegador
- Transcrição automática usando Whisper Large V3
- Interface minimalista e fácil de usar
- Cópia rápida do texto transcrito

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/SpeakIn.git
cd SpeakIn
```

### 2. Configure a API Key

A API key do GROQ é configurada diretamente na interface da extensão. Você pode obter sua chave gratuita em:

https://console.groq.com/keys

### 3. Gere os ícones (opcional)

A extensão inclui um ícone SVG em `icons/icon.svg`. Para gerar os PNGs necessários:

```bash
# Usando ImageMagick
convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
```

Alternativamente, use qualquer editor gráfico para criar ícones PNG de 16x16, 48x48 e 128x128 pixels.

### 4. Carregue a extensão no navegador

#### Chrome / Edge / Brave

1. Acesse `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta do projeto

#### Firefox

1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em "Carregar extensão temporária"
3. Selecione o arquivo `manifest.json`

## Uso

1. Clique no ícone da extensão na barra de ferramentas
2. Cole sua API Key do GROQ (será salva localmente)
3. Clique em "Gravar" e comece a falar
4. Clique em "Parar" quando terminar
5. A transcrição aparecerá automaticamente
6. Use o botão "Copiar" para copiar o texto

## Configuração

A API key é armazenada localmente no navegador usando localStorage. Nenhum dado é enviado para servidores externos além da API do GROQ.

## Tecnologias

- Manifest V3
- MediaRecorder API
- GROQ Whisper API
- Vanilla JavaScript

## Privacidade

- A extensão não coleta dados pessoais
- O áudio é enviado apenas para a API do GROQ
- A API key é armazenada localmente no navegador
- Nenhum dado é compartilhado com terceiros

## Limitações

- Requer conexão com internet para transcrição
- Sujeito aos limites da API gratuita do GROQ
- Funciona melhor com áudio claro e sem ruído de fundo

## Licença

MIT
