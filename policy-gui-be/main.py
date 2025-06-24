# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Union, Dict
from models.user_policy import UserPolicyData, UserPolicy
from models.base_policy import BasePolicy
import json
import os
import helpers

app = FastAPI()

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


TEMPLATE_DIR = "templates"

# --- Unified Request Model --- #
class SubmitPolicyRequest(BaseModel):
    node: str
    policy_type: Literal["user", "config", "security"]  # Expand this as more types are added
    policy: Dict  # raw policy body (we will parse it later)



@app.get("/")
def root():
    resp = helpers.make_request("45.33.110.211:32549", "GET", "get status")
    return {"message": resp}


@app.get("/policy-template/{policy_type}")
def get_policy_template(policy_type: str):
    file_path = os.path.join(TEMPLATE_DIR, f"{policy_type}_policy.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Policy template not found")

    with open(file_path, "r") as f:
        return json.load(f)
    

# --- Dispatcher --- #
def policy_factory(policy_type: str, policy_data: Dict) -> BasePolicy:
    if policy_type == "user":
        data = UserPolicyData(**policy_data)
        return UserPolicy(data)
    raise HTTPException(status_code=400, detail="Unsupported policy type")



@app.post("/submit")
def submit_policy(request: SubmitPolicyRequest):
    policy_obj = policy_factory(request.policy_type, request.policy)

    if not policy_obj.validate():
        raise HTTPException(status_code=422, detail="Policy validation failed")

    final_json = policy_obj.to_dict()

    print("Final JSON Policy:", final_json)

    resp = helpers.make_policy(request.node, final_json)

    return resp

    return {
        "message": f"{request.policy_type} policy created successfully",
        "policy": final_json,
        "target_node": request.node
    }
