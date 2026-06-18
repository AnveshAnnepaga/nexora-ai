import os
from typing import List
from langchain_community.document_loaders import (
    PyMuPDFLoader,
    TextLoader,
    CSVLoader,
    Docx2txtLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

class DocumentProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )

    def load_document(self, file_path: str) -> List[Document]:
        """Loads a document based on its file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf":
            loader = PyMuPDFLoader(file_path)
        elif ext == ".txt":
            loader = TextLoader(file_path)
        elif ext == ".csv":
            loader = CSVLoader(file_path)
        elif ext == ".docx":
            loader = Docx2txtLoader(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
            
        return loader.load()

    def process_document(self, file_path: str) -> List[Document]:
        """Loads and chunks the document into smaller pieces."""
        docs = self.load_document(file_path)
        chunks = self.text_splitter.split_documents(docs)
        
        # Add basic metadata
        for chunk in chunks:
            chunk.metadata['source'] = file_path
            chunk.metadata['type'] = 'document'
            
        return chunks
