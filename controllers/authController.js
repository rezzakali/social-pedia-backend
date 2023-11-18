import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import imagekit from '../config/imageKitConfig.js';
import User from '../models/userModel.js';
import ErrorResponse from '../utility/error.js';
import upload from '../utility/imageUploader.js';
import uploadToImageKit from '../utility/uploadToImageKit.js';

// sign up controller
export const signUpController = [
  // Use multer middleware to handle file uploads first
  upload.single('image'),
  // Validation checks using express-validator after multer
  body('name').notEmpty().withMessage('Name is required!'),
  body('username')
    .notEmpty()
    .withMessage('Username is required!')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long!'),
  body('email')
    .notEmpty()
    .withMessage('Email must be required!')
    .isEmail()
    .withMessage('Invalid email address!'),

  body('password')
    .notEmpty()
    .withMessage('Password must be required!')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long!'),
  body('location').notEmpty().withMessage('Location is required!'),

  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // destructure properties from request body
    const { name, email, username, password, location, occupation } = req.body;

    try {
      // check if user already exists in the database
      const user = await User.findOne({ email });

      if (user) {
        return next(
          new ErrorResponse('User already exists with this email!', 403)
        );
      }

      //   hashed password
      const hashedPassword = bcrypt.hashSync(password, 10);

      if (!req.file) {
        return next(new ErrorResponse('No File Uploaded!', 400));
      }

      // upload image to imageKit platform
      const folderPath = 'users';
      const imageUploadResponse = await uploadToImageKit(req.file, folderPath);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        username,
        location,
        occupation,
        profileImage: {
          url: imageUploadResponse?.url,
          fileId: imageUploadResponse?.fileId,
        },
      });

      // finally save to database
      await newUser.save();

      // send response
      res.status(201).json({
        success: true,
        message: 'User registered successfully!',
      });
      next();
    } catch (error) {
      return next(new ErrorResponse(error?.message, 500));
    }
  },
];

// sign in controller
export const signInController = [
  body('email')
    .notEmpty()
    .withMessage('Email is required!')
    .isEmail()
    .withMessage('Invalid email address!'),
  body('password')
    .notEmpty()
    .withMessage('Password must be required!')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long!'),
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // destructure email and password from request body
      const { email, password } = req.body;

      // check user with the email
      const user = await User.findOne({ email });

      // if no user
      if (!user) {
        return next(new ErrorResponse('Invalid credentials!', 404));
      }

      // compare the password
      const isValidPassword = await bcrypt.compare(password, user.password);

      // if the password is invalid
      if (!isValidPassword) {
        return next(new ErrorResponse('Invalid credentials!', 400));
      }

      // generate a jwt token
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE_IN, // 30 days
      });

      return res.status(200).json({
        success: true,
        message: 'Logged in success',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          location: user.location,
          occupation: user.occupation,
          friends: user.friends,
          socialLinks: user.socialLinks,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v,
        },
      });
    } catch (error) {
      return next(new ErrorResponse(error?.message, 500));
    }
  },
];

// change password controller
export const changePasswordController = [
  body('email')
    .notEmpty()
    .withMessage('Email is required!')
    .isEmail()
    .withMessage('Invalid email address!'),
  body('oldPassword')
    .notEmpty()
    .withMessage('Password must be required!')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long!'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password must be required!')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long!'),
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // destructure email and password from request body
      const { email, oldPassword, newPassword } = req.body;

      // check user with the email
      const user = await User.findOne({ email });

      // if no user
      if (!user) {
        return next(new ErrorResponse('Invalid credentials', 404));
      }
      // Check if the current password is correct
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        return next(new ErrorResponse('Incorrect old password', 401));
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password in the database
      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully!',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

// change profile picture
export const changeProfilePictureController = [
  upload.single('image'),
  body('userId').notEmpty().withMessage('userId is required!'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.body;

      if (!req.file) {
        return next(new ErrorResponse('Profile image required!', 400));
      }

      const user = await User.findById(userId);

      if (!user) {
        return next(new ErrorResponse('User not found!', 404));
      }

      if (user.profileImage.fileId) {
        const { fileId } = user.profileImage;
        // Delete the file using ImageKit SDK
        imagekit.deleteFile(fileId, async (error, result) => {
          if (error) {
            return next(
              new ErrorResponse('Failed to update profile image', 500)
            );
          }

          // Proceed to upload and update the user profile image after successful deletion
          const folderPath = 'users';
          const imageUploadResponse = await uploadToImageKit(
            req.file,
            folderPath
          );

          if (imageUploadResponse) {
            const { url, fileId } = imageUploadResponse;
            user.profileImage.url = url;
            user.profileImage.fileId = fileId;

            try {
              await user.save();
              return res
                .status(200)
                .json({ success: true, message: 'Profile picture updated!' });
            } catch (saveError) {
              return next(
                new ErrorResponse('Failed to update profile picture', 500)
              );
            }
          } else {
            return next(new ErrorResponse('Failed to upload image', 500));
          }
        });
      } else {
        // If no fileId exists, simply upload the new image
        const folderPath = 'users';
        const imageUploadResponse = await uploadToImageKit(
          req.file,
          folderPath
        );

        if (imageUploadResponse) {
          const { url, fileId } = imageUploadResponse;
          user.profileImage.url = url;
          user.profileImage.fileId = fileId;

          try {
            await user.save();
            return res
              .status(200)
              .json({ success: true, message: 'Profile picture updated!' });
          } catch (saveError) {
            return next(new ErrorResponse('Failed to save user', 500));
          }
        } else {
          return next(new ErrorResponse('Failed to upload image', 500));
        }
      }
    } catch (error) {
      return next(new ErrorResponse(error?.message, 500));
    }
  },
];
