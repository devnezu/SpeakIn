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

  // Criar container para o botão
  const micContainer = document.createElement('span');
  micContainer.setAttribute(INJECTION_MARKER, 'true');
  micContainer.style.display = 'inline-flex';

  // Tentar encontrar o botão submit para inserir antes dele
  const submitButton = controlsArea.querySelector('button[type="submit"]');

  if (submitButton) {
    // Inserir antes do submit button
    submitButton.parentElement!.insertBefore(micContainer, submitButton);
    console.log('{SPEAKIN} Inserted button before submit button');
  } else {
    // Fallback: inserir no final da área de controles
    controlsArea.appendChild(micContainer);
    console.log('{SPEAKIN} Appended button to controls area (no submit found)');
  }

  // Renderizar o botão React
  console.log('{SPEAKIN} Creating React root and rendering MicrophoneButton');
  const root = createRoot(micContainer);
  root.render(
    <MicrophoneButton
      onTranscription={(text) => insertTextIntoInput(inputElement, text)}
      className="self-end rounded-lg p-1.5 transition-colors hover:bg-bg-100 text-text-300 hover:text-text-200"
    />
  );

  container.setAttribute(INJECTION_MARKER, 'true');
  console.log('{SPEAKIN} Button injection complete');
}

function observeAndInject() {
  console.log('{SPEAKIN} Starting observation and injection');

  const targetSelectors = [
    'form.w-full',
    'div[class*="flex"][class*="flex-col"][class*="bg-bg-000"]',
    'div[class*="relative"][class*="bg-bg-000"][class*="rounded-lg"]',
    'div[class*="relative"][class*="bg-bg-000"][class*="border"]',
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
