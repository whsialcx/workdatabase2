document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('role');
    const currentUserId = localStorage.getItem('userId');
    
    // 严格的登录和角色检查
    if (!isLoggedIn || isLoggedIn !== 'true' || userRole !== 'user') {
        alert('请先以用户身份登录！');
        window.location.href = '/login';
        return;
    }
    
    // 填充页眉用户信息
    document.getElementById('usernameDisplay').textContent = username;
    const roleElement = document.getElementById('userRole');
    roleElement.textContent = userRole === 'admin' ? '管理员' : '用户';
    
    // 设置仪表板按钮链接
    const dashboardBtn = document.getElementById('dashboardBtn');
    dashboardBtn.href = '/user/dashboard';
    
    // 绑定事件监听器
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // 页面加载时载入用户设置
    loadUserSettings();
});

// 从服务器加载用户设置
async function loadUserSettings() {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        const response = await fetch(`/api/user/${userId}/settings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const settings = await response.json();
            
            // 填充设置表单
            document.getElementById('emailNotifications').checked = settings.emailNotifications || false;
            document.getElementById('appTheme').value = settings.appTheme || 'light';
            document.getElementById('appLanguage').value = settings.appLanguage || 'zh-CN';
            
            // 应用当前主题
            applyTheme(settings.appTheme);
        } else {
            console.error('加载设置失败:', response.status);
            // 使用默认设置
            loadDefaultSettings();
        }
    } catch (error) {
        console.error('加载设置时出错:', error);
        loadDefaultSettings();
    }
}

// 加载默认设置
function loadDefaultSettings() {
    const defaultSettings = {
        emailNotifications: false,
        appTheme: 'light',
        appLanguage: 'zh-CN'
    };
    
    document.getElementById('emailNotifications').checked = defaultSettings.emailNotifications;
    document.getElementById('appTheme').value = defaultSettings.appTheme;
    document.getElementById('appLanguage').value = defaultSettings.appLanguage;
}

// 保存设置到服务器
async function saveSettings() {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        const settings = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            appTheme: document.getElementById('appTheme').value,
            appLanguage: document.getElementById('appLanguage').value,
            updatedAt: new Date().toISOString()
        };
        
        const response = await fetch(`/api/user/${userId}/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('设置已保存！');
            
            // 应用新主题
            applyTheme(settings.appTheme);
            
            // 保存到本地存储作为缓存
            localStorage.setItem('userSettings', JSON.stringify(settings));
        } else {
            const error = await response.json();
            alert('保存设置失败: ' + (error.message || '未知错误'));
        }
    } catch (error) {
        console.error('保存设置时出错:', error);
        alert('保存设置时发生网络错误');
    }
}

// 应用主题
function applyTheme(theme) {
    const body = document.body;
    
    // 移除现有主题类
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'auto') {
        // 检测系统主题偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('theme-dark');
        } else {
            body.classList.add('theme-light');
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            body.classList.toggle('theme-dark', e.matches);
            body.classList.toggle('theme-light', !e.matches);
        });
    } else {
        body.classList.add(`theme-${theme}`);
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
    
    // 跳转到登录页
    alert('已退出登录');
    window.location.href = '/login';
}