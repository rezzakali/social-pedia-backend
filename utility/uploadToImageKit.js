import imagekit from '../config/imageKitConfig.js';

const uploadToImageKit = async (file, folderPath) => {
  try {
    const response = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
      useUniqueFileName: true,
      folder: folderPath,
    });

    return response;
  } catch (error) {
    console.log('error to uploading image to image kit', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

export default uploadToImageKit;
