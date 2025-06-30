from pydantic import BaseModel, create_model, ValidationError
from models.base_policy import BasePolicy
from typing import Dict, Any, List
from datetime import datetime, timedelta
import uuid

class GenericPolicy(BasePolicy):
    def __init__(self, template: Dict[str, Any], data: Dict[str, Any]):
        self.template = template
        self.policy_type = template["policy_type"]

        # Build dynamic Pydantic model
        self.schema = self._build_pydantic_model(template["fields"])
        
        # Validate and store data
        try:
            self.data_model = self.schema(**data)
        except ValidationError as e:
            raise ValueError(f"Validation error: {e}")

        self.generated_fields = self._generate_backend_fields(template["fields"])

    def _build_pydantic_model(self, fields: List[Dict[str, Any]]) -> BaseModel:
        model_fields = {}
        for field in fields:
            if field.get("type") == "generated":
                continue  # exclude backend-generated fields

            name = field["name"]
            ftype = self._map_type(field.get("type", "string"))
            required = field.get("required", False)

            default = ... if required else None
            model_fields[name] = (ftype, default)

        return create_model(f"{self.policy_type.capitalize()}PolicyModel", **model_fields)

    def _map_type(self, template_type: str):
        mapping = {
            "string": str,
            "integer": int,
            "float": float,
            "boolean": bool,
            "select": str,  # still a string but constrained by options (optional to enforce)
        }
        return mapping.get(template_type, str)

    def _generate_backend_fields(self, fields: List[Dict[str, Any]]):
        output = {}
        for field in fields:
            if field.get("type") != "generated":
                continue
            name = field["name"]
            if name == "public_key":
                output[name] = str(uuid.uuid4())
            elif name == "expiration":
                output[name] = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
            else:
                output[name] = f"generated:{name}"
        return output

    def validate(self) -> bool:
        # You could add semantic validation here (e.g. port ranges)
        return True

    def to_dict(self) -> Dict[str, Any]:
        result = self.data_model.model_dump()
        result.update(self.generated_fields)
        return {self.policy_type: result}
