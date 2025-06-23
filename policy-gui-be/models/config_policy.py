# config_policy.py
from pydantic import BaseModel, Field
from models.base_policy import BasePolicy
from typing import List, Dict, Any, Optional

class ConfigPolicyData(BaseModel):
    name: str
    ip: str
    local_ip: str
    port: int = 7848
    rest_port: int = 7849
    broker_port: int = 7850
    script: List[str] = Field(default_factory=list)
    extra_fields: Optional[Dict[str, Any]] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        data = self.model_dump_json()
        extras = data.pop("extra_fields", {})
        data.update(extras)
        return data

class ConfigPolicy(BasePolicy):
    def __init__(self, data: ConfigPolicyData):
        self.data = data

    def to_dict(self):
        return {"config": self.data.to_dict()}

    def validate(self):
        # Add semantic validation here, e.g., port ranges, IP format checks
        return True
