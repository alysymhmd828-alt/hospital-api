// ═══════════════════════════════════════════════════════
// انتظر حتى ت​حمَ​ل الصفحة بالكامل
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {

    // ═══════════════════════════════════════════════════════
    // كود صفحة تسجيل الدخول (يعمل فقط في صفحة login)
    // ═══════════════════════════════════════════════════════

    const loginForm = document.getElementById('loginForm');

    // إذا و​جد loginForm، نف​ذ كود تسجيل الدخول
    if (loginForm) {

        const messageDiv = document.getElementById('message');
        const submitBtn = document.querySelector('.btn-login');

        // ─── عند إرسال النموذج ───
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            messageDiv.className = 'message';
            messageDiv.textContent = '';

            submitBtn.disabled = true;
            submitBtn.textContent = 'جارٍ التحقق...';

            try {
                const formData = new URLSearchParams();
                formData.append('username', username);
                formData.append('password', password);

                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('access_token', data.access_token);

                    messageDiv.className = 'message success';
                    messageDiv.textContent = '✅ تم تسجيل الدخول! جارٍ التحويل...';

                    setTimeout(function() {
                        window.location.href = '/dashboard';
                    }, 1000);

                } else {
                    const error = await response.json();
                    messageDiv.className = 'message error';
                    messageDiv.textContent = '❌ ' + (error.detail || 'فشل تسجيل الدخول');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'تسجيل الدخول';
                }

            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ خطأ في الاتصال بالسيرفر';
                submitBtn.disabled = false;
                submitBtn.textContent = 'تسجيل الدخول';
            }
        });
    }
    // ↑ هنا نغلق شرط if (loginForm) بقوس }

    // ═══════════════════════════════════════════════════════
    // كود لوحة التحكم (يعمل فقط في صفحة dashboard)
    // ═══════════════════════════════════════════════════════

    const userInfo = document.getElementById('userInfo');

    if (userInfo) {

        const token = localStorage.getItem('access_token');

        if (!token) {
            window.location.href = '/';
        } else {
            fetch('/me', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => {
                if (!response.ok) {
                    localStorage.removeItem('access_token');
                    window.location.href = '/';
                    return;
                }
                return response.json();
            })
            .then(user => {
                if (user) {
                    userInfo.textContent = '👤 ' + user.username + ' (' + user.role + ')';
                }
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                window.location.href = '/';
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('access_token');
                window.location.href = '/';
            });
        }
    }
    // ↑ هنا نغلق شرط if (userInfo)
    // ═══════════════════════════════════════════════════════
// كود صفحة المرضى (patients.html)
// ═══════════════════════════════════════════════════════

const patientsBody = document.getElementById('patientsBody');
// ↑ إذا و​جد هذا العنصر، فنحن في صفحة المرضى

if (patientsBody) {
    // ─── جلب المرضى من الـ API ───
    loadPatients();
    
    // ─── دالة تحميل المرضى ───
    function loadPatients() {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            window.location.href = '/';
            return;
        }
        
        fetch('/patients/', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => {
            if (response.status === 401) {
                // ↑ التوكن منتهي
                localStorage.removeItem('access_token');
                window.location.href = '/';
                return;
            }
            return response.json();
        })
        .then(patients => {
            if (!patients) return;
            renderPatients(patients);
        })
        .catch(() => {
            patientsBody.innerHTML = 
                '<tr><td colspan="6" class="empty-message">❌ فشل تحميل البيانات</td></tr>';
        });
    }
    
    // ─── دالة عرض المرضى في الجدول ───
    function renderPatients(patients) {
        // إذا كانت القائمة فارغة
        if (patients.length === 0) {
            patientsBody.innerHTML = 
                '<tr><td colspan="6" class="empty-message">لا يوجد مرضى مسجلون حتى الآن</td></tr>';
            return;
        }
        
        // بناء صفوف الجدول
        let html = '';
        
        patients.forEach(function(patient) {
            // ↑ forEach: يمر​ على كل مريض في القائمة
            
            html += `
                <tr>
                    <td>${patient.id}</td>
                    <td>${patient.name}</td>
                    <td>${patient.age}</td>
                    <td>${patient.diagnosis}</td>
                    <td>${patient.created_at ? patient.created_at.slice(0, 10) : '-'}</td>
                    <td>
                        <button class="btn-delete" onclick="deletePatient(${patient.id})">
                            حذف
                        </button>
                    </td>
                </tr>
            `;
            // ↑ template literal: نص متعدد الأسطر باستخدام backticks
            // ↑ ${...}: ي​دخل قيمة متغير داخل النص
        });
        
        patientsBody.innerHTML = html;
    }
    
    // ─── دالة حذف مريض (ت​ستدعى من الزر) ───
    window.deletePatient = function(patientId) {
        // ↑ window.deletePatient: يجعل الدالة متاحة من onclick
        
        if (!confirm('هل أنت متأكد من حذف هذا المريض؟')) {
            // ↑ confirm: نافذة تأكيد
            return;
        }
        
        const token = localStorage.getItem('access_token');
        
        fetch('/patients/' + patientId, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => {
            if (response.ok) {
                // ─── إعادة تحميل الجدول ───
                loadPatients();
                
                // ─── عرض رسالة نجاح ───
                showPageMessage('✅ تم حذف المريض بنجاح', 'success');
            } else if (response.status === 403) {
                showPageMessage('❌ ليس لديك صلاحية الحذف (admin فقط)', 'error');
            } else {
                showPageMessage('❌ فشل الحذف', 'error');
            }
        })
        .catch(() => {
            showPageMessage('❌ خطأ في الاتصال بالسيرفر', 'error');
        });
    };
    
    // ─── دالة عرض رسالة في الصفحة ───
    function showPageMessage(text, type) {
        const msgDiv = document.getElementById('message');
        if (msgDiv) {
            msgDiv.className = 'message ' + type;
            msgDiv.textContent = text;
            
            // إخفاء الرسالة بعد 3 ثوان
            setTimeout(function() {
                msgDiv.className = 'message';
                msgDiv.textContent = '';
            }, 3000);
        }
    }
}
// ═══════════════════════════════════════════════════════
// كود صفحة إضافة مريض (add_patient.html)
// ═══════════════════════════════════════════════════════

const addPatientForm = document.getElementById('addPatientForm');

if (addPatientForm) {
    
    addPatientForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const age = parseInt(document.getElementById('age').value);
        const diagnosis = document.getElementById('diagnosis').value.trim();
        
        const messageDiv = document.getElementById('message');
        const submitBtn = document.getElementById('submitBtn');
        
        // ─── التحقق من البيانات ───
        if (!name || !age || !diagnosis) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ يرجى ملء جميع الحقول';
            return;
        }
        
        if (age < 0 || age > 150) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ العمر يجب أن يكون بين 0 و 150';
            return;
        }
        
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            window.location.href = '/';
            return;
        }
        
        // ─── تعطيل الزر ───
        submitBtn.disabled = true;
        submitBtn.textContent = 'جارٍ الحفظ...';
        
        try {
            const response = await fetch('/patients/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    name: name,
                    age: age,
                    diagnosis: diagnosis
                })
            });
            
            if (response.ok) {
                messageDiv.className = 'message success';
                messageDiv.textContent = '✅ تم حفظ المريض بنجاح! جارٍ التحويل...';
                
                setTimeout(function() {
                    window.location.href = '/patients_page';
                }, 1000);
                
            } else if (response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/';
                
            } else {
                const error = await response.json();
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ ' + (error.detail || 'فشل الحفظ');
                submitBtn.disabled = false;
                submitBtn.textContent = 'حفظ المريض';
            }
            
        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ خطأ في الاتصال بالسيرفر';
            submitBtn.disabled = false;
            submitBtn.textContent = 'حفظ المريض';
        }
    });
}
// ═══════════════════════════════════════════════════════
// كود صفحة الأطباء (doctors.html)
// ═══════════════════════════════════════════════════════

const doctorsBody = document.getElementById('doctorsBody');
// ↑ إذا و​جد هذا العنصر، فنحن في صفحة الأطباء

if (doctorsBody) {
    loadDoctors();
    
    function loadDoctors() {
        const token = localStorage.getItem('access_token');
        if (!token) { window.location.href = '/'; return; }
        
        // ─── جلب الأطباء والأقسام معاً ───
        Promise.all([
            // ↑ Promise.all: ينتظر كل الطلبات في نفس الوقت
            fetch('/doctors/', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()),
            fetch('/departments/', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json())
        ])
        .then(([doctors, departments]) => {
            // ↑ [doctors, departments]: فك النتائج
            
            // ─── بناء خريطة ID → اسم القسم ───
            const deptMap = {};
            departments.forEach(d => { deptMap[d.id] = d.name; });
            // ↑ مثال: {1: "القلب", 2: "العظام"}
            
            renderDoctors(doctors, deptMap);
        })
        .catch(() => {
            doctorsBody.innerHTML = '<tr><td colspan="5" class="empty-message">❌ فشل التحميل</td></tr>';
        });
    }
    
    function renderDoctors(doctors, deptMap) {
        if (doctors.length === 0) {
            doctorsBody.innerHTML = '<tr><td colspan="5" class="empty-message">لا يوجد أطباء</td></tr>';
            return;
        }
        
        let html = '';
        doctors.forEach(function(doctor) {
            const deptName = deptMap[doctor.department_id] || '-';
            // ↑ إذا لم يوجد القسم، نعرض "-"
            
            html += `
                <tr>
                    <td>${doctor.id}</td>
                    <td>${doctor.name}</td>
                    <td>${doctor.specialty}</td>
                    <td>${deptName}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteDoctor(${doctor.id})">حذف</button>
                    </td>
                </tr>
            `;
        });
        doctorsBody.innerHTML = html;
    }
    
    window.deleteDoctor = function(doctorId) {
        // ↑ window.deleteDoctor: لجعلها متاحة من onclick
        
        if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
        
        const token = localStorage.getItem('access_token');
        fetch('/doctors/' + doctorId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(response => {
            if (response.ok) {
                loadDoctors(); // إعادة تحميل الجدول
                showPageMsg('✅ تم الحذف بنجاح', 'success');
            } else if (response.status === 403) {
                showPageMsg('❌ ليس لديك صلاحية (admin فقط)', 'error');
            } else {
                showPageMsg('❌ فشل الحذف', 'error');
            }
        })
        .catch(() => showPageMsg('❌ خطأ في الاتصال', 'error'));
    };
}

// ═══════════════════════════════════════════════════════
// كود صفحة إضافة طبيب (add_doctor.html)
// ═══════════════════════════════════════════════════════

const addDoctorForm = document.getElementById('addDoctorForm');

if (addDoctorForm) {
    const token = localStorage.getItem('access_token');
    const deptSelect = document.getElementById('department_id');
    
    // ─── جلب الأقسام لملء القائمة المنسدلة ───
    fetch('/departments/', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r => r.json())
    .then(departments => {
        departments.forEach(dept => {
            const option = document.createElement('option');
            // ↑ createElement: ينشئ عنصر <option>
            
            option.value = dept.id;
            option.textContent = dept.name;
            deptSelect.appendChild(option);
            // ↑ appendChild: يضيفه إلى <select>
        });
    });
    
    // ─── عند حفظ الطبيب ───
    addDoctorForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const specialty = document.getElementById('specialty').value.trim();
        const department_id = parseInt(document.getElementById('department_id').value);
        
        const messageDiv = document.getElementById('message');
        const submitBtn = document.getElementById('submitBtn');
        
        if (!name || !specialty || !department_id) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ يرجى ملء جميع الحقول';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'جارٍ الحفظ...';
        
        try {
            const response = await fetch('/doctors/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, specialty, department_id })
                // ↑ JSON.stringify: يحو​ل الكائن إلى نص JSON
            });
            
            if (response.ok) {
                messageDiv.className = 'message success';
                messageDiv.textContent = '✅ تم الحفظ! جارٍ التحويل...';
                setTimeout(() => window.location.href = '/doctors_page', 1000);
            } else {
                const error = await response.json();
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ ' + (error.detail || 'فشل الحفظ');
                submitBtn.disabled = false;
                submitBtn.textContent = 'حفظ الطبيب';
            }
        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ خطأ في الاتصال';
            submitBtn.disabled = false;
            submitBtn.textContent = 'حفظ الطبيب';
        }
    });
}

// ═══════════════════════════════════════════════════════
// دالة مساعدة: عرض رسالة في الصفحة
// ═══════════════════════════════════════════════════════

function showPageMsg(text, type) {
    const msg = document.getElementById('message');
    if (msg) {
        msg.className = 'message ' + type;
        msg.textContent = text;
        setTimeout(() => {
            msg.className = 'message';
            msg.textContent = '';
        }, 3000);
    }
}
// ═══════════════════════════════════════════════════════
// كود صفحة المواعيد (appointments.html)
// ═══════════════════════════════════════════════════════

const appointmentsBody = document.getElementById('appointmentsBody');

if (appointmentsBody) {
    loadAppointments();
    
    function loadAppointments() {
        const token = localStorage.getItem('access_token');
        if (!token) { window.location.href = '/'; return; }
        
        // ─── جلب المواعيد والمرضى والأطباء معاً ───
        Promise.all([
            fetch('/appointments/', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()),
            fetch('/patients/', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()),
            fetch('/doctors/', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json())
        ])
        .then(([appointments, patients, doctors]) => {
            // ─── بناء خريطتين ───
            const patientMap = {};
            patients.forEach(p => { patientMap[p.id] = p.name; });
            
            const doctorMap = {};
            doctors.forEach(d => { doctorMap[d.id] = d.name; });
            
            renderAppointments(appointments, patientMap, doctorMap);
        })
        .catch(() => {
            appointmentsBody.innerHTML = '<tr><td colspan="7" class="empty-message">❌ فشل التحميل</td></tr>';
        });
    }
    
    function renderAppointments(appointments, patientMap, doctorMap) {
        if (appointments.length === 0) {
            appointmentsBody.innerHTML = '<tr><td colspan="7" class="empty-message">لا يوجد مواعيد</td></tr>';
            return;
        }
        
        let html = '';
        appointments.forEach(function(apt) {
            const patientName = patientMap[apt.patient_id] || 'مريض محذوف';
            const doctorName = doctorMap[apt.doctor_id] || 'طبيب محذوف';
            const date = apt.appointment_date ? apt.appointment_date.slice(0, 10) : '-';
            
            html += `
                <tr>
                    <td>${apt.id}</td>
                    <td>${patientName}</td>
                    <td>${doctorName}</td>
                    <td>${date}</td>
                    <td>${apt.status}</td>
                    <td>${apt.notes || '-'}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteAppointment(${apt.id})">حذف</button>
                    </td>
                </tr>
            `;
        });
        appointmentsBody.innerHTML = html;
    }
    
    window.deleteAppointment = function(aptId) {
        if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
        
        const token = localStorage.getItem('access_token');
        fetch('/appointments/' + aptId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(response => {
            if (response.ok) {
                loadAppointments();
                showPageMsg('✅ تم الحذف بنجاح', 'success');
            } else if (response.status === 403) {
                showPageMsg('❌ ليس لديك صلاحية (admin فقط)', 'error');
            } else {
                showPageMsg('❌ فشل الحذف', 'error');
            }
        })
        .catch(() => showPageMsg('❌ خطأ في الاتصال', 'error'));
    };
}

// ═══════════════════════════════════════════════════════
// كود صفحة حجز موعد (add_appointment.html)
// ═══════════════════════════════════════════════════════

const addAppointmentForm = document.getElementById('addAppointmentForm');

if (addAppointmentForm) {
    const token = localStorage.getItem('access_token');
    const patientSelect = document.getElementById('patient_id');
    const doctorSelect = document.getElementById('doctor_id');
    
    // ─── جلب المرضى والأطباء لملء القوائم ───
    fetch('/patients/', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r => r.json())
    .then(patients => {
        patients.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name + ' (عمر: ' + p.age + ')';
            patientSelect.appendChild(option);
        });
    });
    
    fetch('/doctors/', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r => r.json())
    .then(doctors => {
        doctors.forEach(d => {
            const option = document.createElement('option');
            option.value = d.id;
            option.textContent = d.name + ' - ' + d.specialty;
            doctorSelect.appendChild(option);
        });
    });
    
    // ─── عند حفظ الموعد ───
    addAppointmentForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const patient_id = parseInt(document.getElementById('patient_id').value);
        const doctor_id = parseInt(document.getElementById('doctor_id').value);
        const notes = document.getElementById('notes').value.trim();
        
        const messageDiv = document.getElementById('message');
        const submitBtn = document.getElementById('submitBtn');
        
        if (!patient_id || !doctor_id) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ يرجى اختيار المريض والطبيب';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'جارٍ الحجز...';
        
        try {
            const response = await fetch('/appointments/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    patient_id: patient_id,
                    doctor_id: doctor_id,
                    notes: notes || null
                })
            });
            
            if (response.ok) {
                messageDiv.className = 'message success';
                messageDiv.textContent = '✅ تم حجز الموعد! جارٍ التحويل...';
                    setTimeout(() => window.location.href = '/appointments_page', 1000);
                } else {
                    const error = await response.json();
                    messageDiv.className = 'message error';
                    messageDiv.textContent = '❌ ' + (error.detail || 'فشل الحجز');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'حجز الموعد';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ خطأ في الاتصال';
                submitBtn.disabled = false;
                submitBtn.textContent = 'حجز الموعد';
            }
        });
    }


});
// ↑ هنا نغلق DOMContentLoaded
