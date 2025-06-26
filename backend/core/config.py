from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./defects.db"
    # In a production environment, you might have:
    # DATABASE_URL: str = "postgresql://user:password@host:port/database"
    # REDIS_URL: str = "redis://localhost:6379"

    class Config:
        case_sensitive = True


settings = Settings() 