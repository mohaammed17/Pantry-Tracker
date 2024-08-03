import { ImageAnnotatorClient } from '@google-cloud/vision';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { firestore } from '../../app/firebase'; // Adjust the path if necessary
import { doc, setDoc, collection } from 'firebase/firestore';
import { GoogleAuth } from 'google-auth-library';
import os from 'os';

// Ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is set
const GOOGLE_APPLICATION_CREDENTIALS_BASE64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

if (!GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
  console.error('Environment variable GOOGLE_APPLICATION_CREDENTIALS_BASE64 not found.');
  process.exit(1);
}

const credentialsBuffer = Buffer.from(GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64');
const keyFilePath = path.join(os.tmpdir(), 'gcp-keyfile.json');
fs.writeFileSync(keyFilePath, credentialsBuffer.toString('utf8'));

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

    // Check files object structure
    console.log('Files:', files);

    // Extract the file path
    const imagePath = files.image[0]?.filepath;

    // Log the image path
    console.log('Image Path:', imagePath);

    if (!imagePath) {
      return res.status(400).json({ error: 'Image file not found' });
    }

    // Authenticate with Google Auth Library
    const auth = new GoogleAuth({
      keyFile: keyFilePath,
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });

    const client = await auth.getClient();
    const projectId = process.env.PROJECT_ID;
    const endpointId = process.env.ENDPOINT_ID;
    const location = process.env.LOCATION;

    // Read the image file and convert it to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Prepare the request payload
    const payload = {
      instances: [
        {
          content: base64Image,
        },
      ],
      parameters: {
        confidenceThreshold: 0.5,
        maxPredictions: 5,
      },
    };

    // Make the prediction request
    const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;
    const response = await client.request({
      url,
      method: 'POST',
      data: payload,
    });

    const labels = response.data.predictions[0].displayNames;

    console.log('Labels detected:', labels);

    // Store the labels in Firestore
    const itemDocRef = doc(collection(firestore, 'inventory', 'detectedItems', 'items'));
    await setDoc(itemDocRef, { labels });

    return res.status(200).json({ labels });
  } catch (error) {
    console.error('Error during label detection:', error);
    return res.status(500).json({ error: 'Error during label detection' });
  }
};

export default handler;
