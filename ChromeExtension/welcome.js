// Request microphone access when this page is loaded
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        console.log('Microphone access granted.');

        // Stop the tracks to prevent the recording indicator from being shown
        stream.getTracks().forEach(track => track.stop());
    })
    .catch(error => {
        console.error('Error requesting microphone permission:', error);
    });
