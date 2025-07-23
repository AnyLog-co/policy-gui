import requests
import json
import parsers
import anylog_api.anylog_connector as anylog_connector
from typing import Dict, Any

def get_node_options(node: str):
    response = make_request(node, "GET", "test network")
    response = parsers.parse_table(response)
    node_names = [
        node_info['Node Name']
        for node_info in response
        if 'Node Name' in node_info and node_info.get('Status', '') == '+'
    ]
    return node_names

def get_table_options(node: str):
    response = make_request(node, "GET", "blockchain get table")
    table_names = []
    for obj in response:
        group = obj.get('table')
        if group and 'name' in group:
            table_names.append(group['name'])
    result = list(set(table_names))
    return result

def get_security_groups(node: str):
    response = make_request(node, "GET", "blockchain get security_group")
    security_groups = []
    for obj in response:
        group = obj.get('security_group')
        if group and 'group_name' in group:
            security_groups.append(group['group_name'])
    security_groups = list(set(security_groups))
    return response

def get_permissions(node: str):
    response = make_request(node, "GET", "blockchain get permissions")

    # print("GETTING Permissions Response:", response)
    permissions = []
    for obj in response:
        permission = obj.get('permissions')
        if permission and 'name' in permission:
            permissions.append(permission['name'])
    permissions = list(set(permissions))
    return response



def make_policy(conn:str, policy: Dict):

    # Extract policy name and data from the input dictionary
    if len(policy) != 1:
        raise ValueError("Policy dictionary must have exactly one key (the policy name).")
    policy_name, policy_data = next(iter(policy.items()))

    # Create a simple object to mimic attribute access (policy.name, policy.data)
    class PolicyObj:
        def __init__(self, name, data):
            self.name = name
            self.data = data

    policy = PolicyObj(policy_name, policy_data)

    post_process_key = policy.data.pop("__post_process__", None)

    print(policy.name, policy.data)

    # Policy variable
    policy_var_command = 'new_policy = ""'
    print(f"Creating Policy Variable: {policy_var_command}")
    policy_var_response = make_request(conn, "POST", policy_var_command)
    print(f"Policy Variable Response: {policy_var_response}")

    policy_name_command = f'set policy new_policy [{policy_name}] = {{}}'
    print(f"Setting Policy Name: {policy_name_command}")
    make_request(conn, "POST", policy_name_command)
    print(f"Policy Name Set: {policy_name_command}")


    # Configure the policy with its data
    for key, value in policy.data.items():
        command = f'set policy new_policy [{policy.name}][{key}] = {value}'
        print(f"Setting Policy Config: {command}")
        make_request(conn, "POST", command)


    # # Construct the policy command
    # policy_command = f'{policy.name} = create policy {policy.name} where '
    # key_value_pairs = [f"{k} = {v}" for k, v in policy.data.items()]
    # policy_command += " and ".join(key_value_pairs)

    # # Submit the policy (POST)
    # print(f"Submitting Policy: {policy_command}")
    # make_request(conn, "POST", policy_command)

    # Retrieve the created policy (GET)
    get_policy_command = "get !new_policy"
    print(f"Fetching Policy: {get_policy_command}")
    policy_response = make_request(conn, "GET", get_policy_command)
    print(f"Policy Response: {policy_response}")


    # Post-process the policy if needed
    if post_process_key:
        try:
            run_post_process(post_process_key, policy, conn)
        except Exception as e:
            raise RuntimeError(f"Post-processing failed: {e}")


    # Get the master node IP/Port (POST)
    master_node_command = 'mnode = blockchain get master bring.ip_port'
    print(f"Fetching Master Node: {master_node_command}")
    make_request(conn, "POST", master_node_command)

    # Retrieve master node info (GET)
    get_master_command = "get !mnode"
    print(f"Fetching Master Node Info: {get_master_command}")
    master_node_response = make_request(conn, "GET", get_master_command)
    print(f"Master Node Response: {master_node_response}")

    # Insert policy into blockchain (POST)
    blockchain_insert_command = "blockchain insert where policy = !new_policy and local = true and master = !mnode"
    print(f"Inserting Policy into Blockchain: {blockchain_insert_command}")
    make_request(conn, "POST", blockchain_insert_command)

    # Retrieve the policy from the blockchain (POST)
    blockchain_get_command = f"blockchain get {policy.name}"
    print(f"Fetching Policy from Blockchain: {blockchain_get_command}")
    blockchain_response = make_request(conn, "GET", blockchain_get_command)
    print(f"Blockchain Policy Response: {blockchain_response}")

    return blockchain_response



def run_post_process(key: str, policy, conn: str):
    # print(f"[Post-Processing] Triggered for: {key}")

    handlers = {
        "apply_signature": post_apply_signature,
        "add_new_member": post_add_new_member,
        # Add more here
    }

    handler = handlers.get(key)
    if handler:
        handler(policy, conn)
    else:
        print(f"[Post-Processing] No handler found for: {key}")

def post_add_new_member(policy, conn):
    command = "get !new_policy"
    policy_response = make_request(conn, "GET", command)
    print("NEW MEMBER Response: ", policy_response)

    name = policy_response.get('member', {}).get('name')


    command = f'blockchain get member where name = {name}'
    check = make_request(conn, "GET", command)
    print(check)
    if isinstance(check, list) and len(check) > 0:
        raise Exception(f"Member with name '{name}' already exists: {check}")
    

    command = f"id create keys where password = 123 and keys_file = {name}"
    resp = make_request(conn, "POST", command)
    print("ID CREATE KEYS: ", resp)

    command = f'new_member_key = get private key where keys_file = {name}'
    resp = make_request(conn, "POST", command)
    command = "get !new_member_key"
    privkey_resp = make_request(conn, "GET", command)
    print("PRIVKEY Response: ", privkey_resp)

    command = "new_policy = id sign !new_policy where key = !new_member_key and password = 123"
    sign_response = make_request(conn, "POST", command)

    print("SIGN RESPONSE: ", sign_response)

    




def post_apply_signature(policy, conn):
    # print(f"[Post-Processing] Applying signature for policy: {policy.name}")

    command = "get !new_policy"
    policy_response = make_request(conn, "GET", command)
    # print(f"[Post-Processing] Policy Response: {policy_response}")

    # ASSUMES PRIVATE KEY IS GENERATED BY 'id create keys where password = abc and keys_file = root_keys' OR MAYBE 'id create keys for node where password = demo1'
    # ASSUMES PRIVATE KEY IS STORED IN 'private_key' VARIABLE BY 'private_key = get private key where keys_file = root_keys'
    # ASSUMES PASSWORD IS 'password123' FOR SIGNING (having done 'set local password = password123' before this step)

    command = "new_policy = id sign !new_policy where key = !private_key and password = password123"
    policy_response = make_request(conn, "POST", command)
    # print(f"[Post-Processing] Signature Response: {policy_response}")














def make_request(conn, method, command, topic=None, destination=None, payload=None):
    auth = ()
    timeout = 30
    anylog_conn = anylog_connector.AnyLogConnector(conn=conn, auth=auth, timeout=timeout)

    try:
        if method.upper() == "GET":
            response = anylog_conn.get(command=command, destination=destination)
        elif method.upper() == "POST":
            response = anylog_conn.post(command=command, topic=topic, destination=destination, payload=payload)
        else:
            raise ValueError("Invalid method. Use 'GET' or 'POST'.")
        # print("response", response)
        return response  # Assuming response is text, change if needed
    except requests.exceptions.RequestException as e:
        print(f"Error making {method.upper()} request: {e}")
        return None