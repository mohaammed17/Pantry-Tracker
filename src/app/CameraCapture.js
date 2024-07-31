import React, { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import { Button, Box, Typography } from '@mui/material';
import axios from 'axios';

const CameraCapture = ({ onCapture }) => {
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [labels, setLabels] = useState([]);

  const takePicture = async () => {
    const picture = camera.current.takePhoto();
    setImage(picture);
    onCapture(picture);

    const formData = new FormData();
    formData.append('image', picture);

    try {
      const response = await axios.post('/api/classifyImage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLabels(response.data.labels);
    } catch (error) {
      console.error('Error classifying image:', error);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <Camera ref={camera} />
      <Button variant="contained" onClick={takePicture} sx={{ mt: 2 }}>Take Picture</Button>
      {image && <img src={image} alt="Captured" style={{ marginTop: '20px', maxWidth: '100%' }} />}
      {labels.length > 0 && (
        <Box mt={2}>
          <Typography variant="h6">Detected Labels:</Typography>
          <ul>
            {labels.map((label, index) => <li key={index}>{label}</li>)}
          </ul>
        </Box>
      )}
    </Box>
  );
};

export default CameraCapture;
