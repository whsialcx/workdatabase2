let currentUserId = null;

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role');
    currentUserId = localStorage.getItem('userId');
    
    console.log('Dashboard页面认证检查:', { 
        username, 
        isLoggedIn, 
        role, 
        currentUserId 
    });
    
    // 修复认证检查 - 与profile页面保持一致
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('请先登录！');
        window.location.href = '/login';
        return;
    }
    
    // 显示用户信息
    document.getElementById('usernameDisplay').textContent = username;
    document.getElementById('userInfoUsername').textContent = username;
    document.getElementById('loginTime').textContent = new Date().toLocaleString();
    
    // 绑定事件监听器
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('clearSearchHistoryBtn').addEventListener('click', clearSearchHistory);
    document.getElementById('viewAllSubmissionsBtn').addEventListener('click', viewAllSubmissions);
    // 加载数据
    if (currentUserId) 
    {
        loadBorrowRecords(currentUserId);
        loadSearchHistory(currentUserId);
        loadBookSubmissions(currentUserId);
    } 
    else
    {
        // 如果没有用户ID，通过用户名获取
        fetchUserIdByUsername(username);
    }
});

// 通过用户名获取用户ID
function fetchUserIdByUsername(username) {
    fetch(`/api/user/findbyusername?username=${encodeURIComponent(username)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }
            return response.json();
        })
        .then(user => {
            if (user && user.id) {
                currentUserId = user.id;
                localStorage.setItem('userId', user.id);
                loadBorrowRecords(user.id);
                loadSearchHistory(user.id);
                loadBookSubmissions(user.id);
            } 
            else {
                throw new Error('未找到用户信息');
            }
        })
        .catch(error => {
            console.error('获取用户ID失败:', error);
            document.getElementById('borrowRecords').innerHTML = 
                '<div class="no-records">无法加载借阅记录：用户信息不完整</div>';
            document.getElementById('searchHistoryList').innerHTML = 
                '<div class="no-records">无法加载搜索历史：用户信息不完整</div>';
        });
}


function loadBookSubmissions(userId) {
    console.log('开始加载图书提交记录，用户ID:', userId);
    
    // 显示加载中状态
    document.getElementById('bookSubmissionsList').innerHTML = 
        '<div class="no-records">加载中...</div>';
    
    // 调用API获取提交记录
    fetch(`/api/submissions/my?userId=${userId}&page=0&size=5`, {
        headers: {
            'X-User-Id': userId.toString()
        }
    })
    .then(response => {
        console.log('提交记录响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('提交记录API返回数据:', data);
        if (data.success && data.submissions) {
            console.log('成功加载提交记录，数量:', data.submissions.length);
            displayBookSubmissions(data.submissions);
        } else {
            console.log('无提交记录数据');
            document.getElementById('bookSubmissionsList').innerHTML = 
                '<div class="no-records">暂无图书提交记录</div>';
        }
    })
    .catch(error => {
        console.error('加载图书提交记录失败:', error);
        document.getElementById('bookSubmissionsList').innerHTML = 
            '<div class="no-records">加载失败，请稍后重试</div>';
    });
}

// 新增：显示图书提交记录
function displayBookSubmissions(submissions) {
    const submissionsContainer = document.getElementById('bookSubmissionsList');
    
    if (!submissions || submissions.length === 0) {
        submissionsContainer.innerHTML = '<div class="no-records">暂无图书提交记录</div>';
        return;
    }
    
    submissionsContainer.innerHTML = submissions.map(submission => {
        const submitTime = formatDateTime(submission.submitTime);
        const status = getSubmissionStatus(submission);
        const statusText = getStatusText(submission);
        const statusClass = getStatusClass(submission);
        
        return `
            <div class="submission-card" onclick="viewSubmissionDetail(${submission.id})">
                <div class="submission-info">
                    <div class="submission-title">${submission.title || '无标题'}</div>
                    <div class="submission-detail">
                        <strong>作者：</strong>${submission.author || '未知'}
                    </div>
                    <div class="submission-detail">
                        <strong>ISBN：</strong>${submission.isbn || '未提供'}
                    </div>
                    <div class="submission-detail">
                        <strong>提交时间：</strong>${submitTime}
                    </div>
                    <span class="submission-status ${statusClass}">${statusText}</span>
                </div>
                <div class="submission-actions">
                    ${status === 'pending' ? 
                        `<button class="submission-edit-btn" onclick="event.stopPropagation(); editSubmission(${submission.id})">
                            编辑
                        </button>` : ''}
                    ${status === 'pending' ? 
                        `<button class="submission-delete-btn" onclick="event.stopPropagation(); deleteSubmission(${submission.id})">
                            删除
                        </button>` : 
                        `<button class="submission-delete-btn" disabled>
                            已处理
                        </button>`}
                </div>
            </div>
        `;
    }).join('');
}

// 新增：获取提交状态
function getSubmissionStatus(submission) {
    if (submission.status) {
        return submission.status.toLowerCase();
    }
    
    // 如果没有status字段，根据其他字段判断
    if (submission.reviewTime) {
        return submission.approved ? 'approved' : 'rejected';
    }
    
    return 'pending';
}

// 新增：获取状态文本
function getStatusText(submission) {
    const status = getSubmissionStatus(submission);
    
    const statusMap = {
        'pending': '待审核',
        'approved': '审核通过',
        'rejected': '审核不通过',
        'processing': '处理中'
    };
    
    return statusMap[status] || '未知状态';
}

// 新增：获取状态CSS类
function getStatusClass(submission) {
    const status = getSubmissionStatus(submission);
    
    const classMap = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected',
        'processing': 'status-processing'
    };
    
    return classMap[status] || 'status-pending';
}

// 新增：查看提交详情
function viewSubmissionDetail(submissionId) {
    // 这里可以跳转到详情页面或显示模态框
    // 我们先简单实现一个跳转到详情页
    window.location.href = `/booksubmission/detail?id=${submissionId}`;
}

// 新增：编辑提交（只有待审核状态可以编辑）
function editSubmission(submissionId) {
    // 跳转到编辑页面
    window.location.href = `/booksubmission/edit?id=${submissionId}`;
}

// 新增：删除提交（只有待审核状态可以删除）
function deleteSubmission(submissionId) {
    if (!confirm('确定要删除这条提交记录吗？删除后不可恢复。')) {
        return;
    }
    
    // 这里需要调用删除接口，假设接口为 /api/submissions/{id}
    fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: {
            'X-User-Id': currentUserId.toString()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('提交记录已删除');
            loadBookSubmissions(currentUserId); // 重新加载
        } else {
            alert('删除失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('删除提交记录失败:', error);
        alert('删除失败，请稍后重试');
    });
}

// 新增：查看全部提交
function viewAllSubmissions() {
    // 跳转到提交记录列表页面
    window.location.href = '/booksubmission/list';
}

// 加载借阅记录
function loadBorrowRecords(userId) {
    fetch(`/api/user/borrowrecords/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取借阅记录失败');
            }
            return response.json();
        })
        .then(records => {
            displayBorrowRecords(records);
        })
        .catch(error => {
            console.error('加载借阅记录失败:', error);
            document.getElementById('borrowRecords').innerHTML = 
                '<div class="no-records">加载借阅记录失败，请稍后重试</div>';
        });
}

// 显示借阅记录
function displayBorrowRecords(records) {
    const recordsContainer = document.getElementById('borrowRecords');
    
    console.log('完整的借阅记录数据结构:', records);
    
    if (!records || records.length === 0) {
        recordsContainer.innerHTML = '<div class="no-records">暂无借阅记录</div>';
        return;
    }
    
    // 过滤出未归还的记录
    const activeRecords = records.filter(record => !record.returnDate);
    
    if (activeRecords.length === 0) {
        recordsContainer.innerHTML = '<div class="no-records">暂无未归还的图书</div>';
        return;
    }
    
    recordsContainer.innerHTML = activeRecords.map((record, index) => {
        const borrowDate = formatDate(record.borrowDate);
        const dueDateValue = record.datelineDate || record.dateLineDate || record.dateline || record.dueDate;
        const dueDate = formatDate(dueDateValue);
        
        const today = new Date();
        const dueDateObj = parseDate(dueDateValue);
        const isOverdue = dueDateObj && dueDateObj < today;
        const canRenew = !record.renewed;
        
        return `
            <div class="record-card">
                <div class="record-info">
                    <div class="record-title">${record.book ? record.book.title : '未知图书'}</div>
                    <div class="record-detail"><strong>作者：</strong>${record.book ? record.book.author : '未知'}</div>
                    <div class="record-detail"><strong>借阅日期：</strong>${borrowDate}</div>
                    <div class="record-detail ${isOverdue ? 'status-overdue' : 'status-normal'}">
                        <strong>应还日期：</strong>${dueDate} ${isOverdue ? '（已逾期）' : ''}
                    </div>
                    ${record.renewed ? '<div class="record-detail" style="color: #f39c12;"><strong>状态：</strong>已续借一次</div>' : ''}
                </div>
                <div class="record-actions">
                    <button class="return-btn" onclick="returnBook(${record.id}, '${record.book ? record.book.title : '未知图书'}')">
                        还书
                    </button>
                    <button class="renew-btn" 
                            onclick="renewBook(${record.id}, '${record.book ? record.book.title : '未知图书'}')" 
                            ${!canRenew ? 'disabled' : ''}>
                        ${canRenew ? '续借' : '已续借'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 加载搜索历史
function loadSearchHistory(userId) {
    console.log('开始加载搜索历史，用户ID:', userId);
    
    // 先显示加载中状态
    document.getElementById('searchHistoryList').innerHTML = 
        '<div class="no-records">加载中...</div>';
    
    // 使用模拟数据作为备选方案
    const mockHistory = [
        { id: 1, keyword: 'JavaScript编程', timestamp: Date.now() },
        { id: 2, keyword: 'Python数据分析', timestamp: Date.now() - 86400000 },
        { id: 3, keyword: '机器学习', timestamp: Date.now() - 172800000 },
        { id: 4, keyword: 'Web开发', timestamp: Date.now() - 259200000 }
    ];
    
    // 尝试调用API，如果失败则使用模拟数据
    fetch(`/api/search/history/withtime?userId=${userId}&limit=20`)
        .then(response => {
            console.log('搜索历史响应状态:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('搜索历史API返回数据:', data);
            if (data.success && data.history && data.history.length > 0) {
                console.log('成功加载搜索历史，数量:', data.history.length);
                displaySearchHistory(data.history);
            } else {
                console.log('无搜索历史数据，使用模拟数据');
                // 如果没有历史数据，使用模拟数据
                setTimeout(() => {
                    displaySearchHistory(mockHistory);
                }, 500);
            }
        })
        .catch(error => {
            console.error('加载搜索历史失败:', error);
            console.log('API调用失败，使用模拟数据');
            // API调用失败时使用模拟数据
            setTimeout(() => {
                displaySearchHistory(mockHistory);
            }, 500);
        });
}
// 显示搜索历史
function displaySearchHistory(history) {
    const searchHistoryContainer = document.getElementById('searchHistoryList');
    
    searchHistoryContainer.innerHTML = history.map(item => {
        const searchTime = formatDateTime(item.searchTime || item.timestamp);
        return `
            <div class="history-item" onclick="searchFromHistory('${item.keyword}')">
                <div class="history-content">
                    <div class="history-keyword">${item.keyword}</div>
                    <div class="history-time">搜索时间: ${searchTime}</div>
                </div>
                <div class="history-actions">
                    <button class="history-search-btn" onclick="event.stopPropagation(); searchFromHistory('${item.keyword}')">
                        搜索
                    </button>
                    <button class="history-delete-btn" onclick="event.stopPropagation(); deleteSearchHistoryItem('${item.id || item.keyword}')">
                        删除
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 清除搜索历史
function clearSearchHistory() {
    if (!currentUserId) return;
    
    if (!confirm('确定要清除所有搜索历史吗？')) {
        return;
    }
    
    fetch(`/api/search/history?userId=${currentUserId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('搜索历史已清除');
            document.getElementById('searchHistoryList').innerHTML = 
                '<div class="no-records">暂无搜索历史</div>';
        } else {
            alert('清除失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('清除搜索历史失败:', error);
        alert('清除搜索历史失败');
    });
}

// 删除单个搜索历史项
function deleteSearchHistoryItem(keywordOrId) {
    if (!currentUserId) return;
    
    if (!confirm('确定要删除这条搜索记录吗？')) {
        return;
    }
    
    fetch(`/api/search/history/item?userId=${currentUserId}&keyword=${encodeURIComponent(keywordOrId)}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('搜索记录已删除');
            loadSearchHistory(currentUserId); // 重新加载
        } else {
            alert('删除失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('删除搜索记录失败:', error);
        alert('删除搜索记录失败');
    });
}

// 从历史记录搜索
function searchFromHistory(keyword) {
    // 跳转到图书搜索页面并自动搜索
    localStorage.setItem('autoSearchKeyword', keyword);
    window.location.href = '/booksearch';
}

// 日期时间格式化函数
function formatDateTime(dateTimeString) {
    if (!dateTimeString) {
        return '未知时间';
    }
    
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            return '日期格式错误';
        }
        
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('日期时间格式化错误:', error);
        return '日期解析失败';
    }
}

// 原有的日期格式化函数
function formatDate(dateValue) {
    if (!dateValue) {
        return '未知日期';
    }
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return '日期格式错误';
        }
        
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.error('日期格式化错误:', error);
        return '日期解析失败';
    }
}

function parseDate(dateValue) {
    if (!dateValue) return null;
    
    try {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.error('日期解析错误:', error);
        return null;
    }
}

// 还书功能
function returnBook(borrowRecordId, bookTitle) {
    if (!confirm(`确定要归还《${bookTitle}》吗？`)) {
        return;
    }

    fetch(`/api/user/return/${borrowRecordId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        return response.text().then(errorMessage => {
            throw new Error(errorMessage || '还书请求失败');
        });
    })
    .then(data => {
        alert(`成功归还图书：《${bookTitle}》`);
        loadBorrowRecords(currentUserId); // 刷新列表
    })
    .catch(error => {
        console.error('还书失败:', error);
        alert(`归还《${bookTitle}》失败: ${error.message}`);
    });
}

// 续借功能
function renewBook(borrowRecordId, bookTitle) {
    if (!confirm(`确定要续借《${bookTitle}》吗？续借期限为30天。`)) {
        return;
    }

    fetch(`/api/user/renew/${borrowRecordId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        return response.text().then(errorMessage => {
            throw new Error(errorMessage || '续借请求失败');
        });
    })
    .then(data => {
        alert(`成功续借图书：《${bookTitle}》`);
        loadBorrowRecords(currentUserId); // 刷新列表
    })
    .catch(error => {
        console.error('续借失败:', error);
        alert(`续借《${bookTitle}》失败: ${error.message}`);
    });
}

function logout() {
    // 清除登录状态
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    // 跳转到登录页
    alert('已退出登录');
    window.location.href = '/login';
}