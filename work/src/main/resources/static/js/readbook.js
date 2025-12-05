// readbook.js - 新增的在线阅览页面JavaScript
let currentBookId = null;
let currentBookTitle = null;
let currentPage = 1;
let totalPages = 1;
let contentData = null;
let isTextContent = false;

// 页面加载
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('role');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !username) {
        alert('请先登录！');
        window.location.href = '/login';
        return;
    }
    
    // 显示用户信息
    document.getElementById('usernameDisplay').textContent = username;
    document.getElementById('userRole').textContent = userRole === 'admin' ? '管理员' : '用户';
    
    // 添加退出登录事件监听器
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // 从URL获取图书ID
    const urlParams = new URLSearchParams(window.location.search);
    currentBookId = urlParams.get('bookId');
    currentPage = parseInt(urlParams.get('page')) || 1;
    
    if (currentBookId) {
        loadBookContent();
    } else {
        alert('未找到图书ID');
        window.history.back();
    }
    
    // 绑定事件
    document.getElementById('prevPageBtn').addEventListener('click', goToPrevPage);
    document.getElementById('nextPageBtn').addEventListener('click', goToNextPage);
    document.getElementById('pageInput').addEventListener('change', goToPage);
    document.getElementById('searchBtn').addEventListener('click', searchInContent);
    document.getElementById('downloadBtn').addEventListener('click', downloadContent);
});

// 加载图书内容
function loadBookContent() {
    const userId = localStorage.getItem('userId');
    
    fetch(`/api/books/content/${currentBookId}/read?page=${currentPage}`, {
        headers: {
            'X-User-Id': userId
        }
    })
    .then(response => {
        if (response.status === 403) {
            throw new Error('您没有权限阅读此内容');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            contentData = data;
            displayBookContent(data);
        } else {
            throw new Error(data.message || '加载内容失败');
        }
    })
    .catch(error => {
        console.error('加载图书内容失败:', error);
        showError(error.message);
    });
}

// 显示图书内容
function displayBookContent(data) {
    const contentContainer = document.getElementById('contentContainer');
    const pdfViewer = document.getElementById('pdfViewer');
    const textViewer = document.getElementById('textViewer');
    const contentTypeDisplay = document.getElementById('contentTypeDisplay');
    
    // 显示内容类型
    contentTypeDisplay.textContent = getContentTypeName(data.contentType);
    
    // 设置图书标题
    document.getElementById('bookTitle').textContent = data.bookTitle || '图书内容';
    currentBookTitle = data.bookTitle;
    
    // 根据内容类型显示不同的查看器
    if (data.contentType === 'PDF') {
        isTextContent = false;
        textViewer.style.display = 'none';
        pdfViewer.style.display = 'block';
        
        // 使用PDF.js或直接嵌入
        displayPDF(data.filePath, data.fileName);
        
    } else if (['TXT', 'HTML', 'MARKDOWN'].includes(data.contentType)) {
        isTextContent = true;
        pdfViewer.style.display = 'none';
        textViewer.style.display = 'block';
        
        // 显示文本内容
        displayTextContent(data.content, data.contentType);
        
        // 设置分页信息
        if (data.totalPages) {
            totalPages = data.totalPages;
            updatePagination(data.currentPage, data.totalPages, data.hasNext);
        } else if (data.totalCharacters) {
            // 如果没有总页数，根据字符数计算
            totalPages = Math.ceil(data.totalCharacters / 2000);
            updatePagination(data.currentPage || currentPage, totalPages, data.hasNext);
        }
        
    } else {
        // 其他格式提示下载
        contentContainer.innerHTML = `
            <div class="unsupported-format">
                <i class="fas fa-file-download fa-3x"></i>
                <h3>此格式需要下载后查看</h3>
                <p>格式: ${getContentTypeName(data.contentType)}</p>
                <button class="btn btn-primary" onclick="downloadContent()">
                    <i class="fas fa-download"></i> 下载文件
                </button>
            </div>
        `;
    }
    
    // 显示下载按钮（如果允许下载）
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = data.allowDownload ? 'block' : 'none';
}

// 显示PDF内容
function displayPDF(filePath, fileName) {
    const pdfViewer = document.getElementById('pdfViewer');
    
    // 方法1：使用iframe嵌入
    pdfViewer.innerHTML = `
        <iframe src="/api/books/content/${currentBookId}/download" 
                width="100%" 
                height="700px"
                type="application/pdf">
            您的浏览器不支持PDF预览，请<a href="/api/books/content/${currentBookId}/download">下载</a>后查看
        </iframe>
    `;
    
    // 方法2：使用PDF.js（需要引入PDF.js库）
    // displayPDFWithJS(filePath);
}

// 显示文本内容
function displayTextContent(content, contentType) {
    const textViewer = document.getElementById('textViewer');
    
    // 根据内容类型进行格式化和高亮
    let formattedContent = content;
    
    if (contentType === 'HTML') {
        // 直接显示HTML
        formattedContent = content;
    } else if (contentType === 'MARKDOWN') {
        // 转换Markdown为HTML
        formattedContent = marked.parse(content);
    } else {
        // TXT格式：保留换行符
        formattedContent = content.replace(/\n/g, '<br>');
        formattedContent = `<div class="text-content">${formattedContent}</div>`;
    }
    
    textViewer.innerHTML = formattedContent;
    
    // 恢复搜索高亮
    restoreSearchHighlights();
}

// 更新分页控件
function updatePagination(currentPage, totalPages, hasNext) {
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('pageInput').value = currentPage;
    
    // 更新按钮状态
    document.getElementById('prevPageBtn').disabled = currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = !hasNext;
    
    // 更新URL（不刷新页面）
    const newUrl = `${window.location.pathname}?bookId=${currentBookId}&page=${currentPage}`;
    window.history.pushState({}, '', newUrl);
}

// 翻页功能
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadBookContent();
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadBookContent();
    }
}

function goToPage() {
    const pageInput = document.getElementById('pageInput');
    const page = parseInt(pageInput.value);
    
    if (page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        loadBookContent();
    } else {
        pageInput.value = currentPage;
    }
}

// 搜索内容
function searchInContent() {
    const keyword = document.getElementById('searchInput').value.trim();
    
    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }
    
    const userId = localStorage.getItem('userId');
    
    fetch(`/api/books/content/${currentBookId}/search?keyword=${encodeURIComponent(keyword)}`, {
        headers: {
            'X-User-Id': userId
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displaySearchResults(data.results, keyword);
        } else {
            alert('搜索失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('搜索失败:', error);
        alert('搜索失败');
    });
}

// 显示搜索结果
function displaySearchResults(results, keyword) {
    const searchResults = document.getElementById('searchResults');
    const searchModal = new bootstrap.Modal(document.getElementById('searchModal'));
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="text-center py-4">未找到相关结果</div>';
    } else {
        let html = '<div class="list-group">';
        
        results.forEach((result, index) => {
            html += `
                <a href="#" class="list-group-item list-group-item-action" 
                   onclick="goToSearchResult(${result.page}, ${result.position})">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">第 ${result.page} 页</h6>
                        <small>位置: ${result.position}</small>
                    </div>
                    <p class="mb-1">${result.context}</p>
                </a>
            `;
        });
        
        html += '</div>';
        searchResults.innerHTML = html;
    }
    
    // 在内容中高亮关键词
    highlightKeywords(keyword);
    
    searchModal.show();
}

// 高亮关键词
function highlightKeywords(keyword) {
    if (!isTextContent) return;
    
    const textViewer = document.getElementById('textViewer');
    const content = textViewer.innerHTML;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    const highlighted = content.replace(regex, '<span class="highlight">$1</span>');
    
    textViewer.innerHTML = highlighted;
}

// 恢复搜索高亮
function restoreSearchHighlights() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value.trim()) {
        highlightKeywords(searchInput.value.trim());
    }
}

// 跳转到搜索结果
function goToSearchResult(page, position) {
    // 计算大致的位置
    const estimatedPage = page;
    
    // 关闭模态框
    bootstrap.Modal.getInstance(document.getElementById('searchModal')).hide();
    
    // 跳转到对应页面
    currentPage = estimatedPage;
    loadBookContent();
    
    // 滚动到高亮位置
    setTimeout(() => {
        const highlighted = document.querySelector('.highlight');
        if (highlighted) {
            highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 500);
}

// 下载内容
function downloadContent() {
    const userId = localStorage.getItem('userId');
    
    fetch(`/api/books/content/${currentBookId}/download`, {
        headers: {
            'X-User-Id': userId
        }
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('下载失败');
    })
    .then(blob => {
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentBookTitle || 'book_content';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('下载失败:', error);
        alert('下载失败: ' + error.message);
    });
}

// 辅助函数
function getContentTypeName(type) {
    const typeNames = {
        'PDF': 'PDF文档',
        'EPUB': 'EPUB电子书',
        'TXT': '文本文件',
        'HTML': 'HTML文档',
        'MARKDOWN': 'Markdown文档'
    };
    return typeNames[type] || type;
}

function showError(message) {
    const contentContainer = document.getElementById('contentContainer');
    contentContainer.innerHTML = `
        <div class="error-container text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h3 class="mb-3">${message}</h3>
            <button class="btn btn-primary" onclick="window.history.back()">
                <i class="fas fa-arrow-left"></i> 返回上一页
            </button>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    alert('已退出登录');
    window.location.href = '/login';
}