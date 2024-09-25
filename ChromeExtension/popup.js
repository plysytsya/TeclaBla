const recordButton = document.getElementById('recordButton');
const statusMessage = document.getElementById('statusMessage');

let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// Function to inject the permission iframe
function injectMicrophonePermissionIframe() {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('hidden', 'hidden');
  iframe.setAttribute('id', 'permissionsIFrame');
  iframe.setAttribute('allow', 'microphone');
  iframe.src = chrome.runtime.getURL('welcome.html');
  document.body.appendChild(iframe);
}

// Function to request microphone permission
async function requestMicrophoneAccess() {
  injectMicrophonePermissionIframe();

  // Wait a moment to ensure permissions are requested
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        // Request access to the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        resolve(stream);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        resolve(null);
      }
    }, 20); // Slight delay to allow iframe to load
  });
}

recordButton.addEventListener('click', async () => {
  if (!isRecording) {
    // Request microphone access before starting to record
    const stream = await requestMicrophoneAccess();

    if (stream) {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();
      statusMessage.textContent = 'Recording...';
      statusMessage.style.display = 'block';
      recordButton.textContent = 'Stop Recording';
      recordButton.classList.add('recording');

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        statusMessage.textContent = 'Transcribing...';
        await sendAudioToOpenAI(audioBlob);
      };

      isRecording = true;
    } else {
      console.error('Microphone access was denied.');
    }
  } else {
    // Stop the recording
    mediaRecorder.stop();
    recordButton.textContent = 'Start Recording';
    recordButton.classList.remove('recording');
    isRecording = false;
  }
});

// Function to send audio to OpenAI's Whisper API
async function sendAudioToOpenAI(audioBlob) {
  const OPENAI_API_KEY = 'secret'; // Replace with your OpenAI API key
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-1');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.text) {
      // Copy the transcription to the clipboard
      await navigator.clipboard.writeText(result.text);
      statusMessage.textContent = 'Ready! Transcription copied to clipboard.';
    } else {
      console.error('Error transcribing audio:', result);
      statusMessage.textContent = 'Transcription failed. Try again.';
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    statusMessage.textContent = 'Error occurred during transcription.';
  } finally {
    // Hide the status message after a short delay
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
}
