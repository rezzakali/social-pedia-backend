import { body, param, validationResult } from 'express-validator';
import User from '../models/userModel.js';
import ErrorResponse from '../utility/error.js';

// ################# GET USER ####################
export const getUser = [
  // Validation checks using express-validator after multer
  param('username').notEmpty().escape().withMessage('username is required!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username } = req.params;

      // find user by id
      const user = await User.findOne({ username }).select('-password -__v');

      // if no user
      if (!user) {
        return next(new ErrorResponse('User not found!', 404));
      }
      // If the user is found, return the response
      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      // return error
      return next(new ErrorResponse(error.message, 500));
    }
  },
];

// ################# GET USER FRIENDS ######################
export const getUserFriends = [
  // Validation checks using express-validator after multer
  param('username').notEmpty().escape().withMessage('username is required!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username } = req.params;

      // find user by id
      const user = await User.findOne({ username });

      // Fetch information about friends by concurrently executing User.findById for each friend ID

      //  This line of code uses Promise.all to concurrently execute multiple asynchronous User.findById operations for each _id in the user.friends array
      const friends = await Promise.all(
        user.friends.map((_id) =>
          User.findById({ _id }).select('-password -__v')
        )
      );

      // return the response with formatted friends
      return res.status(200).json({ success: true, friends });
    } catch (error) {
      // return error
      return next(new ErrorResponse(error.message, 500));
    }
  },
];

// ############### ADD REMOVE FRIEND ################
export const addRemoveFriend = [
  // Validation checks using express-validator after multer
  param('username').notEmpty().escape().withMessage('username is required!'),
  body('friendId').notEmpty().escape().withMessage('friendId is required!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username } = req.params;
      const { friendId } = req.body;

      // find user by username
      const user = await User.findOne({ username });

      if (!user) {
        return next(new ErrorResponse('User not found!', 404));
      }

      // find friend by friendId
      const friend = await User.findById({ _id: friendId });

      // Check if 'friendId' is already in 'user.friends'.
      // If yes, remove it from both 'user.friends' and 'friend.friends'.
      // If not, add 'friendId' to 'user.friends' and 'id' to 'friend.friends'.
      if (user.friends.includes(friendId)) {
        user.friends = user.friends.filter((_id) => _id !== friendId);
        console.log(friend.friends);
        friend.friends = friend.friends.filter(
          (_id) => _id.toString() !== user._id.toString()
        );
      } else {
        user.friends.push(friendId);
        friend.friends.push(user._id);
      }
      // finally save the user to database
      await user.save();

      // finally save the friend to database
      await friend.save();

      // Fetch information about friends by concurrently executing User.findById for each friend ID

      //  This line of code uses Promise.all to concurrently execute multiple asynchronous User.findById operations for each _id in the user.friends array
      const friends = await Promise.all(
        user.friends.map((_id) => User.findById({ _id }).select('-password'))
      );

      // return response with formatted friends
      return res.status(200).json({ success: true, friends });
    } catch (error) {
      //  return error
      return next(new ErrorResponse(error.message, 500));
    }
  },
];

// ################## ADD SOCIAL LINK ###############
export const addSocialLink = [
  param('username').notEmpty().escape().withMessage('username is required!'),
  body('platform').notEmpty().escape().withMessage('Platform is required!'),
  body('link').notEmpty().withMessage('Link is required!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, link } = req.body;

    try {
      const { username } = req.params;
      // find user by username
      let user = await User.findOne({ username });
      if (!user) {
        return next(new ErrorResponse('User not found!', 404));
      }

      if (user.socialLinks.length >= 3) {
        return next(
          new ErrorResponse(
            'You can add a maximum of three platforms only!',
            400
          )
        );
      }

      // check platform already exist or not
      const isPlatformAlreadyExist = user.socialLinks.some(
        (socialLink) => socialLink.platform === platform
      );
      if (isPlatformAlreadyExist) {
        return next(new ErrorResponse('Platform already exists!', 403));
      }

      user.socialLinks.push({ platform, link });
      await user.save();

      return res
        .status(200)
        .json({ success: true, message: 'Platform added successfully!' });
    } catch (error) {
      console.log(error);
      return next(new ErrorResponse(error.message, 500));
    }
  },
];

// ################## UPDATE SOCIAL LINK ###############
export const updateSocialLink = [
  param('username').notEmpty().escape().withMessage('username is required!'),
  body('platform').optional(),
  body('link').optional(),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, link } = req.body;

    try {
      const { username } = req.params;
      // find user by username
      let user = await User.findOne({ username });
      if (!user) {
        return next(new ErrorResponse('User not found!', 404));
      }

      // check platform already exist or not
      const existingPlatform = user.socialLinks.find(
        (socialLink) => socialLink.platform === platform
      );
      if (existingPlatform) {
        if (platform && platform.trim() !== '') {
          existingPlatform.platform = platform.trim();
        }

        if (platform && link.trim() !== '') {
          existingPlatform.link = link.trim();
        }

        await user.save();

        return res
          .status(200)
          .json({ success: true, message: 'Platform updated successfully!' });
      } else {
        return next(new ErrorResponse('Platform does not exist!', 400));
      }
    } catch (error) {
      console.log(error);
      return next(new ErrorResponse(error.message, 500));
    }
  },
];

// ################## DELETE SOCIAL LINK ###############
export const deleteSocialLink = [
  param('username').notEmpty().escape().withMessage('username is required!'),
  body('platform').notEmpty().escape().withMessage('Platform is required!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform } = req.body;

    try {
      const { username } = req.params;
      // find user by username
      let user = await User.findOne({ username });
      if (!user) {
        return next(new ErrorResponse('User not found!', 404));
      }

      await User.findOneAndUpdate(
        { username },
        { $pull: { socialLinks: { platform } } }
      );
      return res
        .status(200)
        .json({ success: true, message: 'Platform deleted!' });
    } catch (error) {
      return next(new ErrorResponse(error.message, 500));
    }
  },
];
