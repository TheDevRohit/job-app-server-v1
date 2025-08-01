const Article = require('../models/article');
const News = require('../models/News');

exports.createArticle = async (req, res) => {
  try {
    const { title, content, tags, image, status , authorName } = req.body;

    const article = new Article({
      title,
      content,
      tags,
      authorName,
      image,
      author: req.user.id,
      status: status || 'published',
    });

    await article.save();
    res.status(201).json({ message: 'Article created', article });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: 'published' }).populate('author', 'name');
    res.json({ message: 'List of articles', articles });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('author', 'name');
    if (!article) return res.status(404).json({ message: 'Article not found' });

    article.views += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    if (article.author.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, content, tags, image, status } = req.body;
    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (tags !== undefined) article.tags = tags;
    if (image !== undefined) article.image = image;
    if (status !== undefined) article.status = status;

    await article.save();
    res.json({ message: 'Article updated', article });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    if (article.author.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await article.remove();
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.likeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    const userId = req.user.id;

    if (!article) return res.status(404).json({ message: 'Article not found' });

    if (article.likes.includes(userId)) {
      article.likes = article.likes.filter(id => id.toString() !== userId);
      await article.save();
      return res.json({ message: 'Unliked article' });
    } else {
      article.likes.push(userId);
      await article.save();
      return res.json({ message: 'Liked article' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.commentOnArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const comment = {
      user: req.user.id,
      comment: req.body.comment,
    };

    article.comments.push(comment);
    await article.save();

    res.json({ message: 'Comment added', comments: article.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user.id });
    res.json({ message: 'My articles', articles });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNews = async (req, res) => {
  try {
    const {
      category = 'technology',
      lang = 'en',
      country = 'in',
      max = 100
    } = req.query;

    const apiKey = '0c4ab980caa2fc930ea7e95321cd2b9a';
    const gnewsUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&country=${country}&max=${max}&apikey=${apiKey}`;

    console.log(`Requesting: ${gnewsUrl}`);

    const response = await axios.get(gnewsUrl);

    if (!response.data || !Array.isArray(response.data.articles)) {
      throw new Error('Invalid response from GNews API');
    }

    const techArticles = response.data.articles;

    await News.insertMany(techArticles);

    res.status(200).json({
      message: 'News synced successfully',
      totalFetched: techArticles.length,
      usedUrl: gnewsUrl
    });

  } catch (error) {
    console.error('News Sync Error:', error);
    res.status(500).json({
      error: 'News sync failed',
      message: error.message,
      stack: error.stack
    });
  }
};
