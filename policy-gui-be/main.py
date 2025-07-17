# main.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Union, Dict, List
from models.user_policy import UserPolicyData, UserPolicy
from models.base_policy import BasePolicy
from models.generic_policy import GenericPolicy
import json
import os
import helpers
import permissions

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

class LoginRequest(BaseModel):
    node: str
    pubkey: str

class GetUserPermissionsRequest(BaseModel):
    node: str
    pubkey: str

class CheckPermissionRequest(BaseModel):
    node: str
    member_pubkey: str
    policy_type: str
    field_name: str

class GetAllowedFieldsRequest(BaseModel):
    node: str
    member_pubkey: str
    policy_type: str


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
        print("Template on line 94:", template)
        print("Policy data on line 95:", policy_data)
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

@app.post("/login")
def authenticate_user(request: LoginRequest):
    """
    Authenticate user using node and pubkey, returning member policy if found.
    """
    try:
        member_policy = permissions.get_member_policy(request.node, f'"{request.pubkey}"')
        return {
            "success": True,
            "member_policy": member_policy,
            "message": "Authentication successful"
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

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
    # print("Permissions Response:", resp)
    # Expecting a dict with roles and allowed_policy_types
    return resp



@app.post("/user-permissions")
def get_user_permissions(node: str = Body(...), pubkey: str = Body(...)):
    """
    After login, aggregate all permissions for the user based on their role.
    """

    print("Aggregating permissions for user:", pubkey, "on node:", node)

    try:
        # 1. Get member policy
        member_policy = permissions.get_member_policy(node, f'"{pubkey}"')
        # if not isinstance(member_policy[0], dict):
        #     raise HTTPException(status_code=404, detail="Member policy not found or invalid format")
        member_policy = member_policy[0].get("member") if isinstance(member_policy, list) else member_policy.get('member')
        security_group_name = member_policy.get("security_group")
        # if not role:
        #     raise HTTPException(status_code=404, detail="Role not found in member policy")

        # 2. Get all security_group policies for this role
        # (Assume helpers.make_request returns a list of policies if multiple match)
        if security_group_name == "admin":
            # Admins have all permissions, return empty allowed_policy_fields
            return {
                "security_group": security_group_name,
                "allowed_policy_types": ["*"],
                "allowed_policy_fields": {}
            }

        security_group_policies = helpers.make_request(node, "GET", f"blockchain get security_group where group_name = {security_group_name}")
        if not security_group_policies:
            raise HTTPException(status_code=404, detail="No security_group policies found for this role")
        
        print("Role Permissions Policies:", security_group_policies)

        # 3. Aggregate all permission names
        permission_names = set()
        for policy in security_group_policies:
            policy_data = policy.get("security_group", {})
            perms = policy_data.get("permissions", [])
            permission_names.update(perms)

        print("Aggregated Permission Names:", permission_names)


        # 4. For each permission name, get the permissions_policy
        permissions_policies = []
        for perm_name in permission_names:
            perm_policy = permissions.get_permissions_policy(node, perm_name)
            if perm_policy:
                permissions_policies.append(perm_policy)

        # 5. For each permissions_policy, extract field_permissions, and aggregate like keys
        def aggregate_field_permissions(nested):
            aggregated = {}
            for sublist in nested:
                for entry in sublist:
                    fp = entry.get('permissions', {}) \
                            .get('field_permissions', {})
                    for category, fields in fp.items():
                        aggregated.setdefault(category, {}).update(fields)
            return aggregated
                
        allowed_policy_fields = aggregate_field_permissions(permissions_policies)

        allowed_policy_types = list(allowed_policy_fields.keys())
    
        return {
            "security_group": security_group_name,
            "allowed_policy_types": allowed_policy_types,
            "allowed_policy_fields": allowed_policy_fields
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to aggregate user permissions: {str(e)}")







@app.post("/check-field-permission")
def check_field_permission(request: CheckPermissionRequest):
    """
    Check if a member has permission to access a specific field in a policy type.
    """
    try:
        has_permission = permissions.check_field_permission(
            request.node, 
            request.member_pubkey, 
            request.policy_type, 
            request.field_name
        )
        return {
            "has_permission": has_permission,
            "field": request.field_name,
            "policy_type": request.policy_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Permission check failed: {str(e)}")

@app.post("/get-allowed-fields")
def get_allowed_fields(request: GetAllowedFieldsRequest):
    """
    Get all fields that a member is allowed to access for a specific policy type.
    """
    try:
        allowed_fields = permissions.get_allowed_fields(
            request.node, 
            request.member_pubkey, 
            request.policy_type
        )
        return {
            "allowed_fields": allowed_fields,
            "policy_type": request.policy_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get allowed fields: {str(e)}")

@app.post("/validate-policy-access")
def validate_policy_access(request: SubmitPolicyRequest):
    """
    Validate and filter policy data based on member permissions.
    This endpoint requires the member_pubkey to be included in the policy data.
    """
    try:
        # Extract member_pubkey from policy data
        member_pubkey = request.policy.get("member_pubkey")
        if not member_pubkey or not isinstance(member_pubkey, str):
            raise HTTPException(status_code=400, detail="member_pubkey is required in policy data")
        
        # Remove member_pubkey from policy data before validation
        policy_data = {k: v for k, v in request.policy.items() if k != "member_pubkey"}
        
        filtered_data = permissions.validate_policy_access(
            request.node, 
            member_pubkey, 
            request.policy_file, 
            policy_data
        )
        
        return {
            "filtered_policy": filtered_data,
            "policy_type": request.policy_file,
            "original_fields": list(policy_data.keys()),
            "allowed_fields": list(filtered_data.keys())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Policy validation failed: {str(e)}")