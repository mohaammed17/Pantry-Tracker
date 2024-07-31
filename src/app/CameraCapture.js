import React, { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import { Button, Box } from '@mui/material';

const CameraCapture = ({ onCapture }) => {
  const camera = useRef(null);
  const [image, setImage] = useState(null);

  const takePicture = () => {
    const picture = camera.current.takePhoto();
    setImage(picture);
    onCapture(picture);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <Camera ref={camera} />
      <Button variant="contained" onClick={takePicture} sx={{ mt: 2 }}>Take Picture</Button>
      {image && <img src={image} alt="Captured" style={{ marginTop: '20px', maxWidth: '100%' }} />}
    </Box>
  );
};

export default CameraCapture;
