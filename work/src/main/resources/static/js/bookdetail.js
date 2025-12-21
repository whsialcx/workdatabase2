
let userRole = '';
let currentUserId = null;
let currentBookId = null;
let currentBookData = null;

// 页面加载时检查登录状态并加载图书详情
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    userRole = localStorage.getItem('role');
    currentUserId = localStorage.getItem('userId');
    
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
    if (userRole === 'admin') 
    {
        dashboardBtn.href = '/admin/admindashboard';
    } 
    else 
    {
        dashboardBtn.href = '/user/dashboard';
    }
    
    // 添加退出登录事件监听器
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // 从URL获取图书ID并加载详情
    const urlParams = new URLSearchParams(window.location.search);
    currentBookId = urlParams.get('id');
    
    if (currentBookId) {
        loadBookDetail(currentBookId);
        loadRelatedBooks(currentBookId);
    } 
    else 
    {
        alert('未找到图书ID');
        window.location.href = '/booksearch';
    }
});

// 显示图书封面 - 统一使用oid接口 / 支持 base64 存储
function displayBookCover(book) {
    const coverElement = document.getElementById('bookCover');
    if (!coverElement) return;

    console.log('图书封面信息:', {
        coverBase64: book.coverBase64,
        coverImageOid: book.coverImageOid,
        imageStoreId: book.imageStoreId
    });

    // 如果有 coverBase64（来自数据库），优先使用
    if (book.coverBase64 && book.coverBase64.trim().length > 0) {
        const base64 = book.coverBase64.trim();
        // 如果已经包含 data: 前缀则直接使用，否则默认当作 png
        if (base64.startsWith('data:')) {
            coverElement.src = base64;
        } else {
            coverElement.src = 'data:image/png;base64,' + base64;
        }
        coverElement.onerror = setDefaultCoverImage;
        console.log('使用数据库 base64 封面');
        return;
    }

    // 其次，如果有 coverImageOid，使用OID接口
    if (book.coverImageOid && book.coverImageOid > 0) {
        coverElement.src = `/api/images/oid/${book.coverImageOid}`;
        coverElement.onerror = setDefaultCoverImage;
        console.log(`使用OID接口加载封面: /api/images/oid/${book.coverImageOid}`);
        return;
    }

    // 最后使用默认封面
    setDefaultCoverImage();
}

// 设置默认封面图片
function setDefaultCoverImage() {
    const coverElement = document.getElementById('bookCover');
    if (coverElement) {
        // 使用正确的默认图片路径
        coverElement.src = '/images/default-book-cover.jpg';
        coverElement.onerror = function() {
            // 如果默认图片也加载失败，显示占位符
            coverElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="350"><rect width="100%" height="100%" fill="%23667eea"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dy=".3em">No Cover</text></svg>';
        };
    }
}

// 加载图书详情
function loadBookDetail(bookId) {
    fetch(`/api/books/${bookId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('图书不存在');
            }
            return response.json();
        })
        .then(data => {
            // 检查响应是否成功
            if (data.success) {
                currentBookData = data.book;
                displayBookDetail(data.book);
                
                // 显示图书封面
                displayBookCover(data.book);
                
                // 如果是用户，检查是否已借阅此书
                if (userRole !== 'admin') {
                    checkUserBorrowStatus(bookId);
                }
            } else {
                throw new Error(data.message || '获取图书详情失败');
            }
        })
        .catch(error => {
            console.error('加载图书详情失败:', error);
            alert('加载图书详情失败: ' + error.message);
            window.location.href = '/booksearch';
        });
}

function viewAuthorDetail(authorName) {
    if (!authorName || authorName === '未知作者') {
        alert('作者信息不可用');
        return;
    }
    
    // 先查询作者是否存在
    fetch(`/api/authors/search/name?name=${encodeURIComponent(authorName)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.exists && data.author.id) {
                    // 作者存在，跳转到作者详情页
                    window.location.href = `/authordetail?id=${data.author.id}`;
                } else {
                    // 作者不存在，跳转到默认作者页并传递作者姓名
                    window.location.href = `/authordetail?name=${encodeURIComponent(authorName)}`;
                }
            } else {
                alert('查询作者失败: ' + data.message);
            }
        })
        .catch(error => {
            console.error('查询作者失败:', error);
            // 如果查询失败，也跳转到默认页面
            window.location.href = `/authordetail?name=${encodeURIComponent(authorName)}`;
        });
}

// 显示图书详情
function displayBookDetail(book) {
    // 基础信息
    document.getElementById('bookTitle').textContent = book.title || '未知标题';
    // document.getElementById('bookAuthor').textContent = book.author || '未知作者';

    document.getElementById('bookAuthor').innerHTML = `
        <a href="#" onclick="viewAuthorDetail('${book.author || '未知作者'}'); return false;" 
        style="color: #3498db; text-decoration: none; cursor: pointer;">
            ${book.author || '未知作者'}
        </a>
    `;
    document.getElementById('bookCategory').textContent = book.category || '未分类';
    document.getElementById('bookLocation').textContent = book.location || '未知位置';
    document.getElementById('availableCount').textContent = book.availableCount || 0;
    document.getElementById('totalCount').textContent = book.total || 0;
    
    // 时间信息
    if (book.publishTime) {
        document.getElementById('publishTime').textContent = new Date(book.publishTime).toLocaleDateString();
    }
    if (book.includeTime) {
        document.getElementById('includeTime').textContent = new Date(book.includeTime).toLocaleDateString();
    }
    
    // 状态和简介
    const statusElement = document.getElementById('bookStatus');
    const statusTextElement = document.getElementById('statusText');
    
    if (book.availableCount > 0) {
        statusElement.textContent = '可借阅';
        statusElement.className = 'book-status status-available';
        statusTextElement.textContent = '可借阅';
    } else {
        statusElement.textContent = '已借完';
        statusElement.className = 'book-status status-borrowed';
        statusTextElement.textContent = '已借完';
    }
    
    // 简介
    if (book.introduction) {
        document.getElementById('bookIntroduction').textContent = book.introduction;
    }
    
    // 设置借阅按钮状态
    const borrowBtn = document.getElementById('borrowBtn');
    if (userRole === 'admin') {
        borrowBtn.disabled = true;
        borrowBtn.textContent = '管理员不可借';
    } else if (book.availableCount <= 0) {
        borrowBtn.disabled = true;
        borrowBtn.textContent = '暂无库存';
    } else {
        borrowBtn.disabled = false;
        borrowBtn.textContent = '借阅';
    }
    
    // 添加在线阅读按钮（如果图书有在线内容）
    const readOnlineBtn = document.getElementById('readOnlineBtn');
    if (readOnlineBtn) {
        // 使用新的字段名
        if (book.hasOnlineContent === true) {
            readOnlineBtn.style.display = 'inline-block';
            readOnlineBtn.onclick = function() {
                // 检查用户是否有权限阅读
                checkReadingPermission(book.id);
            };
        } else {
            readOnlineBtn.style.display = 'none';
        }
    }
    
    // 加载借阅次数统计
    loadBorrowStatistics(book.id);
}


function checkReadingPermission(bookId) {
    const userId = localStorage.getItem('userId');
    
    // 直接跳转到阅读页面，权限检查在阅读页面进行
    window.location.href = `/readbook?bookId=${bookId}`;
}

// 检查用户借阅状态
function checkUserBorrowStatus(bookId) {
    if (userRole === 'admin') return;
    
    fetch(`/api/user/borrow/status/${bookId}?userId=${currentUserId}`)
        .then(response => {
            if (!response.ok) return null;
            return response.json();
        })
        .then(borrowRecord => {
            if (borrowRecord && !borrowRecord.returnDate) {
                // 用户已借阅此书且未归还
                showCurrentBorrowInfo(borrowRecord);
            }
        })
        .catch(error => {
            console.error('检查借阅状态失败:', error);
        });
}

// 显示当前借阅信息
function showCurrentBorrowInfo(borrowRecord) {
    const section = document.getElementById('currentBorrowSection');
    const renewBtn = document.getElementById('renewBtn');
    
    section.style.display = 'block';
    document.getElementById('borrowDate').textContent = new Date(borrowRecord.borrowDate).toLocaleDateString();
    document.getElementById('dueDate').textContent = new Date(borrowRecord.dateline).toLocaleDateString();
    
    const canRenew = !borrowRecord.renewed;
    document.getElementById('renewableStatus').textContent = canRenew ? '可续借' : '已续借过';
    document.getElementById('renewableStatus').style.color = canRenew ? '#27ae60' : '#e74c3c';
    
    if (canRenew) {
        renewBtn.style.display = 'block';
        renewBtn.disabled = false;
    } else {
        renewBtn.style.display = 'block';
        renewBtn.disabled = true;
        renewBtn.textContent = '已续借过';
    }
    
    // 隐藏借阅按钮
    document.getElementById('borrowBtn').style.display = 'none';
}

// 加载借阅统计
function loadBorrowStatistics(bookId) {
    fetch(`/api/books/${bookId}/statistics`)
        .then(response => {
            if (!response.ok) return;
            return response.json();
        })
        .then(stats => {
            if (stats && stats.borrowCount !== undefined) {
                document.getElementById('borrowCount').textContent = stats.borrowCount;
            }
        })
        .catch(error => {
            console.error('加载借阅统计失败:', error);
        });
}

// 借阅当前图书
function borrowCurrentBook() {
    if (!currentBookData) return;
    
    const username = localStorage.getItem('username');
    if (!username) {
        alert('未获取到用户名，无法借阅。请重新登录！');
        return;
    }

    const borrowBtn = document.getElementById('borrowBtn');
    borrowBtn.disabled = true;
    borrowBtn.textContent = '借阅中...';

    const url = `/api/user/borrow/${currentBookData.id}/${encodeURIComponent(username)}`;
    
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
        alert(`恭喜！成功借阅图书：《${currentBookData.title}》`);
        // 重新加载页面更新状态
        loadBookDetail(currentBookData.id);
    })
    .catch(error => {
        console.error('借阅失败:', error);
        alert(`借阅《${currentBookData.title}》失败: ${error.message}`);
        borrowBtn.disabled = false;
        borrowBtn.textContent = '借阅';
    });
}

// 续借图书
function renewBook() {
    if (!currentBookData) return;
    
    // 首先获取用户的借阅记录
    fetch(`/api/user/borrow/status/${currentBookData.id}?userId=${currentUserId}`)
        .then(response => {
            if (!response.ok) throw new Error('无法获取借阅记录');
            return response.json();
        })
        .then(borrowRecord => {
            if (!borrowRecord) throw new Error('未找到借阅记录');
            
            return fetch(`/api/user/renew/${borrowRecord.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('续借请求失败');
        })
        .then(data => {
            alert('续借成功！');
            // 重新加载页面更新状态
            loadBookDetail(currentBookData.id);
        })
        .catch(error => {
            console.error('续借失败:', error);
            alert(`续借失败: ${error.message}`);
        });
}

// 调试图片加载
function debugImageLoading() {
    const bookId = currentBookId;
    
    console.group('图片加载调试');
    console.log('当前图书ID:', bookId);
    
    // 获取图书详情以获取coverImageOid
    fetch(`/api/books/${bookId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.book) {
                const book = data.book;
                console.log('图书封面OID:', book.coverImageOid);
                
                if (book.coverImageOid && book.coverImageOid > 0) {
                    // 测试oid接口
                    console.log('测试 /api/images/oid/' + book.coverImageOid + ':');
                    fetch('/api/images/oid/' + book.coverImageOid)
                        .then(res => {
                            console.log('状态码:', res.status, '类型:', res.headers.get('content-type'));
                            return res.blob();
                        })
                        .then(blob => {
                            console.log('OID文件大小:', blob.size, '字节');
                            console.log('OID文件类型:', blob.type);
                            
                            // 创建图片预览
                            const url = URL.createObjectURL(blob);
                            const img = document.createElement('img');
                            img.src = url;
                            img.style.width = '200px';
                            img.style.border = '2px solid red';
                            img.onload = () => {
                                console.log('图片加载完成，尺寸:', img.naturalWidth + 'x' + img.naturalHeight);
                                URL.revokeObjectURL(url);
                            };
                            document.body.appendChild(img);
                        })
                        .catch(err => console.error('OID访问失败:', err));
                } else {
                    console.log('图书没有coverImageOid');
                }
            }
        })
        .catch(err => console.error('获取图书详情失败:', err));
    
    console.groupEnd();
}

// 加载相关图书
function loadRelatedBooks(bookId) {
    fetch(`/api/books/${bookId}/related`)
        .then(response => {
            if (!response.ok) return [];
            return response.json();
        })
        .then(relatedBooks => {
            displayRelatedBooks(relatedBooks);
        })
        .catch(error => {
            console.error('加载相关图书失败:', error);
        });
}

// 显示相关图书 - 统一使用oid接口
function displayRelatedBooks(books) {
    const container = document.getElementById('relatedBooks');
    
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无相关图书推荐</div>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <a href="/bookdetail?id=${book.id}" class="related-book-card">
            <div class="related-book-cover">
                <img src="${book.coverImageOid && book.coverImageOid > 0 ? `/api/images/oid/${book.coverImageOid}` : '/images/default-book-cover.jpg'}" 
                     alt="${book.title}" 
                     onerror="this.onerror=null; this.src='/images/default-book-cover.jpg'">
            </div>
            <div class="related-book-title">${book.title}</div>
            <div class="related-book-author">${book.author || '未知作者'}</div>
        </a>
    `).join('');
}

function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    alert('已退出登录');
    window.location.href = '/login';
}