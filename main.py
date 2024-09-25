from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import numpy as np
import io
import ffmpeg
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from starlette.responses import RedirectResponse

app = FastAPI()

# Disable CORS restrictions by allowing all origins, methods, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper model (try "medium" or "large" for more accurate results)
model = whisper.load_model("medium")  # change "base" to "medium" for better accuracy

def load_audio(file: io.BytesIO) -> np.ndarray:
    # Convert audio file (BytesIO) to a NumPy array using ffmpeg, resampling to 16kHz
    out, _ = (
        ffmpeg.input("pipe:0")
        .output("pipe:1", format="wav", ac=1, ar="16k")
        .run(input=file.read(), capture_stdout=True, capture_stderr=True)
    )
    audio = np.frombuffer(out, np.int16).flatten().astype(np.float32) / 32768.0
    return audio

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    # Ensure the uploaded file is an audio file
    if file.content_type not in ["audio/mpeg", "audio/wav", "audio/mp3"]:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an MP3 or WAV file.")

    try:
        audio_data = await file.read()
        audio_bytes = io.BytesIO(audio_data)

        # Convert audio to the format expected by Whisper (numpy array)
        audio_array = load_audio(audio_bytes)

        # Use Whisper to transcribe the audio
        result = model.transcribe(audio_array)

        # Return the transcription as a JSON response
        return JSONResponse(content={"transcription": result['text']})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
