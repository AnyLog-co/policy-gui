# policy-gui



### Proposed Flow

1. user opens gui
2. user selects a policy
3. fe queries backend for policy details/policy form
4. backend returns policy details/policy form
5. fe renders policy form
6. user fills out policy form
7. user submits policy form
8. fe sends policy form data to backend
9. backend processes policy form data
10. backend returns success/failure response
11. fe displays success/failure message to user




### How to add new policy type
1. make new template in be/templates folder
2. make new model file in be/models folder
3. edit SubmitPolicyRequest and policy_factory in be/main.py to include new policy type
4. edit PolicySelector.js in fe/src/components to include new policy type