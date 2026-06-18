import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Startup Idea Validation Platform API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    class Config:
        env_file = "backend/.env"
        extra = "ignore"

settings = Settings()
