/**
 * Requests user permission for microphone access.
 */
async function getUserPermission() {
  try {
    // Request access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone access granted");

    // Stop the tracks to prevent the recording indicator from being shown
    stream.getTracks().forEach((track) => track.stop());

  } catch (error) {
    console.error("Error requesting microphone permission:", error);

    // Additional error handling
    if (error.name === 'NotAllowedError') {
      console.error('Microphone access was denied by the user.');
    } else if (error.name === 'NotFoundError') {
      console.error('No microphone was found on this device.');
    } else if (error.name === 'NotReadableError') {
      console.error('Microphone is already in use by another application.');
    } else if (error.name === 'SecurityError') {
      console.error('Access to microphone is blocked due to security settings.');
    } else {
      console.error('An unknown error occurred while requesting microphone access.');
    }
  }
}

// Immediately request microphone permission when this script is loaded
getUserPermission();
