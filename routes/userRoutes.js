import { Router } from 'express';
import {
  addRemoveFriend,
  addSocialLink,
  deleteSocialLink,
  getUser,
  getUserFriends,
  updateSocialLink,
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

// ############# ADD SOCIAL LINKS ##############
router.post('/:username/add-social-link', verifyToken, addSocialLink);

// ############# UPDATE SOCIAL LINKS ##############
router.patch('/:username/update-social-link', verifyToken, updateSocialLink);

// ############# UPDATE SOCIAL LINKS ##############
router.patch('/:username/delete-social-link', verifyToken, deleteSocialLink);

export default router;
