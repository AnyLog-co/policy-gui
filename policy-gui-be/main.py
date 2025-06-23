# # app/routers/users.py
# from fastapi import APIRouter

# router = APIRouter(
#     prefix="/users",
#     tags=["users"],
#     responses={404: {"description": "User not found"}},
# )

# @router.get("/")
# async def read_users():
#     return [{"username": "Alice"}, {"username": "Bob"}]

# @router.get("/{user_id}")
# async def read_user(user_id: int):
#     return {"username": f"User {user_id}"}

# # main.py
# from fastapi import FastAPI
# from app.routers import users

# app = FastAPI()

# app.include_router(users.router)
