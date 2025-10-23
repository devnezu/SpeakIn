import { createRoot } from 'react-dom/client';
import { MicrophoneButton } from '../components/MicrophoneButton';
import '../index.css';

const INJECTION_MARKER = 'speakin-injected';

console.log('{SPEAKIN} Content script loaded');
console.log('{SPEAKIN} Document state:', document.readyState);

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

function findInputElement(container: HTMLElement): HTMLElement | null {
  const textarea = container.querySelector('textarea');
  if (textarea) {
    console.log('{SPEAKIN} Found textarea:', textarea);
    return textarea;
  }

  const contentEditable = container.querySelector('[contenteditable="true"]');
  if (contentEditable instanceof HTMLElement) {
    console.log('{SPEAKIN} Found contenteditable:', contentEditable);
    return contentEditable;
  }

  console.log('{SPEAKIN} No input element found in container:', container);
  return null;
}

function findControlsArea(container: HTMLElement): Element | null {
  // Tentar vários seletores para encontrar a área de controles
  const selectors = [
    '.flex.gap-2',
    '.flex.items-center',
    'div.flex:has(button[type="submit"])',
  ];

  for (const selector of selectors) {
    const area = container.querySelector(selector);
    if (area) {
      console.log(`{SPEAKIN} Found controls area with selector: "${selector}"`, area);
      return area;
    }
  }

  // Se não encontrou, tentar encontrar qualquer div que contenha um botão de submit
  const submitButton = container.querySelector('button[type="submit"]');
  if (submitButton && submitButton.parentElement) {
    console.log('{SPEAKIN} Found controls area via submit button parent:', submitButton.parentElement);
    return submitButton.parentElement;
  }

  console.log('{SPEAKIN} No controls area found');
  return null;
}

function injectMicrophoneButton(container: HTMLElement) {
  console.log('{SPEAKIN} Attempting to inject button into container:', container);

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

  const inputElement = findInputElement(container);
  if (!inputElement) {
    console.log('{SPEAKIN} No input element found, skipping injection');
    return;
  }

  const controlsArea = findControlsArea(container);
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

  console.log('{SPEAKIN} Found controls area:', controlsArea);

  // Aguardar outros botões carregarem antes de injetar
  const existingButtons = controlsArea.querySelectorAll('.flex.shrink-0, .flex.shrink');
  if (existingButtons.length < 2) {
    console.log('{SPEAKIN} Not enough buttons loaded yet, waiting...');
    return;
  }

  // Criar container para o botão (exatamente como os botões nativos)
  const micContainer = document.createElement('div');
  micContainer.className = 'flex shrink min-w-8 !shrink-0';
  micContainer.setAttribute(INJECTION_MARKER, 'true');
  micContainer.setAttribute('data-state', 'closed');
  micContainer.style.opacity = '1';
  micContainer.style.transform = 'none';

  // Tentar encontrar o botão do Artifacts (relógio) para inserir antes dele
  const artifactsButton = controlsArea.querySelector('.flex.shrink.min-w-8');

  if (artifactsButton) {
    // Inserir antes do botão do Artifacts
    controlsArea.insertBefore(micContainer, artifactsButton);
    console.log('{SPEAKIN} Inserted button before Artifacts button');
  } else {
    // Fallback: inserir no final da área de controles
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
  console.log('{SPEAKIN} Button injection complete');
}

function observeAndInject() {
  console.log('{SPEAKIN} Starting observation and injection');

  // Apenas injetar no input principal do chat que contém data-testid="chat-input"
  const targetSelectors = [
    'div[class*="flex-col"][class*="bg-bg-000"]:has([data-testid="chat-input"])'
  ];

  console.log('{SPEAKIN} Target selectors:', targetSelectors);

  function scanAndInject() {
    console.log('{SPEAKIN} Scanning for injection points...');
    targetSelectors.forEach((selector) => {
      const containers = document.querySelectorAll(selector);
      console.log(`{SPEAKIN} Found ${containers.length} containers for selector: "${selector}"`);

      containers.forEach((container, index) => {
        console.log(`{SPEAKIN} Processing container ${index + 1}/${containers.length}`);
        if (container instanceof HTMLElement && !container.hasAttribute(INJECTION_MARKER)) {
          injectMicrophoneButton(container);
        } else if (container.hasAttribute(INJECTION_MARKER)) {
          console.log(`{SPEAKIN} Container ${index + 1} already processed`);
        }
      });
    });
    console.log('{SPEAKIN} Scan complete');
  }

  scanAndInject();

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
