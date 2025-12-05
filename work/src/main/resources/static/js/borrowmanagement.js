document.addEventListener('DOMContentLoaded', () => {
    // 简单的管理员验证
    if (sessionStorage.getItem('role') !== 'admin') {
        alert('您没有权限访问此页面。');
        window.location.href = '/login';
        return;
    }

    const borrowTableBody = document.getElementById('borrowTableBody');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const statusFilter = document.getElementById('statusFilter');

    let currentPage = 0;
    let totalPages = 0;

    async function fetchBorrows(page = 0, status = 'all') {
        try {
            let url = `/api/admin/borrows?page=${page}&size=10`;
            if (status !== 'all') {
                url += `&status=${status}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('获取借阅列表失败');
            }
            const data = await response.json();
            
            renderTable(data.content);
            updatePagination(data);
        } catch (error) {
            console.error(error);
            borrowTableBody.innerHTML = `<tr><td colspan="8">加载失败: ${error.message}</td></tr>`;
        }
    }

    function renderTable(records) {
        borrowTableBody.innerHTML = '';
        if (records.length === 0) {
            borrowTableBody.innerHTML = '<tr><td colspan="8">没有找到借阅记录</td></tr>';
            return;
        }

        records.forEach(record => {
            const row = document.createElement('tr');
            const borrowDate = new Date(record.borrowDate).toLocaleDateString();
            const dateline = new Date(record.dateline).toLocaleDateString();
            const returnDate = record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '—';
            
            let status = '';
            let actionButton = '';

            if (record.returnDate) {
                status = '<span class="status-returned">已归还</span>';
            } else {
                if (new Date(record.dateline) < new Date()) {
                    status = '<span class="status-overdue">已逾期</span>';
                } else {
                    status = '<span class="status-active">借阅中</span>';
                }
                actionButton = `<button class="btn-primary" data-id="${record.id}">强制还书</button>`;
            }

            row.innerHTML = `
                <td>${record.id}</td>
                <td>${record.book.title}</td>
                <td>${record.user.username}</td>
                <td>${borrowDate}</td>
                <td>${dateline}</td>
                <td>${returnDate}</td>
                <td>${status}</td>
                <td>${actionButton}</td>
            `;
            borrowTableBody.appendChild(row);
        });
    }

    function updatePagination(pageData) {
        currentPage = pageData.number;
        totalPages = pageData.totalPages;

        pageInfo.textContent = `第 ${currentPage + 1} / ${totalPages} 页`;
        prevPage.disabled = pageData.first;
        nextPage.disabled = pageData.last;
    }

    prevPage.addEventListener('click', () => {
        if (currentPage > 0) {
            fetchBorrows(currentPage - 1, statusFilter.value);
        }
    });

    nextPage.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            fetchBorrows(currentPage + 1, statusFilter.value);
        }
    });

    statusFilter.addEventListener('change', () => {
        fetchBorrows(0, statusFilter.value);
    });

    // 事件委托处理强制还书
    borrowTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-primary')) {
            const recordId = e.target.dataset.id;
            
            if (confirm(`您确定要将记录ID ${recordId} 标记为归还吗？`)) {
                try {
                    const response = await fetch(`/api/admin/borrows/return/${recordId}`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        alert('操作成功');
                        fetchBorrows(currentPage, statusFilter.value); // 重新加载
                    } else {
                        const errorMsg = await response.text();
                        throw new Error(errorMsg || '操作失败');
                    }
                } catch (error) {
                    console.error('还书失败:', error);
                    alert(`操作失败: ${error.message}`);
                }
            }
        }
    });

    // 初始加载
    fetchBorrows(currentPage, statusFilter.value);
});