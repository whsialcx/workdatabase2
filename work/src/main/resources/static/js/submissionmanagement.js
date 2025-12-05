let currentPage = 0;
let totalPages = 0;
let currentSubmissionId = null;
let currentStatusFilter = '';

// 获取管理员ID
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
                <strong>${submission.title}</strong>
                <div style="font-size: 0.9rem; color: #7f8c8d;">
                    作者: ${submission.author}${submission.category ? ` · ${submission.category}` : ''}
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
                // 移除 Content-Type，让浏览器自动设置
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
            }
        }
    } catch (error) {
        console.error('获取详情失败:', error);
    }
}

// 显示提交详情
function showSubmissionDetails(submission) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <div style="margin-bottom: 15px;">
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
        ${submission.reviewComment ? `
            <div style="margin-bottom: 15px;">
                <strong>审核意见:</strong> ${submission.reviewComment}
            </div>
        ` : ''}
        ${submission.reviewTime ? `
            <div style="margin-bottom: 15px;">
                <strong>审核时间:</strong> ${formatDate(submission.reviewTime)}
            </div>
        ` : ''}
    `;
    
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