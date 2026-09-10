from pydantic settings: BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    analyzer_max_code_length: int = 50000
    analyzer_allowed_extensions: str = "py,ipynb"
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "ml_checker"
    default_masked: bool = True
