# SpeakIn

Extensão de navegador que injeta um botão de microfone em campos de texto para transcrever áudio usando Whisper da GROQ.

## Funcionalidades

- Detecta automaticamente campos de texto em páginas web
- Injeta botão de microfone ao lado dos controles existentes
- Gravação de áudio direto do navegador
- Transcrição automática usando Whisper Large V3
- Inserção automática do texto transcrito no campo
- Interface integrada ao design da página

## Tecnologias

- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Vite
- GROQ Whisper API

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/SpeakIn.git
cd SpeakIn
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Compile o projeto

```bash
npm run build
```

Isso criará a pasta `dist/` com os arquivos compilados.

### 4. Carregue a extensão no navegador

#### Chrome / Edge / Brave

1. Acesse `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta raiz do projeto (SpeakIn)

#### Firefox

1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em "Carregar extensão temporária"
3. Selecione o arquivo `manifest.json` na pasta raiz

### 5. Configure a API Key

1. Clique no ícone da extensão SpeakIn na barra de ferramentas do navegador
2. Um popup será aberto com a interface de configuração
3. Obtenha sua chave gratuita em: https://console.groq.com/keys
4. Cole a API key no campo de texto
5. Clique em "Salvar"
6. A chave ficará salva localmente no seu navegador

Para remover a API key, clique no botão de lixeira no popup.

## Uso

1. Navegue para qualquer página com campos de texto
2. O botão de microfone aparecerá automaticamente ao lado dos controles
3. Clique no ícone de microfone para iniciar a gravação
4. Fale claramente
5. Clique novamente para parar e transcrever
6. O texto será inserido automaticamente no campo

## Desenvolvimento

Para desenvolvimento com hot reload:

```bash
npm run dev
```

Isso compilará os arquivos em modo watch. Você precisará recarregar a extensão no navegador após cada mudança.

## Build de produção

```bash
npm run build
```

## Estrutura do projeto

```
SpeakIn/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.tsx          # Componente Button do Shadcn
│   │   └── MicrophoneButton.tsx    # Componente principal do microfone
│   ├── content/
│   │   └── index.tsx                # Content script (injeta botão nas páginas)
│   ├── popup/
│   │   ├── index.tsx                # Entry point do popup
│   │   └── Popup.tsx                # Interface de configuração da API key
│   ├── lib/
│   │   └── utils.ts                 # Utilitários
│   └── index.css                    # Estilos globais Tailwind
├── icons/                           # Ícones da extensão
├── dist/                            # Arquivos compilados (gerado pelo build)
├── popup.html                       # HTML do popup
├── manifest.json                    # Manifest da extensão
├── vite.config.ts                   # Configuração do Vite
├── tailwind.config.js               # Configuração do Tailwind
├── tsconfig.json                    # Configuração do TypeScript
└── package.json                     # Dependências
```

## Privacidade

- A extensão não coleta dados pessoais
- O áudio é enviado apenas para a API do GROQ
- A API key é armazenada localmente no navegador
- Nenhum dado é compartilhado com terceiros

## Limitações

- Requer conexão com internet para transcrição
- Sujeito aos limites da API do GROQ
- Funciona melhor com áudio claro e sem ruído de fundo
- Detecta campos de texto em páginas modernas com estruturas similares

## Solução de problemas

### O botão não aparece

- Verifique se a página possui campos de texto compatíveis
- Recarregue a página após instalar a extensão
- Verifique se a extensão está ativada

### Erro ao transcrever

- Verifique se a API key está configurada corretamente
- Teste sua API key em: https://console.groq.com/playground
- Verifique sua conexão com internet
- Confirme que não excedeu os limites da API

### Permissão de microfone negada

- Clique no ícone de cadeado na barra de endereço
- Permita o acesso ao microfone para o site

## Licença

MIT
