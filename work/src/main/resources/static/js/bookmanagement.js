// 当前页和每页显示数量
let currentPage = 0; // Spring Data 分页从0开始
const booksPerPage = 10;
let totalPages = 0;
let currentSearchTerm = '';
let currentBookId = null;
// API基础URL
const API_BASE = '/api/books';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 显示当前登录的管理员用户名
    const username = localStorage.getItem('username') || 'Admin';
    document.getElementById('usernameDisplay').textContent = username;
    
    // 加载图书列表
    loadBooks();
});

// 加载图书列表
async function loadBooks() 
{
    try {
        showLoading();
        
        let url = `${API_BASE}?page=${currentPage}&size=${booksPerPage}`;
        if (currentSearchTerm) 
        {
            url = `${API_BASE}/search?keyword=${encodeURIComponent(currentSearchTerm)}&page=${currentPage}&size=${booksPerPage}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) 
        {
            throw new Error('获取图书列表失败');
        }
        
        const data = await response.json();
        displayBooks(data.content);
        updatePagination(data.totalPages, data.number);
    } 
    catch (error) {
        console.error('Error loading books:', error);
        showError('加载图书列表失败: ' + error.message);
    }
}

// 打开封面管理模态框
function openCoverModal(bookId, currentCover = null) {
    currentBookId = bookId;
    const modal = document.getElementById('coverModal');
    const previewLarge = document.getElementById('coverPreviewLarge');
    const coverTextarea = document.getElementById('coverBase64Input');
    
    // 设置当前封面预览
    if (currentCover) {
        previewLarge.innerHTML = `<img src="${currentCover}" alt="图书封面">`;
        coverTextarea.value = currentCover;
    } else {
        previewLarge.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i></div>';
        coverTextarea.value = '';
    }
    
    modal.style.display = 'flex';
}

// 预览base64图片
function previewCover() {
    const textarea = document.getElementById('coverBase64Input');
    const preview = document.getElementById('coverPreviewLarge');
    const base64 = textarea.value.trim();
    
    if (base64) {
        preview.innerHTML = `<img src="${base64}" alt="封面预览">`;
    } else {
        preview.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i></div>';
    }
}

// 上传封面
async function uploadCover() {
    const base64 = document.getElementById('coverBase64Input').value.trim();
    
    if (!base64) {
        alert('请输入Base64编码的图片数据');
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
async function deleteCover(bookId) {
    if (!confirm('确定要删除这个封面吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${bookId}/cover`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '删除失败');
        }
        
        loadBooks();
        alert('封面删除成功！');
    } catch (error) {
        console.error('Error deleting cover:', error);
        alert('删除失败: ' + error.message);
    }
}

// 关闭封面模态框
function closeCoverModal() {
    document.getElementById('coverModal').style.display = 'none';
    currentBookId = null;
}

// 显示图书列表
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
    
    booksList.innerHTML = books.map(book => `
        <div class="book-item">
            <div class="book-cover-cell">
                ${book.coverBase64 ? 
                    `<div class="book-cover-small" onclick="openCoverModal(${book.id}, '${book.coverBase64}')">
                        <img src="${book.coverBase64}" alt="封面">
                    </div>` : 
                    `<div class="book-cover-small" onclick="openCoverModal(${book.id})">
                        <i class="fas fa-image" style="color: #ccc;"></i>
                    </div>`
                }
            </div>
            <div class="book-info">
                <div class="book-title">${book.title || '无标题'}</div>
                <div class="book-location">${book.location || '未设置位置'}</div>
                ${book.introduction ? `<div class="book-intro">${book.introduction.substring(0, 50)}...</div>` : ''}
            </div>
            <div class="book-author">${book.author || '未知作者'}</div>
            <div class="book-category">${book.category || '未分类'}</div>
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
                <button class="action-btn" onclick="openCoverModal(${book.id}, '${book.coverBase64 || ''}')" style="background: #3498db;">
                    <i class="fas fa-image"></i> 封面
                </button>
                <button class="action-btn delete-btn" onclick="deleteBook(${book.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
    `).join('');
}

// 显示加载状态
function showLoading() 
{
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

// 显示错误信息
function showError(message) 
{
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
function updatePagination(totalPagesValue, currentPageValue) 
{
    totalPages = totalPagesValue;
    currentPage = currentPageValue;
    const pagination = document.getElementById('pagination');
    
    console.log('分页参数:', { 
        totalPages: totalPages, 
        currentPage: currentPage,
        totalPagesValue: totalPagesValue,
        currentPageValue: currentPageValue
    });
    
    // 如果总页数小于等于1，不显示分页
    if (totalPages <= 1) 
    {
        pagination.innerHTML = '';
        console.log('总页数 <= 1，隐藏分页');
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    if (currentPage > 0) 
    {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    } 
    else 
    {
        // 禁用状态的上—页按钮
        paginationHTML += `<button class="page-btn" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-chevron-left"></i></button>`;
    }
    
    // 生成页码按钮
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) 
        {
            paginationHTML += `<button class="page-btn active">${i + 1}</button>`;
        } 
        else 
        {
            paginationHTML += `<button class="page-btn" onclick="changePage(${i})">${i + 1}</button>`;
        }
    }
    
    // 下一页按钮
    if (currentPage < totalPages - 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    } 
    else 
    {
        // 禁用状态的下一页按钮
        paginationHTML += `<button class="page-btn" disabled style="opacity: 0.5; cursor: not-allowed;"><i class="fas fa-chevron-right"></i></button>`;
    }
    
    pagination.innerHTML = paginationHTML;
    console.log('生成的分页HTML:', paginationHTML);
}

// 切换页面
function changePage(page) 
{
    currentPage = page;
    loadBooks();
}

// 搜索图书
function searchBooks() 
{
    currentSearchTerm = document.getElementById('searchInput').value.trim();
    currentPage = 0; // 搜索时重置到第一页
    loadBooks();
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') 
    {
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
    coverPreview.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i></div>';
    
    // 设置封面按钮事件（使用临时ID）
    const tempBookId = 0;
    document.querySelector('.btn-upload-cover').onclick = function() {
        openCoverModal(tempBookId);
    };
    
    document.querySelector('.btn-delete-cover').onclick = function() {
        alert('请先保存图书，再删除封面');
    };
    
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
        if (book.coverBase64) {
            coverPreview.innerHTML = `<img src="${book.coverBase64}" alt="图书封面">`;
        } else {
            coverPreview.innerHTML = '<div class="cover-placeholder"><i class="fas fa-image"></i></div>';
        }
        
        // 设置封面按钮事件
        document.querySelector('.btn-upload-cover').onclick = function() {
            openCoverModal(book.id, book.coverBase64 || null);
        };
        
        document.querySelector('.btn-delete-cover').onclick = function() {
            deleteCover(book.id);
        };
        
        document.getElementById('bookModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading book:', error);
        alert('加载图书信息失败: ' + error.message);
    }
}

// 关闭模态框
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
    if (!title || !author || !total) 
    {
        alert('请填写必填字段');
        return;
    }
    
    if (total < 1) 
    {
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
function logout() 
{
    if (confirm('确定要退出登录吗？')) {
        // 清除登录状态
        localStorage.removeItem('username');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        
        // 跳转到登录页
        window.location.href = '/login';
    }
}

// 支持按回车键搜索
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchBooks();
    }
});