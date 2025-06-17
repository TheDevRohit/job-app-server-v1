const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article_controller');
const auth = require('../middlewares/auth_middlewars'); // your JWT middleware

router.post('/', auth, articleController.createArticle);
router.get('/', articleController.getAllArticles);
router.get('/my', auth, articleController.getMyArticles);
router.get('/:id', articleController.getArticleById);
router.put('/:id', auth, articleController.updateArticle);
router.delete('/:id', auth, articleController.deleteArticle);

router.post('/:id/like', auth, articleController.likeArticle);
router.post('/:id/comment', auth, articleController.commentOnArticle);
router.get('/news' , articleController.getNews);
module.exports = router;
