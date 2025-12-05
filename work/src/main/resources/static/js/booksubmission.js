// 获取用户ID（从localStorage或sessionStorage）
function getUserId() {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

// 显示消息
function showMessage(message, type = 'success') {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `
        <div class="message ${type}">
            ${message}
        </div>
    `;
    
    // 5秒后自动消失
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}
document.getElementById('bookSubmissionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';

        const formData = new FormData(e.target);
        const submissionData = {
            title: formData.get('title'),
            author: formData.get('author'),
            category: formData.get('category'),
            isbn: formData.get('isbn'),
            publisher: formData.get('publisher'),
            publishYear: formData.get('publishYear') ? parseInt(formData.get('publishYear')) : null,
            description: formData.get('description')
        };
        if (!submissionData.title || !submissionData.author) {
            throw new Error('图书标题和作者为必填项');
        }
        
        const fileInput = document.getElementById('coverFile');
        const base64Input = document.getElementById('coverBase64Input');

        async function doSubmit(data) {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': getUserId()
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                showMessage(result.message, 'success');
                document.getElementById('bookSubmissionForm').reset();
            } else {
                throw new Error(result.message || '提交失败');
            }
        }
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = async function () {
                    submissionData.coverBase64 = reader.result; // data:image/...;base64,...
                    await doSubmit(submissionData);
                };
                reader.onerror = function () {
                    throw new Error('读取封面文件失败');
                };
                reader.readAsDataURL(file);
            } else if (base64Input && base64Input.value.trim()) {
                let b = base64Input.value.trim();
                if (!b.startsWith('data:')) {
                    b = 'data:image/png;base64,' + b;
                }
                submissionData.coverBase64 = b;
                await doSubmit(submissionData);
            } else {
                await doSubmit(submissionData);
            }
        } catch (error) {
        console.error('提交失败:', error);
        showMessage(error.message || '提交失败，请稍后重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});




// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', () => {
    const userId = getUserId();
    if (!userId) {
        showMessage('请先登录', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }
});