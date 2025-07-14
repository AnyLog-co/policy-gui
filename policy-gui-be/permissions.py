import helpers


def get_member_policy(node: str, pubkey: str):
    """
    Fetch the member policy for a given public key from the specified node.
    """
    command = f"blockchain get member where public_key = {pubkey}"
    print(f"Fetching Member Policy: {command}")
    response = helpers.make_request(node, "GET", command)
    
    if not response:
        raise ValueError(f"No member policy found for pubkey: {pubkey}")
    
    return response

