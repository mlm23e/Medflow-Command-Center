"""
create database in command line using:
    createdb medflow_dev
connect to interactive terminal using:
    psql medflow_dev
create table from SQL file in command line using:
    psql medflow -f [PATH_TO_DDL ]
    (e.g. in the backend, the path would be "../db/sql/DDL.sql")
alternatively, in the PSQL interactive terminal:
    \i [PATH TO SQL FILE]
    or (for relative paths)
    \ir [PATH TO SQL FILE]
"""


from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://mmarse:michael@localhost:5432/medflow_dev"
    # no default value here because a wrong secret key value can cause the app to start up 
    # seemingly successfully but with a silent failure because it will pass an incorrect 
    # secret key value for our JWT
    secret_key : str
    frontend_origin : str = "http://localhost:5173"

    # tells pydantic settings to actually read from backend/.env and fill these fields from it
    model_config = SettingsConfigDict(env_file=".env")

# without the .env file setting values, this line will raise an error on startup
settings = Settings()