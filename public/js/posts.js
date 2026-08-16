document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('create-post-form');
  if (!form) return;

  const currentUser = await requireAuth();
  if (!currentUser) return;

  setupNav(currentUser);
  setupLogoutButton(document.getElementById('logout-btn'));

  const contentInput = document.getElementById('post-content');
  const counter = document.getElementById('char-counter');
  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('submit-post-btn');
  const cancelBtn = document.getElementById('cancel-post-btn');

  const maxLength = 2000;

  contentInput.addEventListener('input', () => {
    counter.textContent = `${contentInput.value.length} / ${maxLength}`;
  });

  cancelBtn.addEventListener('click', () => {
    window.location.href = '/index.html';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertBox);

    const content = contentInput.value.trim();
    const image = document.getElementById('post-image').value.trim();

    if (!content && !image) {
      showAlert(alertBox, 'Please add text content or an image URL.');
      return;
    }

    setLoading(submitBtn, true, 'Creating...');

    try {
      await apiPost('/posts', { content, image });
      window.location.href = '/index.html';
    } catch (error) {
      showAlert(alertBox, error.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  redirectIfAuthenticated();

  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('login-btn');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertBox);

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    setLoading(submitBtn, true, 'Signing in...');

    try {
      await apiPost('/auth/login', { email, password });
      window.location.href = '/index.html';
    } catch (error) {
      showAlert(alertBox, error.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  redirectIfAuthenticated();

  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('register-btn');

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertBox);

    const name = document.getElementById('name').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
      showAlert(alertBox, 'Passwords do not match.');
      return;
    }

    setLoading(submitBtn, true, 'Creating account...');

    try {
      await apiPost('/auth/register', { name, username, email, password });
      window.location.href = '/index.html';
    } catch (error) {
      showAlert(alertBox, error.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
});
