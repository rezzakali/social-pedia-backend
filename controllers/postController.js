import { body, param, validationResult } from 'express-validator';
import imagekit from '../config/imageKitConfig.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import ErrorResponse from '../utility/error.js';
import upload from '../utility/imageUploader.js';
import uploadToImageKit from '../utility/uploadToImageKit.js';

// ################## CREATE POST #################
export const createPost = [
  upload.single('image'),
  // Validation checks using express-validator after multer
  body('userId').notEmpty().withMessage('userId is required!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // destructuring userId,description from req.body
      const { userId, description = null } = req.body;

      // find user by userId
      const user = await User.findById({ _id: userId });

      if (!user) {
        return next(new ErrorResponse('User does not exists!', 404));
      }

      if (!req.file) {
        return next(new ErrorResponse('No File Uploaded!', 400));
      }

      // upload image to imageKit platform
      const folderPath = 'posts';
      const imageUploadResponse = await uploadToImageKit(req.file, folderPath);

      // create new post
      const newPost = new Post({
        postedBy: userId,
        description,
        postImage: {
          url: imageUploadResponse?.url,
          fileId: imageUploadResponse?.fileId,
        },
        likes: [],
        comments: [],
      });

      // finally save the newPost to database
      await newPost.save();

      // Find all posts from the post collection and sort them by the most recent first
      const posts = await Post.find({}).sort({ createdAt: -1 });

      // finally return response with the posts
      return res.status(201).json({ status: true, posts });
    } catch (error) {
      // return error response
      return next(new ErrorResponse(error?.message, 409));
    }
  },
];

// ################## UPDATE POST #################
export const updatePost = [
  upload.single('image'),
  // Validation checks using express-validator after multer
  body('postId').notEmpty().escape().withMessage('postId is required!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // destructuring userId,description from req.body
      const { postId, description = null } = req.body;

      // find post by postId
      const post = await Post.findById(postId);

      if (!post) {
        return next(new ErrorResponse('Post not found!', 404));
      }

      if (!req.file) {
        return next(new ErrorResponse('No File Uploaded!', 400));
      }
      if (post.postImage) {
        const { fileId } = post.postImage;
        // Delete the file using ImageKit SDK
        imagekit.deleteFile(fileId, async (error, result) => {
          if (error) {
            return next(
              new ErrorResponse('Failed to update profile image', 500)
            );
          }

          // Proceed to upload and update the post image after successful deletion
          const folderPath = 'posts';
          const imageUploadResponse = await uploadToImageKit(
            req.file,
            folderPath
          );

          if (imageUploadResponse) {
            const { url, fileId } = imageUploadResponse;
            post.postImage.url = url;
            post.postImage.fileId = fileId;
            post.description = description;

            try {
              await post.save();
              return res
                .status(200)
                .json({ success: true, message: 'Post updated!' });
            } catch (saveError) {
              return next(new ErrorResponse('Failed to update post', 500));
            }
          } else {
            return next(new ErrorResponse('Failed to update post', 500));
          }
        });
      }
    } catch (error) {
      // return error response
      return next(new ErrorResponse(error?.message, 409));
    }
  },
];

// ################## GET POSTS #################
export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).populate({
      path: 'postedBy',
      select: 'name profileImage.url createdAt location',
    });
    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    return next(new ErrorResponse(error?.message, 404));
  }
};

// ################## GET USER POSTS #################
export const getUserPosts = [
  param('username')
    .notEmpty()
    .withMessage('Username is required!')
    .trim()
    .escape(),
  async (req, res, next) => {
    try {
      const { username } = req.params;
      // Find the user based on the username
      const user = await User.findOne({ username }).select('-password -__v');

      if (!user) {
        return next(new ErrorResponse('User not found!', 404));
      }
      // Find all posts for the user based on their _id
      const posts = await Post.find({ postedBy: user._id }).sort({
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        user,
        posts,
      });
    } catch (error) {
      return next(new ErrorResponse(error.message, 404));
    }
  },
];

// ################## LIKE A POST #################
export const likePost = [
  body('postId').notEmpty().escape().withMessage('postId is required!'),
  body('userId').notEmpty().escape().withMessage('userId is required!'),
  async (req, res, next) => {
    try {
      const { postId, userId } = req.body;

      let post = await Post.findById(postId);

      if (!post) {
        return next(new ErrorResponse('Post not found!', 404));
      }

      const likedIndex = post.likes.indexOf(userId);

      if (likedIndex === -1) {
        // If user hasn't liked the post, add their ID to the likes array
        await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } });
        post = await Post.findById(postId).populate(
          'likes',
          'name profileImage _id'
        );
        return res
          .status(200)
          .json({ success: true, message: 'Post liked', post });
      } else {
        // If user has already liked the post, remove their ID from the likes array
        await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
        // Fetch the post and populate 'likes' with selective user information
        post = await Post.findById(postId).populate(
          'likes',
          'name profileImage'
        );

        // Manually filter out the user who unliked the post from the 'likes' array
        post.likes = post.likes.filter(
          (like) => like._id.toString() !== userId
        );
        res.status(200).json({ success: true, message: 'Post unliked', post });
      }
    } catch (err) {
      return next(new ErrorResponse(err.message, 500));
    }
  },
];

// ############## ADD COMMENT ################
export const addComment = [
  body('userId').notEmpty().withMessage('userId is required!'),
  body('postId').notEmpty().withMessage('postId is required!'),
  body('comment').notEmpty().withMessage('Add a comment!'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // destructure userId and comment from request-body
      const { userId, comment, postId } = req.body;

      // find post by postId
      let post = await Post.findById(postId);

      if (!post) {
        return next(new ErrorResponse('Post not found!', 404));
      }
      // Create a new comment object with user ID and comment text
      const newComment = {
        user: userId,
        text: comment,
      };

      post.comments.push(newComment);

      // save the updated post to db
      await post.save();

      post = await Post.findById(postId)
        .populate('comments.user', 'name profileImage')
        .sort({ createdAt: -1 });

      // Return the response with the updated post
      return res
        .status(200)
        .json({ message: 'Comment added successfully', post });
    } catch (error) {
      // return error response
      return next(new ErrorResponse(error.message, 404));
    }
  },
];
