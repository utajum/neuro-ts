/**
 * search-jump.ts
 *
 * Reads the `?q=` URL parameter and hands the query off to Starlight's
 * Pagefind search UI. Backs the JSON-LD WebSite SearchAction defined in
 * Head.astro so Google's sitelinks searchbox (and OpenSearch consumers)
 * can deep-link into in-site search via https://neuro-ts.dev/?q=<query>.
 *
 * Why polling instead of MutationObserver:
 *
 *   Starlight removes `disabled` from the search button by setting the IDL
 *   property (`openBtn.disabled = false`) inside the SiteSearch custom
 *   element constructor. In practice this reflects to the content attribute,
 *   but the mutation record may already have fired before our observer is
 *   registered - so the observer never triggers.
 *
 *   After clicking, Pagefind UI mounts inside a `requestIdleCallback`, which
 *   may fire anywhere from tens to hundreds of milliseconds after click. A
 *   MutationObserver on the document body does catch child-list changes, but
 *   the `requestIdleCallback` timing makes the window unpredictable.
 *
 *   A 50 ms polling interval is imperceptibly cheap (two querySelector calls
 *   per tick) and catches both conditions reliably regardless of race timing.
 */

const POLL_MS = 50;
const DEADLINE_MS = 8000;

const q = new URLSearchParams(window.location.search).get('q');
if (q) init(q);

function init(query: string): void {
  const start = Date.now();
  let clicked = false;

  function findButton(): HTMLButtonElement | null {
    return (
      document.querySelector<HTMLButtonElement>('button[data-open-modal]:not([disabled])') ??
      document.querySelector<HTMLButtonElement>('[aria-label="Search"]:not([disabled])')
    );
  }

  function findInput(): HTMLInputElement | null {
    // Pagefind UI mounts inside #starlight__search; use the broadest selector
    // that matches regardless of the input's type attribute.
    return (
      document.querySelector<HTMLInputElement>('#starlight__search input') ??
      document.querySelector<HTMLInputElement>('dialog input[type="search"]') ??
      document.querySelector<HTMLInputElement>('.pagefind-ui__search-input')
    );
  }

  function fillInput(input: HTMLInputElement): void {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(input, query);
    } else {
      input.value = query;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }

  const interval = setInterval(() => {
    if (Date.now() - start > DEADLINE_MS) {
      clearInterval(interval);
      return;
    }

    if (!clicked) {
      const btn = findButton();
      if (btn) {
        btn.click();
        clicked = true;
      }
      return; // wait another tick for the dialog + Pagefind to mount
    }

    const input = findInput();
    if (input) {
      fillInput(input);
      clearInterval(interval);
    }
  }, POLL_MS);
}
