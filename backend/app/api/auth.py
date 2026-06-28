from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import auth_rule, rate_limit
from app.core.security import create_access_token, verify_password
from app.models import User
from app.dependencies import get_current_user
from app.schemas import LoginRequest, Token, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def prevent_auth_response_caching(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.auth_cookie_max_age_seconds,
        expires=settings.auth_cookie_max_age_seconds,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite=settings.auth_cookie_samesite,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite=settings.auth_cookie_samesite,
    )


@router.post("/login", response_model=Token, dependencies=[rate_limit(auth_rule)])
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> Token:
    prevent_auth_response_caching(response)
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    access_token = create_access_token(user.email)
    if settings.auth_cookie_enabled:
        set_auth_cookie(response, access_token)
    return Token(access_token=access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    prevent_auth_response_caching(response)
    clear_auth_cookie(response)


@router.get("/me", response_model=UserOut)
def me(response: Response, user: User = Depends(get_current_user)) -> User:
    prevent_auth_response_caching(response)
    return user
