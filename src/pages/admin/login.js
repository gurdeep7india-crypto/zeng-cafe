import { $, esc } from '../../core/dom.js';
import { needsSetup, signIn, setPasscode, authMode } from '../../services/authService.js';
import { toastErr, toastOk } from '../../components/toast.js';
import { go, BASE } from '../../core/router.js';

export async function adminLoginPage(outlet) {
  document.body.classList.add('admin-body');
  const setup = await needsSetup();
  const mode = authMode();

  outlet.innerHTML = `
<div class="adm-login">
  <div class="adm-login__box">
    <img src="${BASE}/assets/img/logo.png" alt="Zen G Caf&eacute;" width="66" height="66">
    <h2 style="text-align:center;font-size:1.4rem;margin-bottom:6px">${setup ? 'Set up admin access' : 'Staff sign in'}</h2>
    <p class="faint" style="text-align:center;font-size:.8rem;margin-bottom:var(--s-5)">
      ${mode === 'firebase' ? 'Firebase authentication' : 'Local demo admin'}
    </p>

    <form data-form novalidate>
      ${mode === 'firebase' ? `
        <label class="field"><span class="label">Email</span>
          <input name="identity" type="email" autocomplete="username" required></label>
        <label class="field"><span class="label">Password</span>
          <input name="secret" type="password" autocomplete="current-password" required></label>`
      : `
        <label class="field">
          <span class="label">${setup ? 'Choose a passcode' : 'Passcode'}</span>
          <input name="secret" type="password" autocomplete="${setup ? 'new-password' : 'current-password'}"
                 required minlength="6" placeholder="At least 6 characters">
        </label>
        ${setup ? `
        <label class="field"><span class="label">Type it again</span>
          <input name="confirm" type="password" autocomplete="new-password" required></label>` : ''}`}
      <button class="btn btn--gold btn--block" type="submit">${setup ? 'Set passcode and continue' : 'Sign in'}</button>
      <span class="field-error" data-err style="text-align:center"></span>
    </form>

    ${mode === 'local' ? `
    <div class="notice notice--warn" style="margin-top:var(--s-5);font-size:.78rem">
      <strong>Local demo admin.</strong> This passcode is checked in the browser, and the menu it protects
      lives in this browser too. It keeps customers out of the admin screens &mdash; it is not production
      security, and it does not sync to other devices. Connect Firebase for real authentication and a
      shared database. See README.md.
    </div>` : ''}

    <p style="text-align:center;margin-top:var(--s-5)"><a class="btn btn--quiet" href="/">Back to the site</a></p>
  </div>
</div>`;

  const form = $('[data-form]', outlet);
  const err = $('[data-err]', outlet);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    err.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      if (setup) {
        if (data.secret !== data.confirm) throw new Error('The two passcodes do not match.');
        await setPasscode(data.secret);
        toastOk('Passcode set. Keep it somewhere safe.');
      } else {
        await signIn(data.identity, data.secret);
      }
      go('/admin/dashboard');
    } catch (error) {
      err.textContent = error.message || 'That did not work.';
      toastErr(error.message || 'Sign in failed.');
    }
  });
}
