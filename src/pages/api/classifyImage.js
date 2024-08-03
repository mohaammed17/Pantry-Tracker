import { ImageAnnotatorClient } from '@google-cloud/vision';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { firestore } from '../../app/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
  const keyFilePath = path.join('/tmp', 'gcloud-key.json');
  fs.writeFileSync(
    keyFilePath,
    Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf8')
  );
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
} else if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error('Environment variable GOOGLE_APPLICATION_CREDENTIALS_BASE64 not found.');
}

const client = new ImageAnnotatorClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { files } = await parseForm(req);

    console.log('Files:', files);
    const imagePath = files.image[0]?.filepath;

    console.log('Image Path:', imagePath);

    if (!imagePath) {
      return res.status(400).json({ error: 'Image file not found' });
    }

    try {
      const [result] = await client.labelDetection(imagePath);
      const labels = result.labelAnnotations.map((label) => label.description);

      console.log('Labels detected:', labels);

      const itemDocRef = doc(collection(firestore, 'inventory', 'detectedItems', 'items'));
      await setDoc(itemDocRef, { labels });

      return res.status(200).json({ labels });
    } catch (error) {
      console.error('Error during label detection:', error);
      return res.status(500).json({ error: 'Error during label detection' });
    }
  } catch (err) {
    console.error('Error parsing the file', err);
    return res.status(500).json({ error: 'Error parsing the file' });
  }
};

export default handler;
