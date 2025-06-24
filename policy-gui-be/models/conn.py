from pydantic import BaseModel

class Connection(BaseModel):
    conn: str