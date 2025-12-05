document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('role');
    const currentUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    console.log('Profile页面认证检查:', { 
        username, 
        isLoggedIn, 
        userRole, 
        currentUserId, 
        hasToken: !!token 
    });
    
    // 修复认证检查逻辑 - 不再强制要求token，兼容现有系统
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('请先登录！');
        window.location.href = '/login';
        return;
    }
    
    // 填充页眉用户信息
    document.getElementById('usernameDisplay').textContent = username || '用户';
    const roleElement = document.getElementById('userRole');
    roleElement.textContent = userRole === 'admin' ? '管理员' : '用户';
    
    // 设置仪表板按钮链接
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (userRole === 'admin') {
        dashboardBtn.href = '/admin/admindashboard';
        dashboardBtn.textContent = '管理仪表板';
    } else {
        dashboardBtn.href = '/user/dashboard';
        dashboardBtn.textContent = '用户仪表板';
    }
    
    // 绑定事件监听器
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('passwordForm').addEventListener('submit', changePassword);
    
    // 加载用户资料
    loadUserProfile();
});

// 加载用户资料
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        
        // 构建请求头
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // 如果有token就添加到请求头
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        let userData = null;
        
        // 如果有用户ID，优先使用用户ID获取资料
        if (userId) {
            const response = await fetch(`/api/user/${userId}/profile`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                userData = await response.json();
                console.log('通过用户ID获取资料成功:', userData);
            } else {
                console.warn('通过用户ID获取资料失败，状态:', response.status);
            }
        }
        
        // 如果通过ID获取失败，尝试通过用户名获取
        if (!userData && username) {
            const response = await fetch(`/api/user/profile?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                userData = await response.json();
                console.log('通过用户名获取资料成功:', userData);
            } else {
                console.warn('通过用户名获取资料失败，状态:', response.status);
            }
        }
        
        // 填充表单数据
        if (userData) {
            document.getElementById('username').value = userData.username || username || '';
            document.getElementById('email').value = userData.email || '';
            
            // 更新本地存储的用户ID（如果获取到了）
            if (userData.id && !localStorage.getItem('userId')) {
                localStorage.setItem('userId', userData.id);
                console.log('更新本地存储的用户ID:', userData.id);
            }
        } else {
            // 使用本地存储的基本信息作为回退
            document.getElementById('username').value = username || '';
            console.warn('无法从服务器获取用户资料，使用本地信息');
        }
    } catch (error) {
        console.error('加载用户资料时出错:', error);
        // 使用本地存储的基本信息作为回退
        document.getElementById('username').value = localStorage.getItem('username') || '';
    }
}

// 保存个人资料
async function saveProfile(event) {
    event.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const email = document.getElementById('email').value.trim();
        
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            alert('请输入有效的邮箱地址！');
            return;
        }
        
        const profileData = {
            email: email,
            updatedAt: new Date().toISOString()
        };
        
        // 构建请求头
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        let response;
        let apiUrl;
        
        // 优先使用用户ID，如果没有则使用用户名
        if (userId) {
            apiUrl = `/api/user/${userId}/profile`;
            response = await fetch(apiUrl, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(profileData)
            });
        } else if (username) {
            apiUrl = `/api/user/profile?username=${encodeURIComponent(username)}`;
            response = await fetch(apiUrl, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(profileData)
            });
        } else {
            alert('无法保存：用户信息不完整');
            return;
        }
        
        console.log('保存个人资料请求:', { apiUrl, profileData });
        
        if (response.ok) {
            const result = await response.json();
            console.log('保存个人资料成功:', result);
            alert('个人资料已保存！');
        } else {
            const errorText = await response.text();
            console.error('保存个人资料失败:', response.status, errorText);
            let errorMessage = '保存个人资料失败';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                // 如果不是JSON格式，使用原始错误文本
                errorMessage = errorText || errorMessage;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('保存个人资料时出错:', error);
        alert('保存个人资料时发生网络错误');
    }
}

// 修改密码
async function changePassword(event) {
    event.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 客户端验证
        if (newPassword !== confirmPassword) {
            alert('新密码和确认密码不匹配！');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('新密码长度不能少于6位！');
            return;
        }
        
        if (oldPassword === newPassword) {
            alert('新密码不能与当前密码相同！');
            return;
        }

        const passwordData = {
            oldPassword: oldPassword,
            newPassword: newPassword
        };

        // 构建请求头
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        let response;
        let apiUrl;
        
        // 优先使用用户ID，如果没有则使用用户名
        if (userId) {
            apiUrl = `/api/user/${userId}/password`;
            response = await fetch(apiUrl, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(passwordData)
            });
        } else if (username) {
            apiUrl = `/api/user/password?username=${encodeURIComponent(username)}`;
            response = await fetch(apiUrl, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(passwordData)
            });
        } else {
            alert('无法修改密码：用户信息不完整');
            return;
        }
        
        console.log('修改密码请求:', { apiUrl });
        
        if (response.ok) {
            const result = await response.json();
            console.log('修改密码成功:', result);
            alert('密码修改成功！');
            
            // 清空表单
            document.getElementById('passwordForm').reset();
        } else {
            const errorText = await response.text();
            console.error('修改密码失败:', response.status, errorText);
            let errorMessage = '修改密码失败';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                // 如果不是JSON格式，使用原始错误文本
                errorMessage = errorText || errorMessage;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('修改密码时出错:', error);
        alert('修改密码时发生网络错误');
    }
}

// 退出登录功能
function logout() {
    // 清除所有本地存储
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('token');
    
    // 跳转到登录页
    alert('已退出登录');
    window.location.href = '/login';
}