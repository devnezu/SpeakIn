import { createRoot } from 'react-dom/client';
import { MicrophoneButton } from '../components/MicrophoneButton';
import '../index.css';

const INJECTION_ATTR = 'data-speakin-injected';

console.log('{SPEAKIN} Content script loaded');

function isUsable(el: HTMLElement): boolean {
  // Ignora árvore SSR "inert" (o Claude usa um textarea SSR que não é interativo)
  if (el.closest('[inert]')) return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  // Evita pegar elementos que não recebem interação
  if (style.pointerEvents === 'none') return false;

  const rect = el.getBoundingClientRect();
  // Elementos "reais" do input sempre têm área (ou são focáveis).
  if (rect.width === 0 && rect.height === 0) return false;

  return true;
}

function findInputElement(scope: ParentNode = document): HTMLElement | null {
  // ✅ NOVO Claude: editor real (TipTap/ProseMirror)
  const pm = scope.querySelector<HTMLElement>(
    'div[data-testid="chat-input"][contenteditable="true"]'
  );
  if (pm && isUsable(pm)) return pm;

  // ⚠️ textarea SSR (geralmente fica em fieldset[inert], então isUsable vai barrar)
  const ssr = scope.querySelector<HTMLTextAreaElement>(
    'textarea[data-testid="chat-input-ssr"]'
  );
  if (ssr && isUsable(ssr)) return ssr;

  // Fallback genérico: algum textbox contenteditable
  const anyCE = scope.querySelector<HTMLElement>(
    '[contenteditable="true"][role="textbox"]'
  );
  if (anyCE && isUsable(anyCE)) return anyCE;

  // Fallback final: textarea normal
  const textarea = scope.querySelector<HTMLTextAreaElement>('textarea');
  if (textarea && isUsable(textarea)) return textarea;

  return null;
}

function ensureCaretInside(el: HTMLElement) {
  el.focus();

  const sel = window.getSelection();
  const selectionInside =
    !!sel && sel.rangeCount > 0 && el.contains(sel.anchorNode);

  if (!selectionInside) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false); // fim
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}

function computePrefixSpace(el: HTMLElement): string {
  const current = (el.textContent ?? '').replace(/\u200B/g, '');
  const hasText = current.trim().length > 0;
  const endsWithSpace = /\s$/.test(current);
  return hasText && !endsWithSpace ? ' ' : '';
}

// Inserção resiliente (ProseMirror/TipTap + textarea)
function insertTextIntoInput(element: HTMLElement, text: string) {
  console.log('{SPEAKIN} Inserting text into input:', text);

  // ✅ Textarea
  if (element instanceof HTMLTextAreaElement) {
    const prefix = element.value && !/\s$/.test(element.value) ? ' ' : '';
    const newValue = element.value ? `${element.value}${prefix}${text}` : text;

    // Hack para React-controlled inputs
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeSetter) nativeSetter.call(element, newValue);
    else element.value = newValue;

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.focus();
    return;
  }

  // ✅ ContentEditable (Claude novo: ProseMirror)
  if (element.isContentEditable) {
    const prefix = computePrefixSpace(element);
    const toInsert = `${prefix}${text}`;

    ensureCaretInside(element);

    // ✅ Melhor compatibilidade com editores ricos
    const ok =
      typeof document.execCommand === 'function' &&
      document.execCommand('insertText', false, toInsert);

    if (ok) return;

    // Fallback moderno: beforeinput (muitos editores escutam isso)
    const ev = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: toInsert,
      bubbles: true,
      cancelable: true,
    });

    element.dispatchEvent(ev);

    // Se o editor não lidou com beforeinput, faz um último fallback (bem simples)
    if (!ev.defaultPrevented) {
      const p =
        element.querySelector<HTMLParagraphElement>('p:last-child') ??
        element.querySelector<HTMLParagraphElement>('p');

      if (p) {
        p.textContent = (p.textContent ?? '') + toInsert;
      } else {
        element.textContent = (element.textContent ?? '') + toInsert;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return;
  }
}

function findToolbar(container: HTMLElement): HTMLElement | null {
  // No HTML novo, a barra é: <div class="flex gap-2 w-full items-center"> ... </div>
  const toolbars = Array.from(
    container.querySelectorAll<HTMLElement>('div.flex.gap-2.w-full.items-center')
  );

  if (toolbars.length === 0) return null;

  // Preferir a toolbar que contém o botão de enviar
  const preferred =
    toolbars.find((tb) =>
      tb.querySelector(
        'button[aria-label="Enviar mensagem"], button[aria-label="Send message"], button[aria-label="Send Message"]'
      )
    ) ?? toolbars[toolbars.length - 1];

  return preferred ?? null;
}

function injectMicrophoneButton(container: HTMLElement) {
  // Só injeta se existir algum input real dentro do container
  const input = findInputElement(container);
  if (!input) return;

  const targetToolbar = findToolbar(container);

  // Caso novo layout exista
  if (targetToolbar) {
    // ✅ Evita duplicação olhando dentro do toolbar (não no container inteiro)
    if (targetToolbar.querySelector(`[${INJECTION_ATTR}]`)) return;

    const micContainer = document.createElement('div');
    micContainer.setAttribute(INJECTION_ATTR, 'true');
    micContainer.className = 'flex items-center justify-center shrink-0';

    const sendButton = targetToolbar.querySelector<HTMLButtonElement>(
      'button[aria-label="Enviar mensagem"], button[aria-label="Send message"], button[aria-label="Send Message"]'
    );

    // Tenta achar um wrapper “bonito” do botão de enviar (o Claude envolve com divs)
    const insertionPoint =
      sendButton?.closest<HTMLElement>('div[style*="transform"]') ??
      sendButton?.parentElement ??
      null;

    if (insertionPoint && insertionPoint.parentElement === targetToolbar) {
      targetToolbar.insertBefore(micContainer, insertionPoint);
    } else {
      targetToolbar.appendChild(micContainer);
    }

    const root = createRoot(micContainer);

    root.render(
      <MicrophoneButton
        onTranscription={(text) => {
          // ✅ IMPORTANTÍSSIMO: buscar o input na hora (evita referência stale)
          const liveInput =
            findInputElement(container) ?? findInputElement(document);

          if (!liveInput) {
            console.warn(
              '{SPEAKIN} Could not find Claude input to insert transcription'
            );
            return;
          }

          insertTextIntoInput(liveInput, text);
        }}
        className="h-8 w-8 rounded-lg text-text-500 hover:text-text-900 hover:bg-bg-200 transition-colors flex items-center justify-center"
      />
    );

    console.log('{SPEAKIN} Injection successful (new toolbar)');
    return;
  }

  // --- Fallback antigo (layouts legados) ---
  const submitButton = container.querySelector<HTMLButtonElement>(
    'button[type="submit"]'
  );

  if (submitButton && submitButton.parentElement) {
    // Evita duplicação no fallback
    if (submitButton.parentElement.querySelector(`[${INJECTION_ATTR}]`)) return;

    const micContainer = document.createElement('div');
    micContainer.setAttribute(INJECTION_ATTR, 'true');
    micContainer.style.display = 'flex';
    micContainer.style.alignItems = 'center';

    submitButton.parentElement.insertBefore(micContainer, submitButton);

    const root = createRoot(micContainer);
    root.render(
      <MicrophoneButton
        onTranscription={(text) => {
          const liveInput =
            findInputElement(container) ?? findInputElement(document);
          if (!liveInput) return;
          insertTextIntoInput(liveInput, text);
        }}
        className="mr-2 h-8 w-8 rounded-lg hover:bg-bg-200 text-text-500"
      />
    );

    console.log('{SPEAKIN} Injection successful (legacy fallback)');
  }
}

function observeAndInject() {
  console.log('{SPEAKIN} Starting observation service');

  const scanAndInject = () => {
    // ✅ Novo Claude: procurar diretamente o editor real
    const editors = document.querySelectorAll<HTMLElement>(
      'div[data-testid="chat-input"][contenteditable="true"]'
    );

    if (editors.length > 0) {
      editors.forEach((editor) => {
        // container mais estável no layout novo
        const container =
          editor.closest<HTMLElement>('div[data-testid="chat-input-grid-container"]') ??
          editor.closest<HTMLElement>('fieldset') ??
          editor.parentElement;

        if (container) injectMicrophoneButton(container);
      });
      return;
    }

    // Fallback: procurar containers clássicos que tenham textarea ou contenteditable
    const candidates = document.querySelectorAll<HTMLElement>('fieldset, form');
    candidates.forEach((c) => {
      if (findInputElement(c)) injectMicrophoneButton(c);
    });
  };

  // Scan inicial
  scanAndInject();

  // Debounce leve para não escanear a cada mutação
  let scheduled = false;

  const observer = new MutationObserver((mutations) => {
    if (scheduled) return;

    // Só reagir a adições relevantes
    const shouldScan = mutations.some((m) => m.addedNodes.length > 0);
    if (!shouldScan) return;

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      scanAndInject();
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Inicialização segura
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeAndInject);
} else {
  observeAndInject();
}
