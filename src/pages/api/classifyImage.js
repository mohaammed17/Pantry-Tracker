import { ImageAnnotatorClient } from '@google-cloud/vision';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const client = new ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), 'config/gcloud-key.json'),
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).send(err);
        return;
      }

      const imagePath = files.image.path;
      const [result] = await client.labelDetection(imagePath);
      const labels = result.labelAnnotations.map(label => label.description);

      res.status(200).json({ labels });
    });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
};

export default handler;
