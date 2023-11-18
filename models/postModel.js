import { Schema, model } from 'mongoose';

const postSchema = new Schema(
  {
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    description: String,
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
      },
    ],
    postImage: {
      url: {
        type: String,
      },
      fileId: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const Post = model('Post', postSchema);

export default Post;
