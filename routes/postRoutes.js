import { Router } from 'express';
import {
  addComment,
  createPost,
  getPosts,
  getUserPosts,
  likePost,
  updatePost,
} from '../controllers/postController.js';
import verifyToken from '../middlewares/authMiddleware.js';

// router instance
const router = Router();

// ############## GET POSTS ##############
router.get('/', verifyToken, getPosts);

// ############## GET POST ################
router.get('/:username', verifyToken, getUserPosts);

// ########### CREATE POST ############
router.post('/create-post', verifyToken, createPost);

// ########### UPDATE POST ############
router.patch('/update-post', verifyToken, updatePost);

//  ############# LIKE A POST ################
router.patch('/like', verifyToken, likePost);

// ############ ADD COMMENT #################
router.patch('/add-comment', verifyToken, addComment);

export default router;
