import { footerHTML } from '../components/chrome.js';
import { getSettings } from '../services/settingsService.js';

export async function notFoundPage(outlet) {
  const settings = await getSettings();
  outlet.innerHTML = `
<div class="success">
  <div>
    <p class="script gold" style="font-size:2rem">Wrong turn</p>
    <h1>This page left the kitchen.</h1>
    <p class="muted">The link is broken or the page moved. Everything else is still on.</p>
    <div class="success__marks">
      <a class="btn btn--gold" href="/menu">Open the menu</a>
      <a class="btn btn--ghost" href="/">Back home</a>
    </div>
  </div>
</div>
${footerHTML(settings)}`;
}
