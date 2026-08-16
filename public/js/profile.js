document.addEventListener('DOMContentLoaded', async () => {
  const profileRoot = document.getElementById('profile-page');
  if (!profileRoot) return;

  const currentUser = await requireAuth();
  if (!currentUser) return;

  setupNav(currentUser);
  setupLogoutButton(document.getElementById('logout-btn'));

  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id') || currentUser.id;

  const alertBox = document.getElementById('profile-alert');
  const followBtn = document.getElementById('follow-btn');
  const editBtn = document.getElementById('edit-profile-btn');
  const editForm = document.getElementById('edit-profile-form');
  const postsContainer = document.getElementById('profile-posts');
  const loading = document.getElementById('profile-loading');

  loading.hidden = false;

  try {
    const profileData = await apiGet(`/users/${userId}`);
    const profile = profileData.data.user;
    renderProfile(profile);
    await loadProfilePosts(userId, postsContainer, currentUser);

    setupUserListModal(userId);

    if (profile.isOwnProfile) {
      editBtn.hidden = false;
      followBtn.hidden = true;
      setupEditProfile(profile, editForm, editBtn, alertBox);
    } else {
      followBtn.hidden = false;
      setupFollowButton(followBtn, profile, alertBox);
    }
  } catch (error) {
    showAlert(alertBox, error.message);
  } finally {
    loading.hidden = true;
  }
});

function renderProfile(profile) {
  document.getElementById('profile-name').textContent = profile.name || profile.username;
  document.getElementById('profile-username').textContent = `@${profile.username}`;
  document.getElementById('profile-bio').textContent = profile.bio || 'No bio yet.';
  document.getElementById('followers-count').textContent = profile.followersCount;
  document.getElementById('following-count').textContent = profile.followingCount;
  document.getElementById('posts-count').textContent = profile.postsCount;

  const avatarContainer = document.getElementById('profile-avatar');
  avatarContainer.innerHTML = '';

  if (profile.profileImage) {
    const img = document.createElement('img');
    img.src = profile.profileImage;
    img.alt = `${profile.username} profile`;
    img.className = 'profile-avatar__img';
    avatarContainer.appendChild(img);
  } else {
    avatarContainer.textContent = getInitials(profile.name, profile.username);
  }
}

async function loadProfilePosts(userId, container, currentUser) {
  container.innerHTML = '';

  try {
    const data = await apiGet(`/users/${userId}/posts?limit=20`);
    const posts = data.data.posts;

    if (!posts.length) {
      container.innerHTML = '<p class="muted">No posts yet.</p>';
      return;
    }

    posts.forEach((post) => {
      container.appendChild(renderPostCard(post, currentUser));
    });
  } catch (error) {
    container.innerHTML = `<p class="alert alert--error">${escapeHtml(error.message)}</p>`;
  }
}

function setupFollowButton(button, profile, alertBox) {
  updateFollowButton(button, profile.isFollowing);

  button.addEventListener('click', async () => {
    button.disabled = true;
    clearAlert(alertBox);

    try {
      const isFollowing = button.dataset.following === 'true';
      const data = isFollowing
        ? await apiDelete(`/users/${profile.id}/follow`)
        : await apiPost(`/users/${profile.id}/follow`);

      updateFollowButton(button, data.data.isFollowing);
      document.getElementById('followers-count').textContent = data.data.followersCount;
    } catch (error) {
      showAlert(alertBox, error.message);
    } finally {
      button.disabled = false;
    }
  });
}

function updateFollowButton(button, isFollowing) {
  button.dataset.following = String(isFollowing);
  button.textContent = isFollowing ? 'Unfollow' : 'Follow';
  button.classList.toggle('btn--danger', isFollowing);
  button.classList.toggle('btn--primary', !isFollowing);
}

function setupUserListModal(userId) {
  const modal = document.getElementById('user-list-modal');
  const followersBtn = document.getElementById('followers-btn');
  const followingBtn = document.getElementById('following-btn');

  followersBtn.addEventListener('click', () => openUserListModal(userId, 'followers'));
  followingBtn.addEventListener('click', () => openUserListModal(userId, 'following'));

  modal.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => {
      modal.hidden = true;
    });
  });
}

async function openUserListModal(userId, type) {
  const modal = document.getElementById('user-list-modal');
  const title = document.getElementById('user-list-title');
  const list = document.getElementById('user-list');
  const loading = document.getElementById('user-list-loading');

  title.textContent = type === 'followers' ? 'Followers' : 'Following';
  list.innerHTML = '';
  loading.hidden = false;
  modal.hidden = false;

  try {
    const data = await apiGet(`/users/${userId}/${type}`);
    const users = data.data[type];

    if (!users.length) {
      list.innerHTML = `<li class="muted">${type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</li>`;
    } else {
      users.forEach((user) => {
        const item = document.createElement('li');
        item.className = 'user-list__item';
        item.innerHTML = `
          <a href="/profile.html?id=${user.id}">
            <span class="user-list__avatar-slot"></span>
            <span>
              <strong>${escapeHtml(user.username)}</strong>
              <span class="user-list__meta">${escapeHtml(user.name || user.username)}</span>
            </span>
          </a>
        `;
        item.querySelector('.user-list__avatar-slot').replaceWith(
          createAvatarElement(user, 'avatar avatar--small')
        );
        list.appendChild(item);
      });
    }
  } catch (error) {
    list.innerHTML = `<li class="alert alert--error">${escapeHtml(error.message)}</li>`;
  } finally {
    loading.hidden = true;
  }
}

function setupEditProfile(profile, form, editBtn, alertBox) {
  editBtn.addEventListener('click', () => {
    form.hidden = !form.hidden;

    if (!form.hidden) {
      document.getElementById('edit-name').value = profile.name || '';
      document.getElementById('edit-bio').value = profile.bio || '';
      document.getElementById('edit-profile-image').value = profile.profileImage || '';
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertBox);

    const submitBtn = form.querySelector('button[type="submit"]');
    setLoading(submitBtn, true, 'Saving...');

    try {
      const payload = {
        name: document.getElementById('edit-name').value.trim(),
        bio: document.getElementById('edit-bio').value.trim(),
        profileImage: document.getElementById('edit-profile-image').value.trim(),
      };

      const data = await apiPut(`/users/${profile.id}`, payload);
      renderProfile({
        ...profile,
        ...data.data.user,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
        postsCount: profile.postsCount,
        isOwnProfile: true,
      });

      form.hidden = true;
      showAlert(alertBox, 'Profile updated successfully.', 'success');
    } catch (error) {
      showAlert(alertBox, error.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}
