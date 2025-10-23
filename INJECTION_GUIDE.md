# Guia de Configuração de Injeção de Botões

Este guia explica como adicionar novos sites/páginas onde o botão de microfone deve aparecer.

## 📋 Sistema Modular

O SpeakIn usa um sistema modular de "targets" (alvos) que permite adicionar facilmente novos campos de input onde o botão de microfone deve ser injetado.

## 🎯 Como Adicionar um Novo Target

### 1. Abra o arquivo de configuração

Arquivo: `src/config/injection-targets.ts`

### 2. Adicione uma nova entrada no array `injectionTargets`

```typescript
{
  name: 'Nome do Site - Descrição',
  urlPattern: /url-do-site\.com/,  // ou string
  containerSelector: 'seletor-css-do-container',
  inputSelectors: ['seletor1', 'seletor2'],
  controlsSelectors: ['seletor1', 'seletor2'],
  insertBeforeSelector: 'seletor-opcional',  // opcional
  minButtonsRequired: 2,  // opcional
  injectOnce: false,  // opcional
}
```

### 3. Configuração dos Campos

#### `name` (obrigatório)
- Nome descritivo para logs e debug
- Exemplo: `'ChatGPT - Chat Input'`

#### `urlPattern` (opcional)
- RegEx ou string para filtrar URLs
- Se não informado, aplica em todos os sites
- Exemplos:
  - `/claude\.ai/` - RegEx
  - `'chat.openai.com'` - String

#### `containerSelector` (obrigatório)
- Seletor CSS do container principal
- O container deve conter tanto o input quanto a área de controles
- Exemplo: `'div.chat-container'`

#### `inputSelectors` (obrigatório)
- Array de seletores CSS para encontrar o input
- Tenta cada um na ordem até encontrar
- Exemplos:
  - `['[data-testid="chat-input"]'`
  - `'textarea'`
  - `'[contenteditable="true"]'`

#### `controlsSelectors` (obrigatório)
- Array de seletores CSS para área de controles
- Local onde o botão será injetado
- Exemplo: `['.flex.gap-2', '.controls']`

#### `insertBeforeSelector` (opcional)
- Seletor do elemento antes do qual inserir o botão
- Se não informado, adiciona no final
- Exemplo: `'.submit-button'`

#### `minButtonsRequired` (opcional)
- Número mínimo de botões antes de injetar
- Útil para aguardar carregamento completo
- Padrão: `0`

#### `injectOnce` (opcional)
- Se `true`, injeta apenas uma vez
- Se `false`, observa mudanças no DOM
- Padrão: `false`

## 📝 Exemplos Práticos

### Exemplo 1: ChatGPT

```typescript
{
  name: 'ChatGPT - Chat Input',
  urlPattern: /chat\.openai\.com/,
  containerSelector: 'form[class*="stretch"]',
  inputSelectors: [
    'textarea[data-id]',
    'textarea#prompt-textarea',
    'textarea'
  ],
  controlsSelectors: [
    '.absolute.bottom-0',
    'div:has(button[data-testid="send-button"])'
  ],
  insertBeforeSelector: 'button[data-testid="send-button"]',
  minButtonsRequired: 1,
}
```

### Exemplo 2: Gemini

```typescript
{
  name: 'Gemini - Chat Input',
  urlPattern: /gemini\.google\.com/,
  containerSelector: 'div.input-area-container',
  inputSelectors: [
    'textarea.ql-editor',
    '[contenteditable="true"]'
  ],
  controlsSelectors: [
    '.action-buttons',
    'div:has(button.send-button)'
  ],
  minButtonsRequired: 0,
}
```

### Exemplo 3: Target Genérico (qualquer textarea)

```typescript
{
  name: 'Generic - Any Textarea',
  // Sem urlPattern - aplica em todos os sites
  containerSelector: 'form:has(textarea)',
  inputSelectors: ['textarea'],
  controlsSelectors: [
    'div:has(button[type="submit"])',
    '.form-controls'
  ],
  minButtonsRequired: 0,
}
```

## 🔍 Como Descobrir os Seletores

### 1. Inspecione o elemento no navegador
- Clique com botão direito no input → "Inspecionar"
- Procure por atributos únicos:
  - `data-testid`
  - `id`
  - `class`
  - Hierarquia de elementos

### 2. Use o console do navegador
```javascript
// Testar seletores
document.querySelector('seu-seletor-aqui')

// Ver estrutura
document.querySelectorAll('div.flex')
```

### 3. Procure padrões comuns
- `textarea` - campo de texto
- `[contenteditable="true"]` - editor rich text
- `button[type="submit"]` - botão de envio
- `.flex`, `.controls`, `.actions` - áreas de controle

## ✅ Checklist de Teste

Após adicionar um novo target:

1. ✅ Verifique se a URL pattern está correta
2. ✅ Teste se o containerSelector encontra o elemento
3. ✅ Verifique se inputSelectors encontra o campo de texto
4. ✅ Confirme se controlsSelectors encontra a área de controles
5. ✅ Teste a injeção em diferentes estados da página
6. ✅ Verifique os logs no console do navegador
7. ✅ Teste a transcrição de áudio

## 🐛 Debug

Para ver logs detalhados:

1. Abra o console do navegador (F12)
2. Filtre por `{SPEAKIN}`
3. Você verá:
   - Targets aplicáveis
   - Containers encontrados
   - Inputs/controles detectados
   - Status da injeção

## 🚀 Dicas Avançadas

### Múltiplos Targets no Mesmo Site

Você pode ter múltiplos targets para o mesmo site:

```typescript
// Input principal do chat
{
  name: 'Site - Main Chat',
  urlPattern: /site\.com/,
  containerSelector: '#main-chat',
  // ...
},
// Sidebar ou chat secundário
{
  name: 'Site - Sidebar Chat',
  urlPattern: /site\.com/,
  containerSelector: '#sidebar-chat',
  // ...
}
```

### Targets Condicionais

Use diferentes patterns para diferentes páginas:

```typescript
{
  name: 'Site - Chat Page',
  urlPattern: /site\.com\/chat/,
  // ...
},
{
  name: 'Site - Support Page',
  urlPattern: /site\.com\/support/,
  // ...
}
```

### Prioridade de Seletores

Os seletores são testados na ordem do array. Coloque os mais específicos primeiro:

```typescript
inputSelectors: [
  '[data-testid="specific-input"]',  // Mais específico
  'textarea.chat-input',              // Específico
  'textarea',                         // Genérico
]
```

## 📚 Referências

- [CSS Selectors Reference](https://www.w3schools.com/cssref/css_selectors.php)
- [querySelector MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
- [RegEx Tutorial](https://regexr.com/)

## 💡 Contribuindo

Se você adicionar suporte para um novo site popular, considere:
1. Testar em diferentes cenários
2. Documentar seletores específicos
3. Compartilhar a configuração com a comunidade
