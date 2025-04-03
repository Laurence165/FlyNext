import { IncomingForm } from "formidable";
import path from "path";

// Disable bodyParser for this route as we are using formidable to parse the body
export const config = {
  api: {
    bodyParser: false, // Disable Next.js's body parser for this API route
  },
};

export async function handler(req: any, res: any) {
  const form = new IncomingForm();

  // Set the upload directory (this will save files in the `public/images` folder)
  form.uploadDir = path.join(process.cwd(), "public/images");
  form.keepExtensions = true; // Retain original file extensions

  // Parse the form data
  form.parse(req, (err: any, fields: any, files: any) => {
    if (err) {
      console.error("Error parsing the form", err);
      return res.status(500).json({ message: "Error uploading file" });
    }

    // Assuming there is only one file uploaded
    const file = files.file[0];

    // If no file is uploaded
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Construct the file URL
    const filePath = `/images/${file.newFilename}`;

    // Return the file URL in the response
    return res.status(200).json({ url: filePath });
  });
}
