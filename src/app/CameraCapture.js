import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'react-camera-pro';
import { Button, Box, Typography, IconButton, Alert } from '@mui/material';
import { FlipCameraAndroid } from '@mui/icons-material';
import axios from 'axios';

const CameraCapture = ({ onCapture }) => {
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [labels, setLabels] = useState([]);
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [currentCamera, setCurrentCamera] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (camera.current && numberOfCameras > 1) {
      try {
        camera.current.switchCamera(currentCamera);
      } catch (e) {
        setError('Unable to switch camera. Please try a different browser or device.');
      }
    }
  }, [currentCamera, numberOfCameras]);

  const takePicture = async () => {
    if (!camera.current) {
      setError('No camera device accessible. Please connect your camera or try a different browser.');
      console.error('No camera device accessible.');
      return;
    }

    try {
      console.log('Taking picture...');
      const picture = camera.current.takePhoto();
      console.log('Picture taken:', picture);

      if (picture) {
        setImage(picture);

        // Convert base64 to Blob
        const byteString = atob(picture.split(',')[1]);
        const mimeString = picture.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });

        // Send the Blob to the handler
        onCapture(blob);
      } else {
        setError('Failed to take picture. Please try again.');
        console.error('Failed to take picture.');
      }
    } catch (e) {
      setError('Error capturing image: ' + e.message);
      console.error('Error capturing image:', e);
    }
  };

  const switchCamera = () => {
    if (numberOfCameras > 1) {
      setCurrentCamera((prevCamera) => (prevCamera + 1) % numberOfCameras);
    } else {
      setError('No additional cameras available.');
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      {error && <Alert severity="error">{error}</Alert>}
      <Camera
        ref={camera}
        numberOfCamerasCallback={setNumberOfCameras}
        facingMode={currentCamera}
      />
      <Box mt={2} display="flex" flexDirection="column" alignItems="center">
        {numberOfCameras > 1 && (
          <IconButton onClick={switchCamera} aria-label="switch camera">
            <FlipCameraAndroid />
          </IconButton>
        )}
        <Button variant="contained" onClick={takePicture} sx={{ mt: 2 }}>Take Picture</Button>
      </Box>
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
