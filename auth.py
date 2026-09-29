# ═══════════════════════════════════════════════════════════
# ملف: auth.py
# الوظيفة: إدارة المصادقة (تسجيل الدخول، التوكن، التحقق)
# ═══════════════════════════════════════════════════════════
import os
from dotenv import load_dotenv
load_dotenv()
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import SessionLocal
import models


# ═══════════════════════════════════════════════════════════
# إعدادات الأمان
# ═══════════════════════════════════════════════════════════

# المفتاح السري لتوقيع التوكن (في الإنتاج، ضعه في .env)
SECRET_KEY = os.getenv("SECRET_KEY")


# خوارزمية التشفير
ALGORITHM = "HS256"

# مدة صلاحية التوكن (30 دقيقة)
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# ═══════════════════════════════════════════════════════════
# إعداد تشفير كلمات المرور
# ═══════════════════════════════════════════════════════════

# CryptContext: أداة لتشفير والتحقق من كلمات المرور
# نستخدم bcrypt (الأقوى حالياً)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# OAuth2PasswordBearer: يخبر FastAPI أن التوكن ي​رسَل في Header
# tokenUrl: مسار تسجيل الدخول (سي​ستخدم في Swagger)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# ═══════════════════════════════════════════════════════════
# دوال تشفير كلمات المرور
# ═══════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    """تحويل كلمة المرور إلى نص مشف​ر (لا يمكن عكسه)"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """التحقق: هل كلمة المرور المدخلة تطابق المشفرة؟"""
    return pwd_context.verify(plain_password, hashed_password)


# ═══════════════════════════════════════════════════════════
# دوال التوكن (JWT)
# ═══════════════════════════════════════════════════════════

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """إنشاء توكن JWT جديد"""
    to_encode = data.copy()
    
    # وقت انتهاء الصلاحية
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # توقيع التوكن بالمفتاح السري
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ═══════════════════════════════════════════════════════════
# دوال جلسة قاعدة البيانات
# ═══════════════════════════════════════════════════════════

def get_db():
    """ت​وف​ر جلسة قاعدة بيانات لكل طلب"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════
# التحقق من المستخدم الحالي
# ═══════════════════════════════════════════════════════════

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    استخراج المستخدم الحالي من التوكن
    ت​ستخدم كـ Dependency لحماية المسارات
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="توكن غير صالح أو منتهي الصلاحية",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # فك تشفير التوكن
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # البحث عن المستخدم في قاعدة البيانات
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    
    return user


def require_role(*allowed_roles: str):
    """
    المصنع: ي​نشئ دالة تتحقق من دور المستخدم
    مثال: Depends(require_role("admin"))
    """
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"هذا الإجراء يتطلب أحد الأدوار التالية: {allowed_roles}"
            )
        return current_user
    return role_checker