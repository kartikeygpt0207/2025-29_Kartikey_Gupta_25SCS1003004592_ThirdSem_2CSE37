const API_BASE = '/api';

async function parseResponse(response) {
  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const message = data.message || `Request failed with status ${response.status}`;
    const apiError = new Error(message);
    apiError.status = response.status;
    apiError.data = data;
    throw apiError;
  }

  return data;
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseResponse(response);
}

async function apiPost(path, body = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

async function apiPut(path, body = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

async function apiDelete(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseResponse(response);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name, username) {
  const source = (name || username || '?').trim();
  return source.charAt(0).toUpperCase();
}

function createAvatarElement(author, className = 'avatar') {
  const avatar = document.createElement('div');
  avatar.className = className;

  if (author.profileImage) {
    const img = document.createElement('img');
    img.src = author.profileImage;
    img.alt = `${author.username} profile`;
    img.className = `${className}__img`;
    avatar.appendChild(img);
  } else {
    avatar.textContent = getInitials(author.name, author.username);
  }

  return avatar;
}

function showAlert(container, message, type = 'error') {
  if (!container) return;

  container.textContent = message;
  container.className = `alert alert--${type}`;
  container.hidden = false;
}

function clearAlert(container) {
  if (!container) return;

  container.textContent = '';
  container.hidden = true;
  container.className = 'alert';
}

function setLoading(button, isLoading, loadingText = 'Loading...') {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}
