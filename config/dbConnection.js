import mongoose from 'mongoose';

const dbConnection = async () => {
  try {
    await mongoose.connect(
      `${process.env.MONGO_CONN_URI}/${process.env.DB_NAME}`
    );
    console.log('Database connection successfully established!');
  } catch (error) {
    console.log(error);
    console.log('Database connection failed!');
  }
};

export default dbConnection;
