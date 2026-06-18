import os
from typing import List
from rag.document_processor import DocumentProcessor
from rag.media_processor import MediaProcessor
from rag.vectorstore import VectorStoreManager

class ContextBuilder:
    """
    Layer 1: Context Intelligence
    Ingests multimodal files (PDF, Video, Audio), processes them, and stores 
    the resulting context in ChromaDB for downstream Agentic RAG use.
    """
    def __init__(self):
        self.doc_processor = DocumentProcessor()
        self.media_processor = MediaProcessor(model_size="base")
        self.vector_store_manager = VectorStoreManager()

    def process_and_store_file(self, file_path: str) -> bool:
        """Determines the file type, processes it, and stores chunks in ChromaDB."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            documents = []
            if ext in [".pdf", ".txt", ".csv", ".docx"]:
                # Text-based documents
                documents = self.doc_processor.process_document(file_path)
            elif ext in [".mp4", ".avi", ".mov", ".mkv", ".wav", ".mp3"]:
                # Media documents (Video/Audio)
                doc = self.media_processor.process_media(file_path)
                # Chunk the transcription text just like a regular document
                documents = self.doc_processor.text_splitter.split_documents([doc])
            else:
                raise ValueError(f"Unsupported file format for Context Builder: {ext}")
            
            # Add to vector store
            if documents:
                self.vector_store_manager.add_documents(documents)
                print(f"Successfully processed and stored {len(documents)} chunks from {file_path}")
                return True
            return False

        except Exception as e:
            print(f"Error processing file {file_path}: {str(e)}")
            return False
