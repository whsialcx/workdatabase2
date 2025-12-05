// 当前页和每页显示数量
let currentPage = 0; // Spring Data 分页从0开始
const booksPerPage = 10;
let totalPages = 0;
let currentSearchTerm = '';

// API基础URL
const API_BASE = '/api/books';

// 封面管理相关变量
let currentBookId = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 显示当前登录的管理员用户名
    const username = localStorage.getItem('username') || 'Admin';
    document.getElementById('usernameDisplay').textContent = username;
    
    // 初始化封面管理事件
    initCoverManagement();
    
    // 加载图书列表
    loadBooks();
});

// 初始化封面管理事件
function initCoverManagement() {
    // 封面输入框实时预览
    document.getElementById('coverBase64Input')?.addEventListener('input', previewCover);
    
    // 图片文件上传
    document.getElementById('coverFileInput')?.addEventListener('change', handleFileUpload);
    
    // 关闭封面模态框
    document.querySelectorAll('.cover-modal .close-btn, .cover-modal .btn-secondary').forEach(btn => {
        btn.addEventListener('click', closeCoverModal);
    });
}

// 加载图书列表
async function loadBooks() {
    try {
        showLoading();
        
        let url = `${API_BASE}?page=${currentPage}&size=${booksPerPage}`;
        if (currentSearchTerm) {
            url = `${API_BASE}/search?keyword=${encodeURIComponent(currentSearchTerm)}&page=${currentPage}&size=${booksPerPage}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('获取图书列表失败');
        }
        
        const data = await response.json();
        displayBooks(data.content);
        updatePagination(data.totalPages, data.number);
    } catch (error) {
        console.error('Error loading books:', error);
        showError('加载图书列表失败: ' + error.message);
    }
}

// 显示图书列表（带封面）
function displayBooks(books) {
    const booksList = document.getElementById('booksList');
    
    if (!books || books.length === 0) {
        booksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>暂无图书数据</h3>
                <p>点击"添加图书"按钮添加第一本图书</p>
            </div>
        `;
        return;
    }
    
    // 更新表头以包含封面列
    const booksHeader = document.querySelector('.books-header');
    if (booksHeader && !booksHeader.innerHTML.includes('封面')) {
        booksHeader.innerHTML = `
            <div>封面</div>
            <div>图书信息</div>
            <div>作者</div>
            <div>类别</div>
            <div>库存</div>
            <div>状态</div>
            <div>操作</div>
        `;
    }
    
    booksList.innerHTML = books.map(book => {
        // 安全处理封面数据
        let coverHtml = '';
        if (book.coverBase64) {
            coverHtml = `
                <div class="book-cover-cell">
                    <div class="book-cover-small" onclick="openCoverModal(${book.id}, '${escapeHtml(book.coverBase64)}')">
                        <img src="${escapeHtml(book.coverBase64)}" alt="封面" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIj5Db3ZlcjwvdGV4dD48L3N2Zz4=';">
                    </div>
                </div>`;
        } else {
            coverHtml = `
                <div class="book-cover-cell">
                    <div class="book-cover-small" onclick="openCoverModal(${book.id})">
                        <i class="fas fa-image" style="color: #ccc;"></i>
                    </div>
                </div>`;
        }
        
        return `
        <div class="book-item">
            ${coverHtml}
            <div class="book-info">
                <div class="book-title">${escapeHtml(book.title || '无标题')}</div>
                <div class="book-location">${escapeHtml(book.location || '未设置位置')}</div>
                ${book.introduction ? `<div class="book-intro">${escapeHtml(book.introduction.substring(0, 50))}...</div>` : ''}
            </div>
            <div class="book-author">${escapeHtml(book.author || '未知作者')}</div>
            <div class="book-category">${escapeHtml(book.category || '未分类')}</div>
            <div class="book-stock">${book.availableCount || 0}/${book.total || 0}</div>
            <div>
                <span class="book-status ${book.status === 'AVAILABLE' ? 'status-available' : 'status-borrowed'}">
                    ${book.status === 'AVAILABLE' ? '可借阅' : '已借出'}
                </span>
            </div>
            <div class="book-actions">
                <button class="action-btn edit-btn" onclick="editBook(${book.id})">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="action-btn cover-btn" onclick="openCoverModal(${book.id}, '${escapeHtml(book.coverBase64 || '')}')">
                    <i class="fas fa-image"></i> 封面
                </button>
                <button class="action-btn delete-btn" onclick="deleteBook(${book.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>`;
    }).join('');
}

// 转义HTML特殊字符
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

// 显示加载状态
function showLoading() {
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

// 显示错误信息
function showError(message) {
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>加载失败</h3>
            <p>${message}</p>
            <button class="nav-btn" onclick="loadBooks()" style="margin-top: 10px;">
                <i class="fas fa-redo"></i> 重新加载
            </button>
        </div>
    `;
}

// 更新分页控件
function updatePagination(totalPagesValue, currentPageValue) {
    totalPages = totalPagesValue;
    currentPage = currentPageValue;
    const pagination = document.getElementById('pagination');
    
    // 如果总页数小于等于1，不显示分页
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    if (currentPage > 0) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    } else {
        // 禁用状态的上—页按钮
        paginationHTML += `<button class="page-btn" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-chevron-left"></i></button>`;
    }
    
    // 生成页码按钮（最多显示5个页码）
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);
    
    // 如果当前页靠近开头
    if (startPage > 0) {
        paginationHTML += `<button class="page-btn" onclick="changePage(0)">1</button>`;
        if (startPage > 1) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="page-btn active">${i + 1}</button>`;
        } else {
            paginationHTML += `<button class="page-btn" onclick="changePage(${i})">${i + 1}</button>`;
        }
    }
    
    // 如果当前页靠近结尾
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
        paginationHTML += `<button class="page-btn" onclick="changePage(${totalPages - 1})">${totalPages}</button>`;
    }
    
    // 下一页按钮
    if (currentPage < totalPages - 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    } else {
        // 禁用状态的下一页按钮
        paginationHTML += `<button class="page-btn" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-chevron-right"></i></button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// 切换页面
function changePage(page) {
    currentPage = page;
    loadBooks();
}

// 搜索图书
function searchBooks() {
    currentSearchTerm = document.getElementById('searchInput').value.trim();
    currentPage = 0; // 搜索时重置到第一页
    loadBooks();
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchBooks();
    }
});

// 打开添加图书模态框
function openAddModal() {
    document.getElementById('modalTitle').textContent = '添加图书';
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    
    // 重置封面预览
    const coverPreview = document.getElementById('coverPreview');
    if (coverPreview) {
        coverPreview.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i></div>';
    }
    
    document.getElementById('bookModal').style.display = 'flex';
}

// 编辑图书
async function editBook(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`);
        if (!response.ok) {
            throw new Error('获取图书信息失败');
        }
        
        const result = await response.json();
        const book = result.book;
        
        document.getElementById('modalTitle').textContent = '编辑图书';
        document.getElementById('bookId').value = book.id;
        document.getElementById('bookTitle').value = book.title || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookCategory').value = book.category || '';
        document.getElementById('bookLocation').value = book.location || '';
        document.getElementById('bookTotal').value = book.total || 1;
        document.getElementById('bookIntroduction').value = book.introduction || '';
        
        if (book.publishTime) {
            const publishDate = new Date(book.publishTime).toISOString().split('T')[0];
            document.getElementById('bookPublishTime').value = publishDate;
        }
        
        // 更新封面预览
        const coverPreview = document.getElementById('coverPreview');
        if (coverPreview) {
            if (book.coverBase64) {
                coverPreview.innerHTML = `<img src="${escapeHtml(book.coverBase64)}" alt="图书封面" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div class=\"cover-placeholder\"><i class=\"fas fa-image\"></i></div>';">`;
            } else {
                coverPreview.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i></div>';
            }
        }
        
        document.getElementById('bookModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading book:', error);
        alert('加载图书信息失败: ' + error.message);
    }
}

// 关闭图书编辑模态框
function closeModal() {
    document.getElementById('bookModal').style.display = 'none';
}

// 保存图书（添加或更新）
async function saveBook() {
    const bookId = document.getElementById('bookId').value;
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const category = document.getElementById('bookCategory').value;
    const location = document.getElementById('bookLocation').value;
    const total = parseInt(document.getElementById('bookTotal').value);
    const publishTime = document.getElementById('bookPublishTime').value;
    const introduction = document.getElementById('bookIntroduction').value;
    
    // 基本验证
    if (!title || !author || !total) {
        alert('请填写必填字段');
        return;
    }
    
    if (total < 1) {
        alert('总数量必须大于0');
        return;
    }
    
    const bookData = {
        title,
        author,
        category,
        location,
        total,
        introduction,
        publishTime: publishTime ? new Date(publishTime).toISOString() : null
    };
    
    try {
        let response;
        if (bookId) {
            // 更新现有图书
            response = await fetch(`${API_BASE}/${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData)
            });
        } else {
            // 添加新图书
            response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookData)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '保存失败');
        }
        
        // 关闭模态框并刷新列表
        closeModal();
        loadBooks();
        
        // 显示成功消息
        alert(bookId ? '图书更新成功！' : '图书添加成功！');
    } catch (error) {
        console.error('Error saving book:', error);
        alert('保存失败: ' + error.message);
    }
}

// 删除图书
async function deleteBook(id) {
    if (!confirm('确定要删除这本图书吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('删除失败');
        }
        
        // 如果当前页没有数据了，回到上一页
        if (currentPage > 0 && document.querySelectorAll('.book-item').length === 1) {
            currentPage--;
        }
        
        loadBooks();
        alert('图书删除成功！');
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('删除失败: ' + error.message);
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        // 清除登录状态
        localStorage.removeItem('username');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        
        // 跳转到登录页
        window.location.href = '/login';
    }
}

// ============= 封面管理功能 =============

// 打开封面管理模态框
function openCoverModal(bookId, currentCover = null) {
    currentBookId = bookId;
    const modal = document.getElementById('coverModal');
    const previewLarge = document.getElementById('coverPreviewLarge');
    const coverTextarea = document.getElementById('coverBase64Input');
    const coverInfo = document.getElementById('coverInfo');
    
    // 重置文件输入
    const fileInput = document.getElementById('coverFileInput');
    if (fileInput) fileInput.value = '';
    
    // 设置当前封面预览
    if (currentCover && currentCover.trim() !== '') {
        previewLarge.innerHTML = `<img src="${escapeHtml(currentCover)}" alt="图书封面" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div class=\"cover-placeholder\"><i class=\"fas fa-image\"></i></div>';">`;
        coverTextarea.value = currentCover;
        coverInfo.textContent = '当前有封面，您可以更新或删除';
    } else {
        previewLarge.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i>暂无封面</div>';
        coverTextarea.value = '';
        coverInfo.textContent = '当前无封面，请上传封面图片';
    }
    
    modal.style.display = 'flex';
}

// 关闭封面模态框
function closeCoverModal() {
    document.getElementById('coverModal').style.display = 'none';
    currentBookId = null;
    
    // 清空输入
    const coverTextarea = document.getElementById('coverBase64Input');
    const fileInput = document.getElementById('coverFileInput');
    if (coverTextarea) coverTextarea.value = '';
    if (fileInput) fileInput.value = '';
}

// 预览base64图片
function previewCover() {
    const textarea = document.getElementById('coverBase64Input');
    const preview = document.getElementById('coverPreviewLarge');
    const base64 = textarea.value.trim();
    
    if (base64 && base64.startsWith('data:image')) {
        preview.innerHTML = `<img src="${escapeHtml(base64)}" alt="封面预览" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div class=\"cover-placeholder\"><i class=\"fas fa-image\"></i>图片格式错误</div>';">`;
    } else if (base64) {
        preview.innerHTML = '<div class="cover-placeholder"><i class="fas fa-exclamation-triangle"></i>请输入有效的Base64图片数据</div>';
    } else {
        preview.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i>暂无封面</div>';
    }
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.match('image.*')) {
        alert('请选择图片文件（JPEG, PNG, GIF等）');
        event.target.value = '';
        return;
    }
    
    // 验证文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const base64 = e.target.result;
        document.getElementById('coverBase64Input').value = base64;
        previewCover();
    };
    
    reader.onerror = function() {
        alert('读取文件失败，请重试');
        event.target.value = '';
    };
    
    reader.readAsDataURL(file);
}

// 上传封面
async function uploadCover() {
    const base64 = document.getElementById('coverBase64Input').value.trim();
    
    if (!base64 || !base64.startsWith('data:image')) {
        alert('请输入有效的Base64图片数据或以图片文件上传');
        return;
    }
    
    if (!currentBookId) {
        alert('无法找到当前图书');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${currentBookId}/cover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ coverBase64: base64 })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '上传失败');
        }
        
        closeCoverModal();
        loadBooks();
        alert('封面上传成功！');
    } catch (error) {
        console.error('Error uploading cover:', error);
        alert('上传失败: ' + error.message);
    }
}

// 删除封面
async function deleteCover() {
    if (!currentBookId) {
        alert('无法找到当前图书');
        return;
    }
    
    if (!confirm('确定要删除这个封面吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${currentBookId}/cover`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '删除失败');
        }
        
        closeCoverModal();
        loadBooks();
        alert('封面删除成功！');
    } catch (error) {
        console.error('Error deleting cover:', error);
        alert('删除失败: ' + error.message);
    }
}

// 复制Base64到剪贴板
function copyBase64ToClipboard() {
    const textarea = document.getElementById('coverBase64Input');
    const base64 = textarea.value.trim();
    
    if (!base64) {
        alert('没有可复制的Base64数据');
        return;
    }
    
    navigator.clipboard.writeText(base64).then(() => {
        alert('Base64数据已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    });
}

// 清空Base64输入
function clearBase64Input() {
    document.getElementById('coverBase64Input').value = '';
    previewCover();
}