# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Union, Dict
from models.user_policy import UserPolicyData, UserPolicy
from models.base_policy import BasePolicy
from models.generic_policy import GenericPolicy
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
    policy_file: str  # Allow dynamic addition
    policy: Dict


@app.get("/")
def root():
    resp = helpers.make_request("45.33.110.211:32549", "GET", "get status")
    return {"message": resp}

@app.get("/policy-types")
def list_policy_types():
    policy_list = []

    for filename in os.listdir(TEMPLATE_DIR):
        if filename.endswith("_policy.json"):
            try:
                with open(os.path.join(TEMPLATE_DIR, filename), "r") as f:
                    template = json.load(f)
                    policy_list.append({
                        "type": template.get("policy_file"),
                        "name": template.get("name", template.get("policy_file"))
                    })
            except Exception as e:
                continue  # skip broken files

    return {"types": policy_list}

@app.get("/policy-template/{policy_file}")
def get_policy_template(policy_file: str):
    file_path = os.path.join(TEMPLATE_DIR, f"{policy_file}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Policy template not found")

    with open(file_path, "r") as f:
        return json.load(f)
    

# --- Dispatcher --- #
def policy_factory(policy_file: str, policy_data: Dict, node: str = None):
    template_path = os.path.join(TEMPLATE_DIR, f"{policy_file}.json")
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template not found")

    with open(template_path, "r") as f:
        template = json.load(f)

    try:
        # print("Creating policy object for:", policy_file)
        print(template)
        return GenericPolicy(template, policy_data, node)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/submit")
def submit_policy(request: SubmitPolicyRequest):
    policy_obj = policy_factory(request.policy_file, request.policy, request.node)

    # print("Policy Object:", policy_obj)

    if not policy_obj.validate():
        raise HTTPException(status_code=422, detail="Policy validation failed")

    final_json = policy_obj.to_dict()

    # print("Final JSON Policy:", final_json)

    resp = helpers.make_policy(request.node, final_json)

    return resp

@app.get("/node-options/{node}")
def get_node_options(node: str):
    try:
        options = helpers.get_node_options(node)
        print(options)
        # return {"options": response.get("peers", [])}  # adapt based on actual format
        return {"options": options}  # Placeholder for testing
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/table-options/{node}")
def get_table_options(node: str):
    try:
        # response = helpers.make_request(node, "GET", "get all tables")
        # return {"options": response.get("tables", [])}  # adapt as needed
        return {"options": ["table1", "table2", "table3"]}  # Placeholder for testing
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/permissions/{node}")
def get_permissions(node: str):
    # Fetch the on‑chain permissions policy from the node
    resp = helpers.make_request(node, "GET", "blockchain get permissions")
    print("Permissions Response:", resp)
    # Expecting a dict with roles and allowed_policy_types
    return resp