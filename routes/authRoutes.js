import { Router } from 'express';
import {
  changePasswordController,
  changeProfilePictureController,
  signInController,
  signUpController,
} from '../controllers/authController.js';
import verifyToken from '../middlewares/authMiddleware.js';

// router instance
const router = Router();

// sign up
router.post('/signup', signUpController);

// sign in
router.post('/signin', signInController);

// change password
router.patch('/change-password', verifyToken, changePasswordController);

// change profile
router.patch('/change-profile', verifyToken, changeProfilePictureController);

export default router;
