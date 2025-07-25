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
import secrets
import textwrap


app = FastAPI()

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://0.0.0.0:3001"],  # React dev server and production
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
    return {"message": "Policy GUI Backend is running", "status": "healthy"}

@app.get("/health")
def health():
    try:
        # Test external REST API connectivity
        import requests
        response = requests.get("https://httpbin.org/get", timeout=5)
        
        if response.status_code == 200:
            return {
                "status": "healthy", 
                "message": "Backend is running",
                "rest_api_test": {
                    "external_api": "working",
                    "status_code": response.status_code,
                    "response_time": f"{response.elapsed.total_seconds():.3f}s"
                }
            }
        else:
            return {
                "status": "unhealthy",
                "message": "External API test failed",
                "rest_api_test": {
                    "external_api": "failed",
                    "status_code": response.status_code
                }
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Backend has issues: {str(e)}",
            "rest_api_test": {
                "external_api": "failed",
                "error": str(e)
            }
        }




@app.get("/policy-types")
def list_policy_types():
    policy_list = []

    for filename in os.listdir(TEMPLATE_DIR):
        if filename.endswith("_policy.json"):
            try:
                with open(os.path.join(TEMPLATE_DIR, filename), "r") as f:
                    template = json.load(f)
                    policy_list.append(
                        {
                            "type": template.get("policy_file"),
                            "name": template.get("name", template.get("policy_file")),
                        }
                    )
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

challenge_store = {}

@app.post("/login")
def authenticate_user(request: LoginRequest):
    """
    Authenticate user using node and pubkey, returning member policy if found.
    """
    try:
        member_policy = permissions.get_member_policy(
            request.node, f'"{request.pubkey}"'
        )

        if len(member_policy) > 0:
            print("Member Policy:", member_policy)
            member_policy_pubkey = member_policy[0].get("member", {}).get("public_key")
            member_policy_name = member_policy[0].get("member", {}).get("name")

            challenge = secrets.token_urlsafe(32)



            helpers.make_request(request.node, "POST", f"message = {challenge}")
            resp = helpers.make_request(request.node, "GET", "get !message")
            print("Secret logged:", resp)

            command = f"login_pubkey = get public key where keys_file = {member_policy_name}"
            print("Command to get pubkey:", command)
            helpers.make_request(request.node, "POST", command)
            resp = helpers.make_request(request.node, "GET", "get !login_pubkey")
            print("Pubkey logged:", resp)
            print("Login Pubkey:", member_policy_pubkey)

            helpers.make_request(request.node, "POST", "id encrypt !message !login_pubkey")
            encrypted = helpers.make_request(request.node, "GET", "get !message")
            print("Encrypted Secret logged:", encrypted)

            challenge_store[request.pubkey] = challenge

            command = f"login_privkey = get private key where keys_file = {member_policy_name}"
            print("Command to get privkey:", command)
            helpers.make_request(request.node, "POST", command)
            resp = helpers.make_request(request.node, "GET", "get !login_privkey")
            print("Privkey logged:", resp)


            helpers.make_request(request.node, "POST", "message = id decrypt !message where key = !login_privkey and password = 123")
            decrypted = helpers.make_request(request.node, "GET", "get !message")
            print("Decrypted Secret logged:", decrypted)

            # return {
            #     "encrypted_challenge": encrypted,
            #     "decrypt_command": f"echo '{encrypted}' | anylog id decrypt <your_private_key>"
            # }



            # helpers.make_request()

        return {
            "success": True,
            "member_policy": member_policy,
            "message": "Authentication successful",
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


# @app.post("/auth/request-challenge"):
# def request_challenge(request: LoginRequest):
#     try:
#         member_policy = permissions.get_member_policy(request.node, f'"{request.pubkey}"')

#         return {
#             "success": True,
#             "member_policy": member_policy,
#             "message": "Authentication successful"
#         }
#     except ValueError as e:
#         raise HTTPException(status_code=401, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/custom-types")
def get_custom_types():
    """
    Endpoint to get all custom types (policy types) available in the system.
    This can be used by the frontend to populate type selectors, etc.
    """
    try:
        # Assuming policy templates are stored as files in TEMPLATE_DIR
        types = ["node", "table", "security_group"]
        return {"custom_types": types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get custom types: {str(e)}")


@app.post("/type-options")
def get_type_options(node: str = Body(...), type: str = Body(...)):
    """
    Generic endpoint to get options for a given type (e.g., node, table, etc.) on a node.
    Extend this as new types are needed.
    """
    try:
        if type == "node":
            options = helpers.get_node_options(node)
            return {"options": options}
        elif type == "table":
            # Placeholder: replace with actual logic as needed
            options = helpers.get_table_options(node)
            # options = ["table1", "table2", "table3"]
            return {"options": options}
        elif type == "security_group":
            # Placeholder: replace with actual logic as needed
            resp = helpers.get_security_groups(node)
            print("Security Groups Response:", resp)
            options = resp
            return {"options": options}
        else:
            return {"options": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get options for type '{type}': {str(e)}")


@app.get("/permissions/{node}")
def get_permissions(node: str):
    # Fetch the on‑chain permissions policy from the node
    resp = helpers.get_permissions(node)
    # print("Permissions Response:", resp)
    # Expecting a dict with roles and allowed_policy_types
    return {"permissions": resp}


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
        member_policy = (
            member_policy[0].get("member")
            if isinstance(member_policy, list)
            else member_policy.get("member")
        )
        security_group_names = member_policy.get("security_group")
        if isinstance(security_group_names, str):
            security_group_names = [security_group_names]
        # if not role:
        #     raise HTTPException(status_code=404, detail="Role not found in member policy")

        # 2. Get all security_group policies for this role
        # (Assume helpers.make_request returns a list of policies if multiple match)

        if "admin" in security_group_names:
            # Admins have all permissions, return empty allowed_policy_fields
            return {
                "security_group": security_group_names,
                "allowed_policy_types": ["*"],
                "allowed_policy_fields": {},
            }

        all_security_group_policies = []
        for group_name in security_group_names:
            group_policies = helpers.make_request(
                node,
                "GET",
                f"blockchain get security_group where group_name = {group_name}",
            )
            if group_policies:
                all_security_group_policies.extend(group_policies)

        if not all_security_group_policies:
            raise HTTPException(
                status_code=404, detail="No security_group policies found for these roles"
            )

        print("Role Permissions Policies:", all_security_group_policies)

        # 3. Aggregate all permission names
        permission_names = set()
        for policy in all_security_group_policies:
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

        # def aggregate_field_permissions(nested):
        #     aggregated = {}
        #     for sublist in nested:
        #         for entry in sublist:
        #             fp = entry.get("permissions", {}).get("field_permissions", {})
        #             for category, fields in fp.items():
        #                 aggregated.setdefault(category, {}).update(fields)
        #     return aggregated

        # The function aggregates all field_permissions, ensuring that if any policy marks a field as True, the result is True.
        def aggregate_field_permissions(nested):
            aggregated = {}
            for sublist in nested:
                for entry in sublist:
                    fp = entry.get("permissions", {}).get("field_permissions", {})
                    for category, fields in fp.items():
                        if category not in aggregated:
                            aggregated[category] = {}
                        for field, value in fields.items():
                            # If any value is True, keep it True
                            if field in aggregated[category]:
                                aggregated[category][field] = aggregated[category][field] or value
                            else:
                                aggregated[category][field] = value
            return aggregated

        allowed_policy_fields = aggregate_field_permissions(permissions_policies)

        # Remove all subkeys (fields) with value False from allowed_policy_fields
        for category in list(allowed_policy_fields.keys()):
            fields = allowed_policy_fields[category]
            # Remove fields with value False
            filtered_fields = {k: v for k, v in fields.items() if v}
            if filtered_fields:
                allowed_policy_fields[category] = filtered_fields
            else:
                # If no fields remain, remove the category entirely
                del allowed_policy_fields[category]

        print("Allowed Policy fields: ", allowed_policy_fields)

        allowed_policy_types = list(allowed_policy_fields.keys())

        return {
            "security_group": security_group_names, # str: name of the group
            "allowed_policy_types": allowed_policy_types, # list of allowed policy types
            "allowed_policy_fields": allowed_policy_fields, # dict of type: {field: t/f}
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to aggregate user permissions: {str(e)}"
        )


@app.post("/check-field-permission")
def check_field_permission(request: CheckPermissionRequest):
    """
    Check if a member has permission to access a specific field in a policy type.
    """
    try:
        has_permission = permissions.check_field_permission(
            request.node, request.member_pubkey, request.policy_type, request.field_name
        )
        return {
            "has_permission": has_permission,
            "field": request.field_name,
            "policy_type": request.policy_type,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Permission check failed: {str(e)}"
        )


@app.post("/get-allowed-fields")
def get_allowed_fields(request: GetAllowedFieldsRequest):
    """
    Get all fields that a member is allowed to access for a specific policy type.
    """
    try:
        allowed_fields = permissions.get_allowed_fields(
            request.node, request.member_pubkey, request.policy_type
        )
        return {"allowed_fields": allowed_fields, "policy_type": request.policy_type}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get allowed fields: {str(e)}"
        )


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
            raise HTTPException(
                status_code=400, detail="member_pubkey is required in policy data"
            )

        # Remove member_pubkey from policy data before validation
        policy_data = {k: v for k, v in request.policy.items() if k != "member_pubkey"}

        filtered_data = permissions.validate_policy_access(
            request.node, member_pubkey, request.policy_file, policy_data
        )

        return {
            "filtered_policy": filtered_data,
            "policy_type": request.policy_file,
            "original_fields": list(policy_data.keys()),
            "allowed_fields": list(filtered_data.keys()),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Policy validation failed: {str(e)}"
        )
