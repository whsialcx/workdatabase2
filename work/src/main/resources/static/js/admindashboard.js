//显示状态
function loadStatistics() {
    fetch('/api/books/statistics')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const stats = data.data;
                document.getElementById('bookCount').textContent = stats.bookCount;
                document.getElementById('userCount').textContent = stats.userCount;
                document.getElementById('borrowCount').textContent = stats.borrowCount;
                document.getElementById('overdueCount').textContent = stats.overdueCount;
            } 
            else {
                console.error('获取统计信息失败:', data.message);
                // 设置默认值
                document.getElementById('bookCount').textContent = '0';
                document.getElementById('userCount').textContent = '0';
                document.getElementById('borrowCount').textContent = '0';
                document.getElementById('overdueCount').textContent = '0';
            }
        })
        .catch(error => {
            console.error('获取统计信息时发生错误:', error);
            // 设置默认值
            document.getElementById('bookCount').textContent = '0';
            document.getElementById('userCount').textContent = '0';
            document.getElementById('borrowCount').textContent = '0';
            document.getElementById('overdueCount').textContent = '0';
        });
}

// 页面加载时检查登录状态和角色
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || role !== 'admin') {
        // 未登录或不是管理员，跳转到登录页
        alert('请使用管理员账号登录！');
        window.location.href = '/login';  // 修复：改为跳转到登录页
        return;
    }
    
    // 显示管理员信息
    document.getElementById('usernameDisplay').textContent = username;  // 修复：使用正确的变量名
    document.getElementById('adminInfoUsername').textContent = username;
    document.getElementById('loginTime').textContent = new Date().toLocaleString();
    loadStatistics();
});
function logout() 
{
    // 清除登录状态
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('userType');
    
    // 跳转到登录页
    alert('已退出登录');
    window.location.href = '/login';  // 修复：改为跳转到登录页
}