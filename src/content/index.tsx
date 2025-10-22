import { createRoot } from 'react-dom/client';
import { MicrophoneButton } from '../components/MicrophoneButton';
import '../index.css';

const INJECTION_MARKER = 'speakin-injected';

function insertTextIntoInput(element: HTMLElement, text: string) {
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
  if (textarea) return textarea;

  const contentEditable = container.querySelector('[contenteditable="true"]');
  if (contentEditable instanceof HTMLElement) return contentEditable;

  return null;
}

function injectMicrophoneButton(container: HTMLElement) {
  if (container.hasAttribute(INJECTION_MARKER)) {
    return;
  }

  const inputElement = findInputElement(container);
  if (!inputElement) {
    return;
  }

  const controlsArea = container.querySelector('.flex.gap-2');
  if (!controlsArea) {
    return;
  }

  const micContainer = document.createElement('div');
  micContainer.className = 'flex shrink-0';
  micContainer.setAttribute(INJECTION_MARKER, 'true');
  micContainer.setAttribute('data-state', 'closed');
  micContainer.style.opacity = '1';
  micContainer.style.transform = 'none';

  const insertionPoint = controlsArea.querySelector('.flex.shrink') || controlsArea.firstChild;

  if (insertionPoint) {
    controlsArea.insertBefore(micContainer, insertionPoint);
  } else {
    controlsArea.appendChild(micContainer);
  }

  const root = createRoot(micContainer);
  root.render(
    <MicrophoneButton
      onTranscription={(text) => insertTextIntoInput(inputElement, text)}
      className="border-0.5 text-text-300 border-border-300 active:scale-[0.98] hover:text-text-200/90 hover:bg-bg-100"
    />
  );

  container.setAttribute(INJECTION_MARKER, 'true');
}

function observeAndInject() {
  const targetSelectors = [
    'form.w-full',
    'div[class*="flex"][class*="flex-col"][class*="bg-bg-000"]',
  ];

  function scanAndInject() {
    targetSelectors.forEach((selector) => {
      const containers = document.querySelectorAll(selector);
      containers.forEach((container) => {
        if (container instanceof HTMLElement && !container.hasAttribute(INJECTION_MARKER)) {
          injectMicrophoneButton(container);
        }
      });
    });
  }

  scanAndInject();

  const observer = new MutationObserver(() => {
    scanAndInject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeAndInject);
} else {
  observeAndInject();
}
