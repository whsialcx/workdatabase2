let selectedUserType = 'user';

function selectUserType(type) {
    selectedUserType = type;
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const clickedBtn = event.currentTarget || event.target;
    clickedBtn.classList.add('active');
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'none';
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showResult('请输入用户名和密码', false);
        return;
    }

    // 显示加载界面
    showLoading();

    // 生成随机等待时间（0-3秒）
    const randomWaitTime = Math.random() * 3000;

    console.log(`随机等待时间: ${randomWaitTime}ms`);

    // 在随机等待后再发送登录请求
    setTimeout(() => {
        const loginData = {
            name: username,
            password: password,
            userType: selectedUserType
        };

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(loginData)
        })
        .then(response => response.json())
        .then(data => {
            // 隐藏加载界面
            hideLoading();
            showResult(data.message, data.success);
            
            if (data.success) {
                // 保存完整的登录信息到本地存储
                localStorage.setItem('username', data.name);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('role', data.role);
                localStorage.setItem('userType', selectedUserType);
                
                // 关键修复：保存token和userId
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                    console.log("登录成功，用户ID:", data.userId);
                    
                    // 新增：如果是管理员，同时保存为adminId
                    if (data.role === 'admin') {
                        localStorage.setItem('adminId', data.userId);
                        console.log("管理员登录，保存adminId:", data.userId);
                    }
                }
                
                // 同时保存到sessionStorage
                sessionStorage.setItem('name', data.name);
                sessionStorage.setItem('role', data.role);
                sessionStorage.setItem('userType', selectedUserType);
                if (data.token) {
                    sessionStorage.setItem('token', data.token);
                }
                if (data.userId && data.role === 'admin') {
                    sessionStorage.setItem('adminId', data.userId);
                }

                console.log("登录成功，用户名:", data.name, "角色:", data.role, "用户ID:", data.userId);
                        
                // 根据用户类型跳转到不同的页面
                setTimeout(() => {
                    if (data.role === 'admin') {
                        window.location.href = '/admin/admindashboard';
                    } else {
                        window.location.href = '/user/dashboard';
                    }
                }, 1000);
            }
        })
        .catch(error => {
            // 隐藏加载界面
            hideLoading();
            showResult('登录请求失败: ' + error, false);
        });
    }, randomWaitTime);
}

function showResult(message, isSuccess) {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result ' + (isSuccess ? 'success' : 'error');
    resultDiv.textContent = message;
}

// 支持按回车键登录
document.getElementById('loginPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        login();
    }
});

// 支持用户名按回车键跳转到密码框
document.getElementById('loginUsername').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginPassword').focus();
    }
});