let userRole = ''; 
let currentUserId = null;

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    userRole = localStorage.getItem('role'); 
    currentUserId = localStorage.getItem('userId'); // 获取用户ID
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !username) {
        alert('请先登录！');
        window.location.href = '/login';
        return;
    }
    
    // 显示用户信息
    document.getElementById('usernameDisplay').textContent = username;
    const roleElement = document.getElementById('userRole');
    roleElement.textContent = userRole === 'admin' ? '管理员' : '用户';
    
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (userRole === 'admin') {
        dashboardBtn.href = '/admin/admindashboard';
    } else {
        dashboardBtn.href = '/user/dashboard';
    }
    
    // 添加事件监听器
    document.getElementById('searchBtn').addEventListener('click', searchBooks);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('refreshHotBtn').addEventListener('click', loadHotSearch);
    
    // 支持按回车键搜索
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBooks();
        }
    });
    
    // 默认加载所有图书和热门搜索
    loadAllBooks();
    loadHotSearch();
    
    // 检查是否有自动搜索关键词（从仪表盘跳转过来）
    const autoSearchKeyword = localStorage.getItem('autoSearchKeyword');
    if (autoSearchKeyword) {
        document.getElementById('searchInput').value = autoSearchKeyword;
        searchBooks();
        localStorage.removeItem('autoSearchKeyword'); // 清除自动搜索标记
    }
});

// 加载热门搜索
function loadHotSearch() {
    const hotKeywordsContainer = document.getElementById('hotKeywords');
    const refreshBtn = document.getElementById('refreshHotBtn');
    
    // 显示加载状态
    refreshBtn.innerHTML = '<div class="loading"></div>';
    
    fetch('/api/search/hot?topN=10')
        .then(response => response.json())
        .then(data => {
            refreshBtn.textContent = '刷新';
            
            if (data.success && data.hotKeywords && data.hotKeywords.length > 0) {
                displayHotKeywords(data.hotKeywords);
            } else {
                hotKeywordsContainer.innerHTML = '<div class="empty-state">暂无热门搜索数据</div>';
            }
        })
        .catch(error => {
            console.error('加载热门搜索失败:', error);
            refreshBtn.textContent = '刷新';
            hotKeywordsContainer.innerHTML = '<div class="empty-state">加载热门搜索失败</div>';
        });
}

// 显示热门搜索关键词
function displayHotKeywords(hotKeywords) {
    const hotKeywordsContainer = document.getElementById('hotKeywords');
    
    hotKeywordsContainer.innerHTML = hotKeywords.map((item, index) => {
        const rankClass = index < 3 ? ' top-rank' : '';
        return `
            <div class="hot-keyword${rankClass}" onclick="searchByKeyword('${item.keyword}')">
                ${index < 3 ? '' : ''} ${item.keyword}
                <span class="count">${Math.round(item.count)}</span>
            </div>
        `;
    }).join('');
}

// 通过关键词搜索（用于热门搜索的点击）
function searchByKeyword(keyword) {
    document.getElementById('searchInput').value = keyword;
    searchBooks();
}

// 搜索图书（已集成热门搜索记录）
function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    // 准备请求头，包含用户ID用于记录搜索历史
    const headers = {};
    if (currentUserId) {
        headers['X-User-Id'] = currentUserId;
    }
    
    if (!searchTerm) {
        loadAllBooks();
        return;
    }
    
    // 显示搜索中的状态
    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.textContent;
    searchBtn.textContent = '搜索中...';
    searchBtn.disabled = true;
    
    fetch(`/api/books/search?keyword=${encodeURIComponent(searchTerm)}`, { 
        headers: headers 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('搜索请求失败');
        }
        return response.json();
    })
    .then(data => {
        displayBooks(data.content);
    })
    .catch(error => {
        console.error('搜索失败:', error);
        document.getElementById('booksList').innerHTML = '<p class="empty-state">搜索失败，请稍后重试</p>';
    })
    .finally(() => {
        // 恢复按钮状态
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
    });
}

// 加载所有图书
function loadAllBooks() {
    // 显示加载状态
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = '<div class="empty-state">加载中...</div>';
    
    fetch('/api/books?page=0&size=20')
        .then(response => response.json())
        .then(data => {
            displayBooks(data.content);
        })
        .catch(error => {
            console.error('加载图书失败:', error);
            booksList.innerHTML = '<p class="empty-state">加载图书失败，请稍后重试</p>';
        });
}

function borrowBook(bookId, bookTitle, event) {
    if (userRole === 'admin') {
        alert('管理员不能借阅图书！');
        return;
    }
    
    const username = localStorage.getItem('username');
    if (!username) {
        alert('未获取到用户名，无法借阅。请重新登录！');
        return;
    }

    // 禁用按钮防止重复点击
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = '借阅中...';

    // 使用用户名而不是用户ID
    const url = `/api/user/borrow/${bookId}/${encodeURIComponent(username)}`;
    
    console.log('Request URL (使用用户名):', url);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) {
            return response.json(); 
        } 
        return response.text().then(errorMessage => { 
            try {
                const errorJson = JSON.parse(errorMessage);
                throw new Error(errorJson.message || '借阅请求失败。');
            } catch (e) {
                throw new Error(errorMessage || `借阅失败，状态码: ${response.status}`);
            }
        });
    })
    .then(data => {
        alert(`恭喜！成功借阅图书：《${bookTitle}》`);
        // 成功后重新加载列表，更新可借数量
        loadAllBooks(); 
    })
    .catch(error => {
        console.error('借阅失败:', error);
        alert(`借阅《${bookTitle}》失败: ${error.message}`);
        // 失败后恢复按钮状态
        button.disabled = false;
        button.textContent = '借阅';
    });
}

// 显示图书列表
function displayBooks(books) {
    const booksList = document.getElementById('booksList');
    
    if (!books || books.length === 0) {
        booksList.innerHTML = '<p class="empty-state">没有找到相关图书</p>';
        return;
    }
    
    booksList.innerHTML = books.map(book => {
        // 判断是否可借：可借数量大于0
        const isAvailable = book.availableCount > 0;
        // 只有用户角色且有库存才能借阅
        const canBorrow = isAvailable && userRole !== 'admin';
        
        let buttonHtml;
        if (userRole === 'admin') {
            buttonHtml = `<button class="borrow-btn" disabled>管理员不可借</button>`;
        } else if (isAvailable) {
            buttonHtml = `<button class="borrow-btn" onclick="borrowBook('${book.id}', '${book.title}', event)">借阅</button>`;
        } else {
            buttonHtml = `<button class="borrow-btn" disabled>暂无库存</button>`;
        }

        return `
        <div class="book-card" onclick="viewBookDetail('${book.id}')" style="cursor: pointer;">
            <div>
                <div class="book-title">${book.title || '未知标题'}</div>
                <div class="book-info"><strong>作者:</strong> ${book.author || '未知'}</div>
                <div class="book-info"><strong>类别:</strong> ${book.category || '未分类'}</div>
                <div class="book-info"><strong>位置:</strong> ${book.location || '未知'}</div>
                <div class="book-info"><strong>可借数量:</strong> ${book.availableCount || 0}/${book.total || 0}</div>
                ${book.introduction ? `<div class="book-info" style="margin-top: 10px; font-size: 14px; color: #777;"><strong>简介:</strong> ${book.introduction.substring(0, 100)}${book.introduction.length > 100 ? '...' : ''}</div>` : ''}
            </div>
            <div class="card-actions">
                <div class="book-status ${isAvailable ? 'status-available' : 'status-borrowed'}">
                    ${isAvailable ? '可借阅' : '已借出/无库存'}
                </div>
                ${buttonHtml}
            </div>
        </div>
        `;
    }).join('');
}

function viewBookDetail(bookId) {
    window.location.href = `/bookdetail?id=${bookId}`;
}

function logout() {
    // 清除登录状态和用户信息
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('userId'); 
    
    // 跳转到登录页
    alert('已退出登录');
    window.location.href = '/login';
}