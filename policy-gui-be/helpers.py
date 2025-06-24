import requests
import anylog_api.anylog_connector as anylog_connector
from typing import Dict, Any




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


    # Construct the policy command
    policy_command = f'{policy.name} = create policy {policy.name} where '
    key_value_pairs = [f"{k} = {v}" for k, v in policy.data.items()]
    policy_command += " and ".join(key_value_pairs)

    # Submit the policy (POST)
    print(f"Submitting Policy: {policy_command}")
    make_request(conn, "POST", policy_command)

    # Retrieve the created policy (GET)
    get_policy_command = f"get !{policy.name}"
    print(f"Fetching Policy: {get_policy_command}")
    policy_response = make_request(conn, "GET", get_policy_command)
    print(f"Policy Response: {policy_response}")

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
    blockchain_insert_command = f"blockchain insert where policy = !{policy.name} and local = true and master = !mnode"
    print(f"Inserting Policy into Blockchain: {blockchain_insert_command}")
    make_request(conn, "POST", blockchain_insert_command)

    # Retrieve the policy from the blockchain (POST)
    blockchain_get_command = f"blockchain get {policy.name}"
    print(f"Fetching Policy from Blockchain: {blockchain_get_command}")
    blockchain_response = make_request(conn, "GET", blockchain_get_command)
    print(f"Blockchain Policy Response: {blockchain_response}")

    return blockchain_response



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
        print("response", response)
        return response  # Assuming response is text, change if needed
    except requests.exceptions.RequestException as e:
        print(f"Error making {method.upper()} request: {e}")
        return None