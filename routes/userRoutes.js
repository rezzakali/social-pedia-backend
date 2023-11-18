import { Router } from 'express';
import {
  addRemoveFriend,
  getUser,
  getUserFriends,
} from '../controllers/userController.js';
import verifyToken from '../middlewares/authMiddleware.js';

// router instance
const router = Router();

// ################ GET USER ##############
router.get('/:username', verifyToken, getUser);

// #################### GET USER FRIEND ################
router.get('/:username/friends', verifyToken, getUserFriends);

// ################### UPDATE || ADD FRIEND ##############
router.patch('/:username', verifyToken, addRemoveFriend);

export default router;
