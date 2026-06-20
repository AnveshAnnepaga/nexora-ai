# Use the official Python 3.10 slim image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code, agents, and other python files
COPY backend/ ./backend/
COPY agents/ ./agents/
COPY rag/ ./rag/
COPY antigravity.db . 
# Note: we copy antigravity.db so it works out of the box on HF Spaces, but you might want to use a persistent volume in production.

# Copy .env file if it exists (Hugging Face allows adding secrets in the UI, which is preferred)
COPY .env* ./

# Expose port 7860 which is required by Hugging Face Spaces
EXPOSE 7860

# Run Uvicorn server on port 7860 instead of 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
