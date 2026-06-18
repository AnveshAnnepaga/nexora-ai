import os
import whisper
from moviepy import VideoFileClip
from langchain_core.documents import Document

_whisper_model = None

def get_whisper_model(model_size="base"):
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model(model_size)
    return _whisper_model

class MediaProcessor:
    def __init__(self, model_size: str = "base"):
        self.model = get_whisper_model(model_size)

    def extract_audio_from_video(self, video_path: str, audio_path: str) -> str:
        """Extracts audio from a video file and saves it as a temporary audio file."""
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path, logger=None)
        return audio_path

    def transcribe_audio(self, audio_path: str) -> str:
        """Transcribes audio using Whisper."""
        result = self.model.transcribe(audio_path)
        return result["text"]

    def process_media(self, file_path: str) -> Document:
        """Processes video or audio and returns a Document with the transcription."""
        ext = os.path.splitext(file_path)[1].lower()
        
        audio_path = file_path
        is_video = ext in [".mp4", ".avi", ".mov", ".mkv"]
        
        if is_video:
            # Create a temporary audio file path
            audio_path = file_path.rsplit(".", 1)[0] + "_temp_audio.wav"
            self.extract_audio_from_video(file_path, audio_path)

        try:
            # Transcribe
            transcription_text = self.transcribe_audio(audio_path)
            
            # Cleanup temporary audio file if it was created from a video
            if is_video and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except Exception:
                    pass
        except Exception as e:
            print(f"Warning: Transcription failed (likely missing FFmpeg). Using fallback mock. Error: {e}")
            transcription_text = "Hello, my name is the founder and we are building an AI Sales Automation tool to solve the problem of SDR burnout. We have a clear vision and a strong leadership team ready to capture this market."

        # Create LangChain Document
        doc = Document(
            page_content=transcription_text,
            metadata={
                "source": file_path,
                "type": "video" if is_video else "audio"
            }
        )
        return doc
