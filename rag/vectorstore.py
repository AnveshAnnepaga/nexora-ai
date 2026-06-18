import os
from typing import List

# Suppress HuggingFace Warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TQDM_DISABLE"] = "1"

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

# Local on-disk ChromaDB path — no server required
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db")

_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
    return _embeddings


class VectorStoreManager:
    def __init__(self, collection_name: str = "startup_context"):
        self.embeddings = get_embeddings()
        self.collection_name = collection_name

    def get_vectorstore(self) -> Chroma:
        """Returns a local on-disk Chroma vector store (no server needed)."""
        return Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=CHROMA_PERSIST_DIR,
        )

    def add_documents(self, documents: List[Document]) -> List[str]:
        """Adds processed documents/chunks to the vector store."""
        vectorstore = self.get_vectorstore()
        return vectorstore.add_documents(documents)

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Performs a similarity search. Returns empty list safely if store is empty."""
        try:
            vectorstore = self.get_vectorstore()
            return vectorstore.similarity_search(query, k=k)
        except Exception as e:
            print(f"VectorStore search skipped (empty or unavailable): {e}")
            return []
