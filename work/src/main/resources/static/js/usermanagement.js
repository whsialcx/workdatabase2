document.addEventListener('DOMContentLoaded', () => {
    // 简单的管理员验证
    const adminName = sessionStorage.getItem('name');
    const adminRole = sessionStorage.getItem('role');
    
    if (adminRole !== 'admin') {
        alert('您没有权限访问此页面。');
        window.location.href = '/login';
        return;
    }

    const userTableBody = document.getElementById('userTableBody');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    let currentPage = 0;
    let totalPages = 0;

    async function fetchUsers(page = 0) {
        try {
            const response = await fetch(`/api/admin/users?page=${page}&size=10`);
            if (!response.ok) {
                throw new Error('获取用户列表失败');
            }
            const data = await response.json();
            
            renderTable(data.content);
            updatePagination(data);
        } catch (error) {
            console.error(error);
            userTableBody.innerHTML = `<tr><td colspan="5">加载失败: ${error.message}</td></tr>`;
        }
    }

    function renderTable(users) {
        userTableBody.innerHTML = '';
        if (users.length === 0) {
            userTableBody.innerHTML = '<tr><td colspan="5">没有找到用户数据</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.fullName || ''}</td>
                <td>
                    <button class="btn-danger" data-id="${user.id}">删除</button>
                </td>
            `;
            userTableBody.appendChild(row);
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
            fetchUsers(currentPage - 1);
        }
    });

    nextPage.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            fetchUsers(currentPage + 1);
        }
    });

    // 事件委托处理删除
    userTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-danger')) {
            const userId = e.target.dataset.id;
            const username = e.target.closest('tr').cells[1].textContent;
            
            if (confirm(`您确定要删除用户 "${username}" (ID: ${userId}) 吗？`)) {
                try {
                    const response = await fetch(`/api/admin/users/${userId}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();

                    if (response.ok && result.success) {
                        alert(result.message);
                        fetchUsers(currentPage); // 重新加载当前页
                    } else {
                        throw new Error(result.message || '删除失败');
                    }
                } catch (error) {
                    console.error('删除用户失败:', error);
                    alert(`删除失败: ${error.message}`);
                }
            }
        }
    });

    // 初始加载
    fetchUsers(currentPage);
});