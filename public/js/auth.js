async function getCurrentUser() {
  try {
    const data = await apiGet('/auth/me');
    return data.data.user;
  } catch (error) {
    return null;
  }
}

async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = '/login.html';
    return null;
  }

  return user;
}

async function redirectIfAuthenticated() {
  const user = await getCurrentUser();

  if (user) {
    window.location.href = '/index.html';
  }
}

async function logout() {
  try {
    await apiPost('/auth/logout');
  } catch (error) {
    console.error(error);
  } finally {
    window.location.href = '/login.html';
  }
}

function setupLogoutButton(button) {
  if (!button) return;

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    await logout();
  });
}

function setupNav(currentUser) {
  const profileLink = document.getElementById('nav-profile');
  const userName = document.getElementById('nav-username');

  if (profileLink && currentUser) {
    profileLink.href = `/profile.html?id=${currentUser.id}`;
  }

  if (userName && currentUser) {
    userName.textContent = currentUser.name || currentUser.username;
  }
}
