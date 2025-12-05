let selectedUserType = 'user';

function selectUserType(type) {
    selectedUserType = type;
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 显示或隐藏管理员注册提示
    const adminNotice = document.getElementById('adminNotice');
    if (type === 'admin') 
    {
        adminNotice.style.display = 'block';
    } 
    else 
    {
        adminNotice.style.display = 'none';
    }
}

function register() 
{
    const regData = {
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        email: document.getElementById('regEmail').value,
        fullName: document.getElementById('regFullName').value,
        phone: document.getElementById('regPhone').value,
        userType: selectedUserType
    };

    // 基本验证
    if (!regData.username || !regData.password || !regData.email) {
        showResult('请填写必填字段（用户名、密码、邮箱）', false);
        return;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regData.email)) 
    {
        showResult('请输入有效的邮箱地址', false);
        return;
    }

    fetch('/api/auth/register', 
    {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(regData)
    })
    .then(response => response.json())
    .then(data => {
        showResult(data.message, data.success);
        
        if (data.success) {
            if (selectedUserType === 'user') {
                // 普通用户注册成功，3秒后跳转到登录页面
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
            // 管理员注册申请已提交，不需要自动跳转
        }
    })
    .catch(error => {
        showResult('注册请求失败: ' + error, false);
    });
}

function showResult(message, isSuccess) 
{
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result ' + (isSuccess ? 'success' : 'error');
    resultDiv.textContent = message;
    
    // 5秒后自动隐藏结果消息
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}

// 支持按回车键注册
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        register();
    }
});