const formatAuthor = (author) => ({
  id: author._id.toString(),
  username: author.username,
  name: author.name,
  profileImage: author.profileImage,
});

const formatPost = (post, currentUserId, commentsCount = 0) => {
  const userId = currentUserId ? currentUserId.toString() : null;

  return {
    id: post._id.toString(),
    content: post.content,
    image: post.image,
    author: formatAuthor(post.author),
    likesCount: post.likes.length,
    commentsCount,
    likedByCurrentUser: userId
      ? post.likes.some((likeId) => likeId.toString() === userId)
      : false,
    createdAt: post.createdAt,
  };
};

const getCommentCounts = async (Comment, postIds) => {
  if (!postIds.length) {
    return {};
  }

  const counts = await Comment.aggregate([
    { $match: { post: { $in: postIds } } },
    { $group: { _id: '$post', count: { $sum: 1 } } },
  ]);

  return counts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});
};

const formatPosts = async (posts, currentUserId, Comment) => {
  const postIds = posts.map((post) => post._id);
  const commentCounts = await getCommentCounts(Comment, postIds);

  return posts.map((post) =>
    formatPost(post, currentUserId, commentCounts[post._id.toString()] || 0)
  );
};

module.exports = {
  formatAuthor,
  formatPost,
  formatPosts,
};
