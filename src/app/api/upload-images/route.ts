
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadImages = (req: any, res: any) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), 'public/images');
  form.keepExtensions = true;
  form.parse(req, (err: any, fields: any, files: any) => {
    if (err) {
      return res.status(500).json({ message: "Error uploading files" });
    }

    const imageUrls = files.files.map((file: any) => `/images/${file.newFilename}`);
    return res.status(200).json({ urls: imageUrls });
  });
};

export default uploadImages;
