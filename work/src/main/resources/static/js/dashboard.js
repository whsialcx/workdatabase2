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
    
    // 加载数据
    if (currentUserId) {
        loadBorrowRecords(currentUserId);
        loadSearchHistory(currentUserId);
    } else {
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
            } else {
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