# ═══════════════════════════════════════════════════════════
# ملف: models.py
# الوظيفة: تعريف جداول قاعدة البيانات
# ═══════════════════════════════════════════════════════════

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ═══════════════════════════════════════════════════════════
# جدول ١: الأقسام (Departments)
# ═══════════════════════════════════════════════════════════
class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)              # اسم القسم
    description = Column(String, nullable=True)        # وصف القسم
    
    # العلاقة: قسم ← أطباء، قسم ← موظفون
    doctors = relationship("Doctor", back_populates="department")
    employees = relationship("Employee", back_populates="department")


# ═══════════════════════════════════════════════════════════
# جدول ٢: الأطباء (Doctors)
# ═══════════════════════════════════════════════════════════
class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)         # التخصص
    phone = Column(String, nullable=True)              # الهاتف
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


# ═══════════════════════════════════════════════════════════
# جدول ٣: الموظفون (Employees)
# يشمل: الممرضين، الصيادلة، فنيو المختبر، المحاسبين،
# المديرين، الحراس، عمال النظافة، إلخ
# ═══════════════════════════════════════════════════════════
class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)              # الاسم
    role = Column(String, nullable=False)              # الوظيفة (ممرض، صيدلي، حارس...)
    phone = Column(String, nullable=True)              # الهاتف
    salary = Column(Float, nullable=True)              # الراتب
    is_active = Column(Boolean, default=True)          # هل ما زال يعمل؟
    hire_date = Column(DateTime, default=datetime.now) # تاريخ التعيين
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    department = relationship("Department", back_populates="employees")


# ═══════════════════════════════════════════════════════════
# جدول ٤: المرضى (Patients)
# ═══════════════════════════════════════════════════════════
class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    diagnosis = Column(String, nullable=False)
    phone = Column(String, nullable=True)              # هاتف المريض
    created_at = Column(DateTime, default=datetime.now) # تاريخ التسجيل
    
    appointments = relationship("Appointment", back_populates="patient")


# ═══════════════════════════════════════════════════════════
# جدول ٥: المواعيد (Appointments)
# ═══════════════════════════════════════════════════════════
class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    appointment_date = Column(DateTime, default=datetime.now)
    status = Column(String, default="مؤكد")
    notes = Column(String, nullable=True)
    
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    
    # ═══════════════════════════════════════════════════════════
# جدول ٦: المستخدمون (Users)
# المسؤولون عن تسجيل الدخول للنظام
# الأدوار: admin (مدير), doctor (طبيب), receptionist (موظف استقبال)
# ═══════════════════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # اسم المستخدم (فريد، لا يتكرر)
    username = Column(String, unique=True, nullable=False, index=True)
    
    # كلمة المرور المشفرة (لن ت​خزَ​ن أبداً كنص عادي)
    hashed_password = Column(String, nullable=False)
    
    # الدور/الصلاحية
    role = Column(String, default="receptionist")
    
    # هل الحساب نشط؟
    is_active = Column(Boolean, default=True)
    
    # تاريخ التسجيل
    created_at = Column(DateTime, default=datetime.now)