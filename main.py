# ═══════════════════════════════════════════════════════════
# ملف: main.py
# الوظيفة: مسارات API (Routes) لمشروع مستشفى العيسي
# ═══════════════════════════════════════════════════════════

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import engine, SessionLocal
import models

# إنشاء جميع الجداول في قاعدة البيانات تلقائياً عند التشغيل
# (إذا كانت موجودة، لا يفعل شيئاً)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="مستشفى العيسي API", version="4.0")


# ═══════════════════════════════════════════════════════════
# دالة مساعدة: ت​وف​ر جلسة قاعدة بيانات لكل طلب
# ═══════════════════════════════════════════════════════════
def get_db():
    db = SessionLocal()
    try:
        yield db    # تعطي الجلسة للطلب
    finally:
        db.close()  # تغلق الجلسة بعد انتهاء الطلب


# ═══════════════════════════════════════════════════════════
# قوالب البيانات (Pydantic Schemas)
# ═══════════════════════════════════════════════════════════

# ─── قوالب الأقسام ───
class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentResponse(DepartmentCreate):
    id: int
    class Config:
        from_attributes = True

# ─── قوالب الأطباء ───
class DoctorCreate(BaseModel):
    name: str
    specialty: str
    department_id: int

class DoctorResponse(DoctorCreate):
    id: int
    class Config:
        from_attributes = True

        # ─── قوالب الموظفين ───
class EmployeeCreate(BaseModel):
    name: str
    role: str
    phone: Optional[str] = None
    salary: Optional[float] = None
    department_id: Optional[int] = None

class EmployeeResponse(EmployeeCreate):
    id: int
    is_active: bool
    hire_date: datetime
    class Config:
        from_attributes = True

# ─── قوالب المرضى ───
class PatientCreate(BaseModel):
    name: str
    age: int
    diagnosis: str

class PatientResponse(PatientCreate):
    id: int
    class Config:
        from_attributes = True

# ─── قوالب المواعيد ───
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: Optional[datetime] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    status: str
    notes: Optional[str] = None
    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════
# المسارات الأساسية
# ═══════════════════════════════════════════════════════════

@app.get("/")
def read_root():
    return {"status": "ok", "message": "مستشفى العيسي API يعمل بنجاح"}


@app.get("/about")
def about():
    return {"name": "مستشفى العيسي", "version": "4.0"}


# ═══════════════════════════════════════════════════════════
# مسارات الأقسام (Departments)
# ═══════════════════════════════════════════════════════════

# إضافة قسم جديد
@app.post("/departments/", response_model=DepartmentResponse)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db)):
    new_dept = models.Department(name=dept.name, description=dept.description)
    db.add(new_dept)         # جه​ز الإضافة
    db.commit()              # احفظ في القاعدة
    db.refresh(new_dept)     # اقرأ البيانات (لجلب id)
    return new_dept


# عرض جميع الأقسام
@app.get("/departments/", response_model=List[DepartmentResponse])
def get_all_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()


# ═══════════════════════════════════════════════════════════
# مسارات الأطباء (Doctors)
# ═══════════════════════════════════════════════════════════

# إضافة طبيب جديد
@app.post("/doctors/", response_model=DoctorResponse)
def create_doctor(doc: DoctorCreate, db: Session = Depends(get_db)):
    # التحقق: هل القسم موجود؟
    department = db.query(models.Department).filter(
        models.Department.id == doc.department_id
    ).first()
    if not department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    
    new_doc = models.Doctor(
        name=doc.name,
        specialty=doc.specialty,
        department_id=doc.department_id
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


# عرض جميع الأطباء
@app.get("/doctors/", response_model=List[DoctorResponse])
def get_all_doctors(db: Session = Depends(get_db)):
    return db.query(models.Doctor).all()


# عرض أطباء قسم معين
@app.get("/departments/{dept_id}/doctors/", response_model=List[DoctorResponse])
def get_doctors_by_department(dept_id: int, db: Session = Depends(get_db)):
    return db.query(models.Doctor).filter(models.Doctor.department_id == dept_id).all()


# ═══════════════════════════════════════════════════════════
# مسارات المرضى (Patients)
# ═══════════════════════════════════════════════════════════

@app.post("/patients/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    new_patient = models.Patient(
        name=patient.name,
        age=patient.age,
        diagnosis=patient.diagnosis
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@app.get("/patients/", response_model=List[PatientResponse])
def get_all_patients(db: Session = Depends(get_db)):
    return db.query(models.Patient).all()


@app.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="المريض غير موجود")
    return patient


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="المريض غير موجود")
    db.delete(patient)
    db.commit()
    return {"msg": "تم حذف المريض بنجاح"}


# ═══════════════════════════════════════════════════════════
# مسارات المواعيد (Appointments)
# ═══════════════════════════════════════════════════════════

# حجز موعد جديد (يربط مريضاً بطبيب)
@app.post("/appointments/", response_model=AppointmentResponse)
def create_appointment(apt: AppointmentCreate, db: Session = Depends(get_db)):
    # التحقق: هل المريض موجود؟
    patient = db.query(models.Patient).filter(models.Patient.id == apt.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="المريض غير موجود")
    
    # التحقق: هل الطبيب موجود؟
    doctor = db.query(models.Doctor).filter(models.Doctor.id == apt.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="الطبيب غير موجود")
    
    # إنشاء الموعد
    new_apt = models.Appointment(
        patient_id=apt.patient_id,
        doctor_id=apt.doctor_id,
        notes=apt.notes,
        status="مؤكد"
    )
    if apt.appointment_date:
        new_apt.appointment_date = apt.appointment_date
    
    db.add(new_apt)
    db.commit()
    db.refresh(new_apt)
    return new_apt


# عرض جميع المواعيد
@app.get("/appointments/", response_model=List[AppointmentResponse])
def get_all_appointments(db: Session = Depends(get_db)):
    return db.query(models.Appointment).all()


# عرض مواعيد مريض معين
@app.get("/patients/{patient_id}/appointments/", response_model=List[AppointmentResponse])
def get_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    return db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient_id
    ).all()
# ═══════════════════════════════════════════════════════════
# مسارات الموظفين (Employees)
# ═══════════════════════════════════════════════════════════

# إضافة موظف جديد
@app.post("/employees/", response_model=EmployeeResponse)
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    new_emp = models.Employee(
        name=emp.name,
        role=emp.role,
        phone=emp.phone,
        salary=emp.salary,
        department_id=emp.department_id
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp


# عرض جميع الموظفين
@app.get("/employees/", response_model=List[EmployeeResponse])
def get_all_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).all()


# عرض موظفي دور معين (مثل: كل الممرضين)
@app.get("/employees/by-role/{role}", response_model=List[EmployeeResponse])
def get_employees_by_role(role: str, db: Session = Depends(get_db)):
    return db.query(models.Employee).filter(models.Employee.role == role).all()


# حذف موظف (تعيين غير نشط بدلاً من الحذف)
@app.delete("/employees/{emp_id}")
def deactivate_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    emp.is_active = False
    db.commit()
    return {"msg": "تم تعطيل الموظف (لم ي​حذف من القاعدة)"}