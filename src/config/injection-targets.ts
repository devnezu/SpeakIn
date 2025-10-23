/**
 * Configuração de targets para injeção do botão de microfone
 *
 * Este arquivo define onde o botão de microfone deve ser injetado.
 * Para adicionar um novo target, basta adicionar uma nova entrada no array.
 */

export interface InjectionTarget {
  /** Nome descritivo do target (para logs) */
  name: string;

  /** URL pattern - regex ou string. Se undefined, aplica em todos os sites */
  urlPattern?: RegExp | string;

  /** Seletor CSS para o container principal onde buscar o input */
  containerSelector: string;

  /** Seletores para encontrar o elemento de input (textarea ou contenteditable) */
  inputSelectors: string[];

  /** Seletores para encontrar a área de controles onde injetar o botão */
  controlsSelectors: string[];

  /** Seletor do elemento antes do qual inserir o botão (opcional) */
  insertBeforeSelector?: string;

  /** Número mínimo de botões que devem existir antes de injetar */
  minButtonsRequired?: number;

  /** Se true, injeta apenas uma vez (não observa mutações) */
  injectOnce?: boolean;
}

/**
 * Lista de targets configurados
 *
 * Como adicionar um novo target:
 * 1. Copie um exemplo abaixo
 * 2. Ajuste os seletores CSS para o seu site/página
 * 3. Teste e ajuste conforme necessário
 */
export const injectionTargets: InjectionTarget[] = [
  // Claude.ai - Input principal do chat
  {
    name: 'Claude.ai - Chat Input',
    urlPattern: /claude\.ai/,
    containerSelector: 'div[class*="flex-col"][class*="bg-bg-000"]:has([data-testid="chat-input"])',
    inputSelectors: [
      '[data-testid="chat-input"]',
      'textarea',
      '[contenteditable="true"]',
    ],
    controlsSelectors: [
      '.flex.gap-2',
      '.flex.items-center',
      'div.flex:has(button[type="submit"])',
    ],
    insertBeforeSelector: '.flex.shrink.min-w-8',
    minButtonsRequired: 2,
    injectOnce: false,
  },

  // Exemplo: ChatGPT (descomente e ajuste os seletores)
  // {
  //   name: 'ChatGPT - Chat Input',
  //   urlPattern: /chat\.openai\.com/,
  //   containerSelector: 'form',
  //   inputSelectors: ['textarea[data-id]', 'textarea'],
  //   controlsSelectors: ['.flex.items-center', '.absolute.bottom-0'],
  //   minButtonsRequired: 1,
  // },

  // Exemplo: Gemini (descomente e ajuste os seletores)
  // {
  //   name: 'Gemini - Chat Input',
  //   urlPattern: /gemini\.google\.com/,
  //   containerSelector: 'div.input-area',
  //   inputSelectors: ['textarea', '[contenteditable="true"]'],
  //   controlsSelectors: ['.controls'],
  //   minButtonsRequired: 1,
  // },

  // Exemplo: Target genérico para qualquer textarea
  // {
  //   name: 'Generic - Textarea',
  //   containerSelector: 'form:has(textarea)',
  //   inputSelectors: ['textarea'],
  //   controlsSelectors: ['div:has(button[type="submit"])'],
  //   minButtonsRequired: 0,
  // },
];

/**
 * Verifica se a URL atual corresponde ao pattern do target
 */
export function matchesUrlPattern(
  pattern: RegExp | string | undefined,
  url: string = window.location.href
): boolean {
  if (!pattern) return true; // Se não tem pattern, aplica em todos

  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }

  return url.includes(pattern);
}

/**
 * Retorna os targets aplicáveis para a URL atual
 */
export function getApplicableTargets(url: string = window.location.href): InjectionTarget[] {
  return injectionTargets.filter((target) => matchesUrlPattern(target.urlPattern, url));
}
