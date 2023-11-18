import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dbConnection from '../config/dbConnection.js';
import errorHandler from '../middlewares/errorHandler.js';
import authRoutes from '../routes/authRoutes.js';
import postRoutes from '../routes/postRoutes.js';
import userRoutes from '../routes/userRoutes.js';

// environment variable cofiguration
dotenv.config();

// database connection
dbConnection();

const PORT = process.env.PORT || 8000;
const HOST_NAME = process.env.HOST_NAME || 'localhost';

// app instance
const app = express();
// body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// morgan
app.use(morgan('dev'));

// helmet for security
app.use(helmet());
// cors policy
app.use(
  cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

//   routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);

// customize error handler
app.use(errorHandler);

// defualt error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next();
  }
  res.status(500).json({ error: 'There was a server side error!' });
});

// listening the server
app.listen(PORT, HOST_NAME, () => {
  console.log(
    `Your server is running successfully on http://${HOST_NAME}:${PORT}`
  );
});
