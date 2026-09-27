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

});
// ↑ هنا نغلق DOMContentLoaded
