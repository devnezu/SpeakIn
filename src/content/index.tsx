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

function injectMicrophoneButton(container: HTMLElement) {
  console.log('{SPEAKIN} Attempting to inject button into container:', container);

  if (container.hasAttribute(INJECTION_MARKER)) {
    console.log('{SPEAKIN} Container already has injection marker, skipping');
    return;
  }

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

  if (container.querySelector(`[${INJECTION_MARKER}="true"]`)) {
    console.log('{SPEAKIN} Microphone button already exists, skipping');
    container.setAttribute(INJECTION_MARKER, 'true');
    return;
  }

  const plusButton = container.querySelector('button[id="input-plus-menu-trigger"]');
  
  if (plusButton) {
    console.log('{SPEAKIN} Found plus button, using main chat input logic');
    
    let plusContainer = plusButton.closest('.relative.shrink-0');
    if (!plusContainer) {
      console.log('{SPEAKIN} Plus button container not found, skipping injection');
      return;
    }

    console.log('{SPEAKIN} Found plus button container:', plusContainer);

    const micContainer = document.createElement('div');
    micContainer.setAttribute(INJECTION_MARKER, 'true');

    plusContainer.parentElement!.insertBefore(micContainer, plusContainer.nextSibling);
    console.log('{SPEAKIN} Inserted button container after plus button');

    console.log('{SPEAKIN} Creating React root and rendering MicrophoneButton');
    const root = createRoot(micContainer);
    root.render(
      <MicrophoneButton
        onTranscription={(text) => insertTextIntoInput(inputElement, text)}
        className="self-end rounded-lg p-1.5 transition-colors hover:bg-bg-100 text-text-300 hover:text-text-200"
      />
    );

    container.setAttribute(INJECTION_MARKER, 'true');
    console.log('{SPEAKIN} Button injection complete (main chat)');
    
  } else {
    console.log('{SPEAKIN} Plus button not found, checking for submit button (thread reply)');
    
    const submitButton = container.querySelector('button[type="submit"]');
    if (!submitButton) {
      console.log('{SPEAKIN} Submit button not found, skipping injection');
      return;
    }

    const flexContainer = submitButton.parentElement;
    if (!flexContainer) {
      console.log('{SPEAKIN} Submit button parent not found, skipping injection');
      return;
    }

    console.log('{SPEAKIN} Found submit button and flex container:', flexContainer);

    const micSpan = document.createElement('span');
    micSpan.setAttribute(INJECTION_MARKER, 'true');
    micSpan.style.display = 'contents';

    flexContainer.insertBefore(micSpan, submitButton);
    console.log('{SPEAKIN} Inserted button span before submit button');

    console.log('{SPEAKIN} Creating React root and rendering MicrophoneButton');
    const root = createRoot(micSpan);
    root.render(
      <MicrophoneButton
        onTranscription={(text) => insertTextIntoInput(inputElement, text)}
        className="self-end rounded-lg p-1.5 transition-colors hover:bg-bg-100 text-text-300 hover:text-text-200"
      />
    );

    container.setAttribute(INJECTION_MARKER, 'true');
    console.log('{SPEAKIN} Button injection complete (thread reply)');
  }
}

function observeAndInject() {
  console.log('{SPEAKIN} Starting observation and injection');

  const targetSelectors = [
    'div[class*="flex-col"][class*="bg-bg-000"]:has([data-testid="chat-input"])',
    'form:has(#turn-textarea)'
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