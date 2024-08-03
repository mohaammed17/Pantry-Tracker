const fs = require('fs');
const path = require('path');

const keyFilePath = path.resolve('C:/Users/mnalw/Downloads/Headstarter AI/Project 2 Pantry Tracker/pantry-tracker-431112-f15382db7412.json'); // Replace with your actual file path
const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
const base64KeyFileContent = Buffer.from(keyFileContent).toString('base64');

console.log(base64KeyFileContent);
