let currentPage = 0;
let totalPages = 0;
let currentSubmissionId = null;
let currentStatusFilter = '';

// 获取管理员ID
function getAdminId() {
    // 首先检查是否有adminId
    let adminId = localStorage.getItem('adminId') || sessionStorage.getItem('adminId');
    console.log('原始adminId:', adminId);
    
    if (adminId) {
        // 如果是数字字符串，转换为数字
        const idNum = parseInt(adminId);
        if (!isNaN(idNum)) {
            console.log('使用数字adminId:', idNum);
            return idNum;
        }
        console.log('使用字符串adminId:', adminId);
        return adminId;
    }
    
    // 如果没有adminId，但role是admin，使用username作为标识
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    console.log('备选方案 - role:', role, 'username:', username);
    
    if (role === 'admin' && username) {
        console.log('使用用户名作为adminId:', username);
        return username;
    }
    
    console.log('未找到adminId');
    return null;
}

// 加载提交列表
async function loadSubmissions(page = 0) {
    const statusFilter = document.getElementById('statusFilter').value;
    currentStatusFilter = statusFilter;
    
    try {
        document.getElementById('submissionsList').innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> 加载中...
            </div>
        `;

        let url = `/api/admin/submissions?page=${page}&size=10`;
        if (statusFilter) {
            url += `&status=${statusFilter}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            displaySubmissions(result.submissions);
            updatePagination(result.currentPage, result.totalPages);
            updateStats();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('加载失败:', error);
        document.getElementById('submissionsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <div>加载失败: ${error.message}</div>
            </div>
        `;
    }
}

// 显示提交列表
function displaySubmissions(submissions) {
    const container = document.getElementById('submissionsList');
    
    if (!submissions || submissions.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <div>暂无提交记录</div>
            </div>
        `;
        return;
    }

    container.innerHTML = submissions.map(submission => `
        <div class="table-row">
            <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${submission.coverBase64 ? `
                        <div style="width: 40px; height: 50px; flex-shrink: 0;">
                            <img src="${submission.coverBase64}" 
                                 alt="封面" 
                                 style="width: 100%; height: 100%; 
                                        object-fit: cover; 
                                        border-radius: 4px;
                                        border: 1px solid #eee;"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA0MCA1MCIgZmlsbD0iI2Y1ZjVmNSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjVmNWY1IiBzdHJva2U9IiNlZWVlZWUiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjY2NjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+5qCHPC90ZXh0Pjwvc3ZnPg=='">
                        </div>
                    ` : `
                        <div style="width: 40px; height: 50px; 
                                    background: #f8f9fa; 
                                    border: 1px solid #eee;
                                    border-radius: 4px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: #999;">
                            <i class="fas fa-image"></i>
                        </div>
                    `}
                    <div>
                        <strong>${submission.title}</strong>
                        <div style="font-size: 0.9rem; color: #7f8c8d;">
                            作者: ${submission.author}${submission.category ? ` · ${submission.category}` : ''}
                        </div>
                    </div>
                </div>
            </div>
            <div>${submission.submitUser ? submission.submitUser.username : '未知用户'}</div>
            <div>${formatDate(submission.submitTime)}</div>
            <div>
                <span class="status-badge status-${submission.status.toLowerCase()}">
                    ${getStatusText(submission.status)}
                </span>
            </div>
            <div>${submission.reviewComment || '-'}</div>
            <div class="action-buttons">
                <button class="btn btn-view" onclick="viewSubmission(${submission.id})">
                    <i class="fas fa-eye"></i> 查看
                </button>
                ${submission.status === 'PENDING' ? `
                    <button class="btn btn-approve" onclick="openReviewModal(${submission.id}, true)">
                        <i class="fas fa-check"></i> 通过
                    </button>
                    <button class="btn btn-reject" onclick="openReviewModal(${submission.id}, false)">
                        <i class="fas fa-times"></i> 拒绝
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// 更新分页
function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pageInfo.textContent = `第 ${currentPage + 1} 页，共 ${totalPages} 页`;
    
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === totalPages - 1;
    
    currentPage = currentPage;
    totalPages = totalPages;
}

// 更新统计信息
async function updateStats() {
    try {
        const response = await fetch('/api/admin/submissions/pending-count');
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('pendingCount').textContent = result.pendingCount;
            // 这里可以添加其他统计信息的获取
        }
    } catch (error) {
        console.error('获取统计信息失败:', error);
    }
}

// 打开审核模态框
function openReviewModal(submissionId, isApprove) {
    currentSubmissionId = submissionId;
    const modal = document.getElementById('reviewModal');
    const title = document.getElementById('modalTitle');
    
    title.textContent = isApprove ? '通过审核' : '拒绝审核';
    modal.style.display = 'flex';
}

// 提交审核
async function submitReview(approved) {
    const comment = document.getElementById('reviewComment').value;
    const adminId = getAdminId();
    
    console.log('审核参数:', {
        submissionId: currentSubmissionId,
        approved: approved,
        comment: comment,
        adminId: adminId,
        adminIdType: typeof adminId
    });
    
    if (!adminId) {
        alert('请先登录管理员账号');
        return;
    }
    
    try {
        // 构建URL参数 - 使用更安全的方式
        let url = `/api/admin/submissions/${currentSubmissionId}/review?approved=${approved}`;
        if (comment) {
            url += `&comment=${encodeURIComponent(comment)}`;
        }
        
        console.log('请求URL:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'X-Admin-Id': adminId.toString()
            }
        });
        
        console.log('响应状态:', response.status);
        
        if (!response.ok) {
            let errorText;
            try {
                const errorResult = await response.json();
                errorText = JSON.stringify(errorResult);
            } catch {
                errorText = await response.text();
            }
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('响应结果:', result);
        
        if (result.success) {
            alert(result.message);
            closeModal();
            loadSubmissions(currentPage);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('审核失败详情:', error);
        alert('审核失败: ' + error.message);
    }
}

// 查看提交详情
async function viewSubmission(submissionId) {
    try {
        const response = await fetch(`/api/admin/submissions`);
        const result = await response.json();
        
        if (result.success) {
            const submission = result.submissions.find(s => s.id === submissionId);
            if (submission) {
                showSubmissionDetails(submission);
            } else {
                throw new Error('未找到该提交记录');
            }
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('获取详情失败:', error);
        alert('获取提交详情失败: ' + error.message);
    }
}

// 显示提交详情
function showSubmissionDetails(submission) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    let html = `
        <div style="margin-bottom: 20px;">
            <strong>图书标题:</strong> ${submission.title}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>作者:</strong> ${submission.author}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>类别:</strong> ${submission.category || '未分类'}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>ISBN:</strong> ${submission.isbn || '未提供'}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>出版社:</strong> ${submission.publisher || '未提供'}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>出版年份:</strong> ${submission.publishYear || '未提供'}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>描述:</strong> ${submission.description || '无描述'}
        </div>
    `;
    
    // 添加封面显示
    if (submission.coverBase64) {
        html += `
            <div style="margin-bottom: 20px;">
                <strong>封面预览:</strong>
                <div style="margin-top: 10px; text-align: center;">
                    <img src="${submission.coverBase64}" 
                         alt="封面图片" 
                         style="max-width: 300px; max-height: 400px; 
                                border: 1px solid #ddd; border-radius: 8px;
                                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                                background: #f8f9fa;"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9IiNmOGY5ZmEiPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjhmOWZhIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNjY2NjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77moYc8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIyMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2NjY2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPui/m+ihjOWbvuWGheWvvDwvdGV4dD48L3N2Zz4=';this.style.padding='20px'">
                </div>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #7f8c8d; text-align: center;">
                    <i class="fas fa-info-circle"></i> 用户上传的图书封面（Base64格式）
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>封面:</strong> 
                <span style="color: #7f8c8d;">
                    <i class="fas fa-image"></i> 未上传封面
                </span>
            </div>
        `;
    }
    
    html += `
        <div style="margin-bottom: 15px;">
            <strong>提交用户:</strong> ${submission.submitUser ? submission.submitUser.username : '未知用户'}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>提交时间:</strong> ${formatDate(submission.submitTime)}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>状态:</strong> <span class="status-badge status-${submission.status.toLowerCase()}">
                ${getStatusText(submission.status)}
            </span>
        </div>
    `;
    
    if (submission.reviewComment) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>审核意见:</strong> ${submission.reviewComment}
            </div>
        `;
    }
    
    if (submission.reviewTime) {
        html += `
            <div style="margin-bottom: 15px;">
                <strong>审核时间:</strong> ${formatDate(submission.reviewTime)}
            </div>
        `;
    }
    
    content.innerHTML = html;
    modal.style.display = 'flex';
}

// 关闭模态框
function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('reviewComment').value = '';
    currentSubmissionId = null;
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// 工具函数
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

function getStatusText(status) {
    const statusMap = {
        'PENDING': '待审核',
        'APPROVED': '已通过',
        'REJECTED': '已拒绝',
        'CANCELLED': '已取消'
    };
    return statusMap[status] || status;
}

// 验证base64图片数据
function validateBase64Image(base64String) {
    if (!base64String) return false;
    
    // 检查是否是合法的base64图片格式
    const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,[a-zA-Z0-9+/]+=*$/;
    return base64Pattern.test(base64String);
}

// 压缩图片（如果需要）
function compressImage(base64String, maxWidth = 800, maxHeight = 800) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // 计算缩放比例
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为JPEG格式，质量为0.8
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(compressedBase64);
        };
        
        img.onerror = reject;
        img.src = base64String;
    });
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || role !== 'admin') {
        alert('请使用管理员账号登录！');
        window.location.href = '/login';
        return;
    }

    const adminId = getAdminId();
    if (!adminId) {
        alert('请先登录管理员账号');
        window.location.href = '/login';
        return;
    }
    
    // 绑定事件
    document.getElementById('statusFilter').addEventListener('change', () => {
        loadSubmissions(0);
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadSubmissions(currentPage);
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 0) {
            loadSubmissions(currentPage - 1);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            loadSubmissions(currentPage + 1);
        }
    });

    document.getElementById('approveBtn').addEventListener('click', () => {
        submitReview(true);
    });

    document.getElementById('rejectBtn').addEventListener('click', () => {
        submitReview(false);
    });

    document.getElementById('cancelReviewBtn').addEventListener('click', closeModal);
    document.getElementById('closeDetailBtn').addEventListener('click', closeDetailModal);

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        const reviewModal = document.getElementById('reviewModal');
        const detailModal = document.getElementById('detailModal');
        
        if (e.target === reviewModal) {
            closeModal();
        }
        if (e.target === detailModal) {
            closeDetailModal();
        }
    });
    
    loadSubmissions();
});