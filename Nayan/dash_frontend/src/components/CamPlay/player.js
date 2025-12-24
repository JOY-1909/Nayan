import React from 'react';
import styled from 'styled-components';

const StyledVideoContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
  width: 100%;
  background-color: #000;
`;

const StyledImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  text-align: center;
  font-size: 14px;
`;

// Helper function to convert camera link to MJPEG stream URL
const getMjpegUrl = (videoUrl) => {
  // If it's already a direct URL, use it
  if (videoUrl.includes('/videofeed') || videoUrl.includes('/shot.jpg')) {
    return videoUrl;
  }

  // Extract IP address from various URL formats
  let ipAddress = '';

  // Handle ws://localhost:9999/stream?url=... format
  if (videoUrl.includes('stream?url=')) {
    const urlParams = new URLSearchParams(videoUrl.split('?')[1]);
    const encodedUrl = urlParams.get('url');
    if (encodedUrl) {
      ipAddress = decodeURIComponent(encodedUrl).replace('http://', '').replace('/video', '');
    }
  }
  // Handle direct http:// URLs
  else if (videoUrl.includes('http://')) {
    ipAddress = videoUrl.replace('http://', '').replace('/video', '');
  }
  // Just an IP address
  else {
    ipAddress = videoUrl;
  }

  // Return MJPEG stream URL for IP Webcam
  return `http://${ipAddress}/videofeed`;
};

const Player = ({ videoUrl }) => {
  const mjpegUrl = getMjpegUrl(videoUrl);

  return (
    <StyledVideoContainer>
      <StyledImage
        src={mjpegUrl}
        alt="Camera Feed"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentNode.innerHTML = '<div style="color: white; text-align: center; padding-top: 25%;">Unable to load camera feed.<br/>Check if IP Webcam is running.</div>';
        }}
      />
    </StyledVideoContainer>
  );
};

export default Player;
