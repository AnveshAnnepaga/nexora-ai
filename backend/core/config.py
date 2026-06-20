import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Startup Idea Validation Platform API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./nexora.db"

    class Config:
        env_file = "backend/.env"
        extra = "ignore"

settings = Settings()
