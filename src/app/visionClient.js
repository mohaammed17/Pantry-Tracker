const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient({
  keyFilename: './config/gcloud-key.json'
});

module.exports = client;
