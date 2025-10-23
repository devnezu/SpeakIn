import { createRoot } from 'react-dom/client';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { getApplicableTargets, InjectionTarget } from '../config/injection-targets';
import '../index.css';

const INJECTION_MARKER = 'speakin-injected';

console.log('{SPEAKIN} Content script loaded');
console.log('{SPEAKIN} Document state:', document.readyState);
console.log('{SPEAKIN} Current URL:', window.location.href);

/**
 * Insere texto no elemento de input (textarea ou contenteditable)
 */
function insertTextIntoInput(element: HTMLElement, text: string) {
  console.log('{SPEAKIN} Inserting text into input:', text);
  console.log('{SPEAKIN} Target element:', element);

  if (element instanceof HTMLTextAreaElement) {
    const currentValue = element.value;
    const newValue = currentValue ? `${currentValue} ${text}` : text;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, newValue);
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.focus();
  } else if (element.hasAttribute('contenteditable')) {
    const paragraph = element.querySelector('p');
    if (paragraph) {
      const currentText = paragraph.textContent || '';
      const newText = currentText ? `${currentText} ${text}` : text;
      paragraph.textContent = newText;

      paragraph.classList.remove('is-empty', 'is-editor-empty');

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(paragraph);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);

      element.focus();
    }
  }
}

/**
 * Encontra o elemento de input usando os seletores do target
 */
function findInputElement(
  container: HTMLElement,
  selectors: string[]
): HTMLElement | null {
  for (const selector of selectors) {
    const element = container.querySelector(selector);
    if (element instanceof HTMLElement) {
      console.log(`{SPEAKIN} Found input with selector "${selector}":`, element);
      return element;
    }
  }

  console.log('{SPEAKIN} No input element found in container:', container);
  return null;
}

/**
 * Encontra a área de controles usando os seletores do target
 */
function findControlsArea(
  container: HTMLElement,
  selectors: string[]
): Element | null {
  for (const selector of selectors) {
    const area = container.querySelector(selector);
    if (area) {
      console.log(`{SPEAKIN} Found controls area with selector "${selector}":`, area);
      return area;
    }
  }

  // Fallback: tentar encontrar via botão submit
  const submitButton = container.querySelector('button[type="submit"]');
  if (submitButton && submitButton.parentElement) {
    console.log('{SPEAKIN} Found controls area via submit button parent:', submitButton.parentElement);
    return submitButton.parentElement;
  }

  console.log('{SPEAKIN} No controls area found');
  return null;
}

/**
 * Injeta o botão de microfone no container
 */
function injectMicrophoneButton(
  container: HTMLElement,
  target: InjectionTarget
) {
  console.log(`{SPEAKIN} Attempting to inject button for target: ${target.name}`);
  console.log('{SPEAKIN} Container:', container);

  if (container.hasAttribute(INJECTION_MARKER)) {
    console.log('{SPEAKIN} Container already has injection marker, skipping');
    return;
  }

  // Verificar se algum ancestor já foi processado
  let parent = container.parentElement;
  while (parent) {
    if (parent.hasAttribute(INJECTION_MARKER)) {
      console.log('{SPEAKIN} Parent element already has injection marker, skipping');
      return;
    }
    parent = parent.parentElement;
  }

  const inputElement = findInputElement(container, target.inputSelectors);
  if (!inputElement) {
    console.log('{SPEAKIN} No input element found, skipping injection');
    return;
  }

  const controlsArea = findControlsArea(container, target.controlsSelectors);
  if (!controlsArea) {
    console.log('{SPEAKIN} No controls area found, skipping injection');
    return;
  }

  // Verificar se já existe um botão de microfone nesta área de controles
  if (controlsArea.querySelector(`div[${INJECTION_MARKER}="true"]`)) {
    console.log('{SPEAKIN} Controls area already has microphone button, skipping');
    container.setAttribute(INJECTION_MARKER, 'true');
    return;
  }

  // Verificar número mínimo de botões (se especificado)
  if (target.minButtonsRequired !== undefined && target.minButtonsRequired > 0) {
    const existingButtons = controlsArea.querySelectorAll('.flex.shrink-0, .flex.shrink');
    if (existingButtons.length < target.minButtonsRequired) {
      console.log(
        `{SPEAKIN} Not enough buttons loaded yet (${existingButtons.length}/${target.minButtonsRequired}), waiting...`
      );
      return;
    }
  }

  console.log('{SPEAKIN} Found controls area:', controlsArea);

  // Criar container para o botão
  const micContainer = document.createElement('div');
  micContainer.className = 'flex shrink min-w-8 !shrink-0';
  micContainer.setAttribute(INJECTION_MARKER, 'true');
  micContainer.setAttribute('data-state', 'closed');
  micContainer.style.opacity = '1';
  micContainer.style.transform = 'none';

  // Determinar onde inserir o botão
  let insertBefore: Element | null = null;
  if (target.insertBeforeSelector) {
    insertBefore = controlsArea.querySelector(target.insertBeforeSelector);
  }

  if (insertBefore) {
    controlsArea.insertBefore(micContainer, insertBefore);
    console.log('{SPEAKIN} Inserted button before:', insertBefore);
  } else {
    controlsArea.appendChild(micContainer);
    console.log('{SPEAKIN} Appended button to controls area');
  }

  // Renderizar o botão React
  console.log('{SPEAKIN} Creating React root and rendering MicrophoneButton');
  const root = createRoot(micContainer);
  root.render(
    <MicrophoneButton
      onTranscription={(text) => insertTextIntoInput(inputElement, text)}
    />
  );

  container.setAttribute(INJECTION_MARKER, 'true');
  console.log(`{SPEAKIN} Button injection complete for target: ${target.name}`);
}

/**
 * Processa um target específico
 */
function processTarget(target: InjectionTarget) {
  console.log(`{SPEAKIN} Processing target: ${target.name}`);
  console.log('{SPEAKIN} Container selector:', target.containerSelector);

  const containers = document.querySelectorAll(target.containerSelector);
  console.log(`{SPEAKIN} Found ${containers.length} containers for "${target.name}"`);

  containers.forEach((container, index) => {
    console.log(`{SPEAKIN} Processing container ${index + 1}/${containers.length}`);
    if (container instanceof HTMLElement && !container.hasAttribute(INJECTION_MARKER)) {
      injectMicrophoneButton(container, target);
    } else if (container.hasAttribute(INJECTION_MARKER)) {
      console.log(`{SPEAKIN} Container ${index + 1} already processed`);
    }
  });
}

/**
 * Escaneia e injeta botões em todos os targets aplicáveis
 */
function scanAndInject() {
  console.log('{SPEAKIN} Scanning for injection points...');

  const applicableTargets = getApplicableTargets();
  console.log(`{SPEAKIN} Found ${applicableTargets.length} applicable targets for current URL`);

  if (applicableTargets.length === 0) {
    console.log('{SPEAKIN} No applicable targets for this page');
    return;
  }

  applicableTargets.forEach((target) => {
    processTarget(target);
  });

  console.log('{SPEAKIN} Scan complete');
}

/**
 * Inicia a observação e injeção
 */
function observeAndInject() {
  console.log('{SPEAKIN} Starting observation and injection');

  const applicableTargets = getApplicableTargets();
  if (applicableTargets.length === 0) {
    console.log('{SPEAKIN} No applicable targets for this URL, exiting');
    return;
  }

  console.log(`{SPEAKIN} Applicable targets:`, applicableTargets.map((t) => t.name));

  // Primeira varredura
  scanAndInject();

  // Configurar observer para detectar mudanças no DOM
  console.log('{SPEAKIN} Setting up MutationObserver');
  const observer = new MutationObserver(() => {
    console.log('{SPEAKIN} DOM mutation detected, rescanning...');
    scanAndInject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  console.log('{SPEAKIN} MutationObserver active');
}

// Inicializar quando o DOM estiver pronto
console.log('{SPEAKIN} Checking document ready state...');
if (document.readyState === 'loading') {
  console.log('{SPEAKIN} Document still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('{SPEAKIN} DOMContentLoaded fired');
    observeAndInject();
  });
} else {
  console.log('{SPEAKIN} Document already loaded, starting immediately');
  observeAndInject();
}
