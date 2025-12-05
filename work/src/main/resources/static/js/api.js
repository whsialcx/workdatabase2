// api.js - 全局API请求工具
class ApiClient {
    constructor() {
        this.baseURL = '/api';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    async request(url, options = {}) {
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(this.baseURL + url, config);
            
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('未授权访问');
            }
            
            return response;
        } catch (error) {
            if (error.message === '未授权访问') {
                throw error;
            }
            throw new Error(`网络请求失败: ${error.message}`);
        }
    }

    async get(url, options = {}) {
        const response = await this.request(url, { method: 'GET', ...options });
        return response.json();
    }

    async post(url, data, options = {}) {
        const response = await this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
        return response.json();
    }

    async put(url, data, options = {}) {
        const response = await this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
        return response.json();
    }

    async delete(url, options = {}) {
        const response = await this.request(url, { method: 'DELETE', ...options });
        return response.json();
    }

    handleUnauthorized() {
        this.clearAuthData();
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
    }

    clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        localStorage.removeItem('adminId');
        
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('name');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('userType');
        sessionStorage.removeItem('adminId');
    }

    // 检查认证状态
    checkAuth() {
        const token = localStorage.getItem('token');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (!token || !isLoggedIn || isLoggedIn !== 'true') {
            return false;
        }
        return true;
    }

    // 获取当前用户信息
    getCurrentUser() {
        return {
            username: localStorage.getItem('username'),
            role: localStorage.getItem('role'),
            userId: localStorage.getItem('userId'),
            token: localStorage.getItem('token')
        };
    }
}

// 创建全局实例
const apiClient = new ApiClient();

// 全局认证检查函数
function checkAuthentication(requiredRole = null) {
    // 检查token是否存在且有效
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!token || !isLoggedIn || isLoggedIn !== 'true') {
        console.warn('未检测到有效登录状态，跳转到登录页');
        alert('请先登录！');
        window.location.href = '/login';
        return false;
    }
    
    // 如果需要特定角色
    if (requiredRole) {
        const currentRole = localStorage.getItem('role');
        if (currentRole !== requiredRole) {
            console.warn(`权限不足: 需要 ${requiredRole}, 当前是 ${currentRole}`);
            alert(`需要${requiredRole === 'admin' ? '管理员' : '用户'}权限！`);
            // 根据当前角色跳转到对应首页
            if (currentRole === 'admin') {
                window.location.href = '/admin/admindashboard';
            } else {
                window.location.href = '/user/dashboard';
            }
            return false;
        }
    }
    
    return true;
}
// 全局退出登录函数
function logout() {
    apiClient.clearAuthData();
    alert('已退出登录');
    window.location.href = '/login';
}