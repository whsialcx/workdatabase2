// authordetail.js
let currentAuthorId = null;
let currentAuthorName = null;
let userRole = '';

// 页面加载时检查登录状态并加载作者详情
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    userRole = localStorage.getItem('role');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !username) {
        alert('请先登录！');
        window.location.href = '/login';
        return;
    }
    
    // 显示用户信息
    document.getElementById('usernameDisplay').textContent = username;
    document.getElementById('userRole').textContent = userRole === 'admin' ? '管理员' : '用户';
    
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (userRole === 'admin') {
        dashboardBtn.href = '/admin/admindashboard';
    } else {
        dashboardBtn.href = '/user/dashboard';
    }
    
    // 添加退出登录事件监听器
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // 从URL获取参数
    const urlParams = new URLSearchParams(window.location.search);
    const authorId = urlParams.get('id');
    const authorName = urlParams.get('name');
    
    if (authorId) {
        currentAuthorId = authorId;
        loadAuthorDetailById(authorId);
    } else if (authorName) {
        currentAuthorName = authorName;
        loadAuthorDetailByName(authorName);
    } else {
        alert('未指定作者');
        window.history.back();
    }
});

// 根据ID加载作者详情
function loadAuthorDetailById(authorId) {
    showLoading();
    
    // 同时获取作者信息和统计信息
    Promise.all([
        fetch(`/api/authors/${authorId}`).then(res => res.json()),
        fetch(`/api/authors/${authorId}/statistics`).then(res => res.json())
    ])
    .then(([authorData, statsData]) => {
        hideLoading();
        
        if (authorData.success) {
            displayAuthorDetail(authorData.author, statsData);
        } else {
            alert('加载作者信息失败: ' + authorData.message);
            window.history.back();
        }
    })
    .catch(error => {
        hideLoading();
        console.error('加载作者详情失败:', error);
        alert('加载作者详情失败，请稍后重试');
    });
}

// 根据姓名加载作者详情
function loadAuthorDetailByName(authorName) {
    showLoading();
    
    fetch(`/api/authors/search/name?name=${encodeURIComponent(authorName)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.exists && data.author.id) {
                    // 作者存在，加载完整信息
                    currentAuthorId = data.author.id;
                    loadAuthorDetailById(data.author.id);
                } else {
                    // 作者不存在，显示默认页面
                    hideLoading();
                    displayDefaultAuthorPage(authorName);
                }
            } else {
                hideLoading();
                alert('查询作者失败: ' + data.message);
            }
        })
        .catch(error => {
            hideLoading();
            console.error('查询作者失败:', error);
            displayDefaultAuthorPage(authorName);
        });
}

// 显示作者详情
function displayAuthorDetail(author, stats) {
    const authorContent = document.getElementById('authorContent');
    const defaultContent = document.getElementById('defaultContent');
    
    authorContent.style.display = 'block';
    defaultContent.style.display = 'none';
    
    // 基本信息
    document.getElementById('authorName').textContent = author.name || '未知作者';
    document.getElementById('authorNationality').textContent = author.nationality ? `国籍: ${author.nationality}` : '';
    document.getElementById('authorAge').textContent = getAgeInfo(author);
    document.getElementById('authorBookCount').textContent = `作品: ${author.bookCount || 0}部`;
    
    // 照片
    const authorPhoto = document.getElementById('authorPhoto');
    if (author.photoBase64 && author.photoBase64.trim().length > 0) {
        const base64 = author.photoBase64.trim();
        if (base64.startsWith('data:')) {
            authorPhoto.src = base64;
        } else {
            authorPhoto.src = 'data:image/jpeg;base64,' + base64;
        }
    }
    
    // 简介
    const biographyElement = document.getElementById('authorBiography');
    if (author.biography && author.biography.trim().length > 0) {
        biographyElement.textContent = author.biography;
    } else {
        biographyElement.textContent = '暂无作者简介。';
        biographyElement.style.color = '#7f8c8d';
        biographyElement.style.fontStyle = 'italic';
    }
    
    // 显示统计信息
    displayStatistics(stats);
    
    // 加载作者作品
    loadAuthorBooks(author.name);
}

// 显示默认作者页面（当作者不存在时）
function displayDefaultAuthorPage(authorName) {
    const authorContent = document.getElementById('authorContent');
    const defaultContent = document.getElementById('defaultContent');
    
    authorContent.style.display = 'none';
    defaultContent.style.display = 'block';
    
    document.getElementById('authorInfoMessage').textContent = 
        `系统中暂无作者"${authorName}"的详细信息。`;
    
    // 显示作者姓名
    const authorNameElement = document.getElementById('authorName');
    if (authorNameElement) {
        authorNameElement.textContent = authorName;
    }
    
    // 尝试获取作者的作品
    loadAuthorBooks(authorName);
}

// 计算年龄信息
function getAgeInfo(author) {
    if (!author.birthDate) return '';
    
    const birthDate = new Date(author.birthDate);
    let ageText;
    
    if (author.deathDate) {
        const deathDate = new Date(author.deathDate);
        const years = deathDate.getFullYear() - birthDate.getFullYear();
        ageText = `享年: ${years}岁（${birthDate.getFullYear()}-${deathDate.getFullYear()}）`;
    } else {
        const now = new Date();
        const years = now.getFullYear() - birthDate.getFullYear();
        ageText = `年龄: ${years}岁（生于${birthDate.getFullYear()}年）`;
    }
    
    return ageText;
}

// 显示统计信息
function displayStatistics(stats) {
    const statsSection = document.getElementById('statisticsSection');
    
    if (stats.success) {
        statsSection.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.bookCount || 0}</div>
                <div class="stat-label">作品数量</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.totalAvailableCount || 0}</div>
                <div class="stat-label">可借阅数量</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.totalBorrowCount || 0}</div>
                <div class="stat-label">借阅次数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.author.popularityScore ? stats.author.popularityScore.toFixed(1) : '0.0'}</div>
                <div class="stat-label">人气指数</div>
            </div>
        `;
    } else {
        statsSection.innerHTML = '<div class="empty-state">暂无统计信息</div>';
    }
}

// 加载作者作品
function loadAuthorBooks(authorName) {
    fetch(`/api/books/search?keyword=${encodeURIComponent(authorName)}&size=50`)
        .then(response => response.json())
        .then(data => {
            const booksSection = document.getElementById('booksSection');
            
            if (data.content && data.content.length > 0) {
                // 过滤出确认为该作者的作品
                const authorBooks = data.content.filter(book => 
                    book.author && book.author.includes(authorName)
                );
                
                if (authorBooks.length > 0) {
                    displayAuthorBooks(authorBooks);
                } else {
                    booksSection.innerHTML = '<div class="empty-state">暂无作品信息</div>';
                }
            } else {
                booksSection.innerHTML = '<div class="empty-state">暂无作品信息</div>';
            }
        })
        .catch(error => {
            console.error('加载作品失败:', error);
            document.getElementById('booksSection').innerHTML = 
                '<div class="empty-state">加载作品失败</div>';
        });
}

// 显示作者作品
function displayAuthorBooks(books) {
    const booksSection = document.getElementById('booksSection');
    
    booksSection.innerHTML = books.map(book => {
        const isAvailable = book.availableCount > 0;
        
        return `
        <div class="book-card" onclick="viewBookDetail('${book.id}')" style="cursor: pointer;">
            <div class="book-cover">
                <img src="${getBookCoverUrl(book)}" alt="${book.title}" 
                     onerror="this.src='/images/default-book-cover.jpg'">
            </div>
            <div class="book-info">
                <div class="book-title">${book.title || '未知标题'}</div>
                <div class="book-category">${book.category || '未分类'}</div>
                <div class="book-status ${isAvailable ? 'status-available' : 'status-borrowed'}">
                    ${isAvailable ? '可借阅' : '已借出'}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// 获取图书封面URL
function getBookCoverUrl(book) {
    if (book.coverBase64 && book.coverBase64.trim().length > 0) {
        const base64 = book.coverBase64.trim();
        return base64.startsWith('data:') ? base64 : 'data:image/png;base64,' + base64;
    } else if (book.coverImageOid && book.coverImageOid > 0) {
        return `/api/images/oid/${book.coverImageOid}`;
    } else {
        return '/images/default-book-cover.jpg';
    }
}

// 查看图书详情
function viewBookDetail(bookId) {
    window.location.href = `/bookdetail?id=${bookId}`;
}

// 编辑作者信息
function editAuthor() {
    if (userRole !== 'admin') {
        alert('只有管理员可以编辑作者信息');
        return;
    }
    
    const authorName = currentAuthorName || document.getElementById('authorName').textContent;
    alert(`编辑作者: ${authorName}\n\n管理员功能，将在后续版本中开放。`);
    // 这里可以打开编辑模态框或跳转到编辑页面
}

// 显示加载状态
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('authorContent').style.display = 'none';
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 退出登录
function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    alert('已退出登录');
    window.location.href = '/login';
}