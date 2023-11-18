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
