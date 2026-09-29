# 🏥 نظام إدارة مستشفى العيسي

نظام متكامل لإدارة المستشفيات، مبني بـ FastAPI و PostgreSQL، مع واجهة رسومية كاملة ومصادقة JWT.

![Python](https://img.shields.io/badge/Python-3.13-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 نظرة عامة

نظام إدارة مستشفى كامل يوف​ر:
- ✅ إدارة المرضى (إضافة، عرض، حذف)
- ✅ إدارة الأطباء والأقسام
- ✅ حجز المواعيد
- ✅ إدارة الموظفين (ممرضون، صيادلة، إداريون)
- ✅ مصادقة آمنة (JWT + bcrypt)
- ✅ نظام أدوار (admin, doctor, receptionist)
- ✅ واجهة ويب عربية بالكامل

---

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **FastAPI** | إطار العمل الأساسي للـ API |
| **PostgreSQL** | قاعدة البيانات |
| **SQLAlchemy** | ORM للتعامل مع القاعدة |
| **Pydantic** | التحقق من البيانات |
| **JWT** | المصادقة |
| **bcrypt** | تشفير كلمات المرور |
| **Jinja2** | قوالب HTML |
| **HTML/CSS/JS** | الواجهة الأمامية |

---

## 📁 بنية المشروع
snippets_api/
├── main.py                    # نقطة الدخول + مسارات API
├── database.py                # إعداد الاتصال بقاعدة البيانات
├── models.py                  # جداول قاعدة البيانات
├── auth.py                    # المصادقة والتوكن
├── .env                       # المتغيرات السرية (غير مرفوع)
├── .gitignore                 # الملفات المستثناة من Git
├── requirements.txt           # المكتبات المطلوبة
├── README.md                  # هذا الملف
├── templates/                 # قوالب HTML
│   ├── login.html             # تسجيل الدخول
│   ├── dashboard.html         # لوحة التحكم
│   ├── patients.html          # عرض المرضى
│   ├── add_patient.html       # إضافة مريض
│   ├── doctors.html           # عرض الأطباء
│   ├── add_doctor.html        # إضافة طبيب
│   ├── appointments.html      # عرض المواعيد
│   └── add_appointment.html   # حجز موعد
└── static/                    # الملفات الثابتة
├── style.css              # التصميم
└── app.js                 # JavaScript

---

## 🗄️ مخطط قاعدة البيانات

### الجداول:

**1. `departments` (الأقسام)**
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | Integer | المفتاح الأساسي |
| name | String | اسم القسم |
| description | String | وصف القسم |

**2. `doctors` (الأطباء)**
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | Integer | المفتاح الأساسي |
| name | String | اسم الطبيب |
| specialty | String | التخصص |
| department_id | ForeignKey | القسم |

**3. `employees` (الموظفون)**
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | Integer | المفتاح الأساسي |
| name | String | الاسم |
| role | String | الوظيفة |
| salary | Float | الراتب |
| is_active | Boolean | نشط؟ |

**4. `patients` (المرضى)**
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | Integer | المفتاح الأساسي |
| name | String | الاسم |
| age | Integer | العمر |
| diagnosis | String | التشخيص |
| created_at | DateTime | تاريخ التسجيل |

**5. `appointments` (المواعيد)**
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | Integer | المفتاح الأساسي |
| patient_id | ForeignKey | المريض |
| doctor_id | ForeignKey | الطبيب |
| appointment_date | DateTime | التاريخ |
| status | String | الحالة |

**6. `users` (المستخدمون)**
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | Integer | المفتاح الأساسي |
| username | String | اسم المستخدم |
| hashed_password | String | كلمة المرور المشفرة |
| role | String | الدور |

### العلاقات:
- قسم واحد → أطباء كثيرون
- قسم واحد → موظفون كثيرون
- مريض واحد → مواعيد كثيرة
- طبيب واحد → مواعيد كثيرة

---

## 🚀 التثبيت والتشغيل

### المتطلبات:
- Python 3.10+
- PostgreSQL 14+

### الخطوات:

```bash
# 1. استنسخ المشروع
git clone https://github.com/alysymhmd828-alt/hospital-api.git
cd hospital-api

# 2. أنشئ بيئة افتراضية
python -m venv venv
venv\Scripts\activate

# 3. ثب​ت المكتبات
pip install -r requirements.txt

# 4. أنشئ ملف .env
# أضف فيه:
# DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/hospital
# SECRET_KEY=your-secret-key

# 5. أنشئ قاعدة البيانات في pgAdmin باسم: hospital

# 6. شغ​ل السيرفر
uvicorn main:app --reload
