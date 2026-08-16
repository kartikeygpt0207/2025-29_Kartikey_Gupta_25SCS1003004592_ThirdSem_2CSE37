async function loadCommentsForCard(card, currentUser) {
  const postId = card.dataset.postId;
  const list = card.querySelector('.comments-list');

  list.innerHTML = '<p class="muted">Loading comments...</p>';

  try {
    const data = await apiGet(`/posts/${postId}/comments`);
    renderComments(list, data.data.comments, currentUser, card);
  } catch (error) {
    list.innerHTML = `<p class="alert alert--error">${escapeHtml(error.message)}</p>`;
  }
}

function renderComments(list, comments, currentUser, card) {
  list.innerHTML = '';

  if (!comments.length) {
    list.innerHTML = '<p class="muted comments-empty">No comments yet. Be the first!</p>';
    return;
  }

  comments.forEach((comment) => {
    list.appendChild(createCommentElement(comment, currentUser, card));
  });
}

function createCommentElement(comment, currentUser, card) {
  const item = document.createElement('div');
  item.className = 'comment-item';
  item.dataset.commentId = comment.id;

  item.innerHTML = `
    <div class="comment-item__avatar-slot"></div>
    <div class="comment-item__content">
      <div class="comment-item__header">
        <strong>${escapeHtml(comment.author.username)}</strong>
        <span class="comment-item__time">${formatDate(comment.createdAt)}</span>
      </div>
      <p>${escapeHtml(comment.content)}</p>
    </div>
    ${
      comment.isOwnComment
        ? `<button type="button" class="btn btn--ghost btn--small delete-comment-btn">Delete</button>`
        : ''
    }
  `;

  item.querySelector('.comment-item__avatar-slot').replaceWith(
    createAvatarElement(comment.author, 'avatar avatar--tiny')
  );

  const deleteBtn = item.querySelector('.delete-comment-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => deleteComment(item, card));
  }

  return item;
}

async function submitComment(card, form, currentUser) {
  const postId = card.dataset.postId;
  const input = form.querySelector('input[name="content"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const content = input.value.trim();

  if (!content) return;

  setLoading(submitBtn, true, 'Posting...');

  try {
    const data = await apiPost(`/posts/${postId}/comments`, { content });
    input.value = '';

    const list = card.querySelector('.comments-list');
    const emptyState = list.querySelector('.comments-empty');
    if (emptyState) emptyState.remove();

    list.appendChild(createCommentElement(data.data.comment, currentUser, card));

    const commentCount = card.querySelector('.comment-count');
    commentCount.textContent = Number(commentCount.textContent) + 1;
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(submitBtn, false);
  }
}

async function deleteComment(commentElement, card) {
  const commentId = commentElement.dataset.commentId;

  if (!window.confirm('Delete this comment?')) {
    return;
  }

  try {
    await apiDelete(`/comments/${commentId}`);
    commentElement.remove();

    const commentCount = card.querySelector('.comment-count');
    commentCount.textContent = Math.max(Number(commentCount.textContent) - 1, 0);

    const list = card.querySelector('.comments-list');
    if (!list.querySelector('.comment-item')) {
      list.innerHTML = '<p class="muted comments-empty">No comments yet. Be the first!</p>';
    }
  } catch (error) {
    alert(error.message);
  }
}
