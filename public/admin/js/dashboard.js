// const socket = io();

socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
    socket.emit('requestInitialData');
});

socket.on('initialDashboardData', (data) => {
    console.log('Initial data received:', data);
    updateDashboard(data);
});

socket.on('updateDashboard', (data) => {
    console.log('Update data received:', data);
    updateDashboard(data);
});

function updateDashboard(data) {
    const bestProduct = Array.isArray(data.products) && data.products.length > 0 ? data.products[0] : {};
    document.getElementById('bestProductThumbnail').src = bestProduct.thumbnail || '';
    document.getElementById('bestProductTitle').innerHTML = `<b>${bestProduct.title || 'Không có sản phẩm'}</b>`;
    document.getElementById('bestProductSold').textContent = bestProduct.sold || 0;

    document.getElementById('revenueDay').textContent = data.totalRevenue?.inDay || 0;
    document.getElementById('revenueMonth').textContent = data.totalRevenue?.inMonth || 0;

    document.getElementById('userTotal').textContent = data.user?.total || 0;
    document.getElementById('userOnline').textContent = data.user?.statusOnline || 0;
}

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[button-delete]');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
                const id = button.getAttribute('data-id');
                socket.emit('productDeleted', { id });
            }
        });
    });
});