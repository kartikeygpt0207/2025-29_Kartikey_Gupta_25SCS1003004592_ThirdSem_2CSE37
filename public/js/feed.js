function renderPostCard(post, currentUser) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.dataset.postId = post.id;

  const isOwnPost = currentUser && post.author.id === currentUser.id;

  card.innerHTML = `
    <header class="post-card__header">
      <a href="/profile.html?id=${post.author.id}" class="post-card__author-link">
        <span class="post-card__avatar-slot"></span>
        <span>
          <strong class="post-card__username">${escapeHtml(post.author.username)}</strong>
          <span class="post-card__meta">${formatDate(post.createdAt)}</span>
        </span>
      </a>
      ${
        isOwnPost
          ? `<button type="button" class="btn btn--ghost btn--small delete-post-btn" data-post-id="${post.id}">Delete</button>`
          : ''
      }
    </header>
    <div class="post-card__body">
      ${post.content ? `<p class="post-card__content">${escapeHtml(post.content)}</p>` : ''}
      ${
        post.image
          ? `<img src="${escapeHtml(post.image)}" alt="Post image" class="post-card__image">`
          : ''
      }
    </div>
    <div class="post-card__actions">
      <button type="button" class="action-btn like-btn ${post.likedByCurrentUser ? 'action-btn--active' : ''}" data-post-id="${post.id}" aria-pressed="${post.likedByCurrentUser}">
        <span class="action-btn__icon">${post.likedByCurrentUser ? '♥' : '♡'}</span>
        <span class="like-count">${post.likesCount}</span>
      </button>
      <button type="button" class="action-btn comment-toggle-btn" data-post-id="${post.id}">
        <span class="action-btn__icon">💬</span>
        <span class="comment-count">${post.commentsCount}</span>
      </button>
    </div>
    <section class="comments-section" hidden>
      <div class="comments-list" data-post-id="${post.id}"></div>
      <form class="comment-form" data-post-id="${post.id}">
        <input type="text" name="content" class="input comment-input" placeholder="Write a comment..." maxlength="1000" required>
        <button type="submit" class="btn btn--primary btn--small">Post</button>
      </form>
    </section>
  `;

  const avatarSlot = card.querySelector('.post-card__avatar-slot');
  avatarSlot.replaceWith(createAvatarElement(post.author, 'avatar avatar--small'));

  attachPostCardEvents(card, currentUser);
  return card;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attachPostCardEvents(card, currentUser) {
  const likeBtn = card.querySelector('.like-btn');
  const deleteBtn = card.querySelector('.delete-post-btn');
  const commentToggle = card.querySelector('.comment-toggle-btn');
  const commentsSection = card.querySelector('.comments-section');
  const commentForm = card.querySelector('.comment-form');

  likeBtn.addEventListener('click', () => toggleLike(card, postIdFromCard(card)));

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => deletePostFromCard(card));
  }

  commentToggle.addEventListener('click', async () => {
    const isHidden = commentsSection.hidden;
    commentsSection.hidden = !isHidden;

    if (!isHidden) return;

    await loadCommentsForCard(card, currentUser);
  });

  commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitComment(card, commentForm, currentUser);
  });
}

function postIdFromCard(card) {
  return card.dataset.postId;
}

async function toggleLike(card, postId) {
  const likeBtn = card.querySelector('.like-btn');
  const isLiked = likeBtn.classList.contains('action-btn--active');

  likeBtn.disabled = true;

  try {
    const data = isLiked
      ? await apiDelete(`/posts/${postId}/like`)
      : await apiPost(`/posts/${postId}/like`);

    updateLikeUI(card, data.data.post);
  } catch (error) {
    alert(error.message);
  } finally {
    likeBtn.disabled = false;
  }
}

function updateLikeUI(card, post) {
  const likeBtn = card.querySelector('.like-btn');
  const likeCount = card.querySelector('.like-count');
  const commentCount = card.querySelector('.comment-count');

  likeBtn.classList.toggle('action-btn--active', post.likedByCurrentUser);
  likeBtn.setAttribute('aria-pressed', String(post.likedByCurrentUser));
  likeBtn.querySelector('.action-btn__icon').textContent = post.likedByCurrentUser ? '♥' : '♡';
  likeCount.textContent = post.likesCount;
  commentCount.textContent = post.commentsCount;
}

async function deletePostFromCard(card) {
  const postId = postIdFromCard(card);

  if (!window.confirm('Delete this post?')) {
    return;
  }

  try {
    await apiDelete(`/posts/${postId}`);
    card.remove();
  } catch (error) {
    alert(error.message);
  }
}

async function loadFeed(page = 1) {
  const feedContainer = document.getElementById('feed');
  const pagination = document.getElementById('feed-pagination');
  const loading = document.getElementById('feed-loading');
  const emptyState = document.getElementById('feed-empty');

  loading.hidden = false;
  feedContainer.innerHTML = '';
  emptyState.hidden = true;

  try {
    const data = await apiGet(`/posts?page=${page}&limit=10`);
    const { posts, pagination: pageInfo } = data.data;

    if (!posts.length) {
      emptyState.hidden = false;
    } else {
      const currentUser = await getCurrentUser();
      posts.forEach((post) => {
        feedContainer.appendChild(renderPostCard(post, currentUser));
      });
    }

    renderPagination(pagination, pageInfo);
  } catch (error) {
    feedContainer.innerHTML = `<p class="alert alert--error">${escapeHtml(error.message)}</p>`;
  } finally {
    loading.hidden = true;
  }
}

function renderPagination(container, pageInfo) {
  if (!container) return;

  container.innerHTML = '';

  if (pageInfo.totalPages <= 1) {
    return;
  }

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'btn btn--ghost btn--small';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = pageInfo.page <= 1;
  prevBtn.addEventListener('click', () => loadFeed(pageInfo.page - 1));

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn btn--ghost btn--small';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = pageInfo.page >= pageInfo.totalPages;
  nextBtn.addEventListener('click', () => loadFeed(pageInfo.page + 1));

  const label = document.createElement('span');
  label.className = 'pagination__label';
  label.textContent = `Page ${pageInfo.page} of ${pageInfo.totalPages}`;

  container.appendChild(prevBtn);
  container.appendChild(label);
  container.appendChild(nextBtn);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('feed')) return;

  const currentUser = await requireAuth();
  if (!currentUser) return;

  setupNav(currentUser);
  setupLogoutButton(document.getElementById('logout-btn'));
  await loadFeed(1);
});
