let revenueChart; // Biến để lưu trữ biểu đồ doanh thu
let categorySalesChart; // Biến để lưu trữ biểu đồ tỷ lệ sản phẩm đã bán
let paymentMethodChart; // Biến để lưu trữ biểu đồ tròn tỷ lệ phương thức thanh toán

// Kiểm tra kết nối Socket.IO
socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
    socket.emit('requestInitialData');
});

socket.on('initialDashboardData', (data) => {
    console.log('Initial data received:', data);
    updateDashboard(data);
    createOrUpdateChart(data);
    createOrUpdateCategorySalesChart(data);
    createOrUpdatePaymentMethodChart(data);
});

socket.on('updateDashboard', (data) => {
    console.log('Update data received:', data);
    updateDashboard(data);
    createOrUpdateChart(data);
    createOrUpdateCategorySalesChart(data);
    createOrUpdatePaymentMethodChart(data);
});

function updateDashboard(data) {
    console.log('Updating dashboard with data:', data);
    // Hiển thị sản phẩm bán chạy nhất (top 1)
    const bestProduct = Array.isArray(data.products) && data.products.length > 0 ? data.products[0] : {};
    console.log('Best product:', bestProduct);
    document.getElementById('bestProductThumbnail').src = bestProduct.thumbnail || '';
    document.getElementById('bestProductTitle').innerHTML = `<b>${bestProduct.title || 'Không có sản phẩm'}</b>`;
    document.getElementById('bestProductSold').textContent = bestProduct.sold || 0;

    // Hiển thị sản phẩm vừa được mua (nếu có)
    const recentlyUpdatedProduct = Array.isArray(data.recentlyUpdatedProducts) && data.recentlyUpdatedProducts.length > 0 ? data.recentlyUpdatedProducts[0] : null;
    if (recentlyUpdatedProduct) {
        document.getElementById('recentProductTitle').innerHTML = `<b>Vừa bán: ${recentlyUpdatedProduct.title || 'Không có sản phẩm'}</b>`;
        document.getElementById('recentProductSold').textContent = recentlyUpdatedProduct.sold || 0;
    }

    document.getElementById('revenueDay').textContent = data.totalRevenue?.inDay || 0;
    document.getElementById('revenueMonth').textContent = data.totalRevenue?.inMonth || 0;

    document.getElementById('userTotal').textContent = data.user?.total || 0;
    document.getElementById('userOnline').textContent = data.user?.statusOnline || 0;

    // Cập nhật tỷ lệ đặt hàng
    document.getElementById('orderPlacementRateDay').textContent = data.orderPlacementRate?.inDay || 0;
    document.getElementById('orderPlacementRateMonth').textContent = data.orderPlacementRate?.inMonth || 0;
}

function createOrUpdateChart(data) {
    console.log('Revenue per day for chart:', data.revenuePerDay);
    const ctx = document.getElementById('revenueChart').getContext('2d');

    const labels = data.revenuePerDay.map(item => item._id) || ['Không có dữ liệu'];
    const revenues = data.revenuePerDay.map(item => item.totalRevenue) || [0];

    if (revenueChart) {
        revenueChart.data.labels = labels;
        revenueChart.data.datasets[0].data = revenues;
        revenueChart.update();
    } else {
        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu (VND)',
                    data: revenues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                animation: {
                    duration: 500,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Doanh thu (VND)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Ngày'
                        }
                    }
                }
            }
        });
    }
}

function createOrUpdateCategorySalesChart(data) {
    console.log('Category sales ratio for chart:', data.categorySalesRatio);
    const ctx = document.getElementById('categorySalesChart').getContext('2d');

    const labels = data.categorySalesRatio.map(item => item.categoryName);
    const percentages = data.categorySalesRatio.map(item => item.percentage);
    const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
    ];

    if (categorySalesChart) {
        categorySalesChart.data.labels = labels.length > 0 ? labels : ['Không có dữ liệu'];
        categorySalesChart.data.datasets[0].data = percentages.length > 0 ? percentages : [100];
        categorySalesChart.data.datasets[0].backgroundColor = percentages.length > 0 ? colors.slice(0, percentages.length) : ['rgba(200, 200, 200, 0.6)'];
        categorySalesChart.data.datasets[0].borderColor = percentages.length > 0 ? colors.slice(0, percentages.length).map(c => c.replace('0.6', '1')) : ['rgba(200, 200, 200, 1)'];
        categorySalesChart.update();
    } else {
        categorySalesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['Không có dữ liệu'],
                datasets: [{
                    label: 'Tỷ lệ bán theo danh mục (%)',
                    data: percentages.length > 0 ? percentages : [100],
                    backgroundColor: percentages.length > 0 ? colors.slice(0, percentages.length) : ['rgba(200, 200, 200, 0.6)'],
                    borderColor: percentages.length > 0 ? colors.slice(0, percentages.length).map(color => color.replace('0.6', '1')) : ['rgba(200, 200, 200, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.raw + '%';
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Phần trăm (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Danh mục'
                        }
                    }
                }
            }
        });
    }
}

function createOrUpdatePaymentMethodChart(data) {
    console.log('Payment method stats for chart:', data.paymentTypeStats);
    const ctx = document.getElementById('paymentMethodChart').getContext('2d');

    const labels = ['COD', 'MoMo', 'ZaloPay'];
    const counts = [
        data.paymentTypeStats?.cod || 0,
        data.paymentTypeStats?.momo || 0,
        data.paymentTypeStats?.zalopay || 0
    ];
    const colors = ['rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'];

    if (paymentMethodChart) {
        paymentMethodChart.data.labels = labels;
        paymentMethodChart.data.datasets[0].data = counts;
        paymentMethodChart.data.datasets[0].backgroundColor = colors;
        paymentMethodChart.data.datasets[0].borderColor = colors.map(c => c.replace('0.6', '1'));
        paymentMethodChart.update();
    } else {
        paymentMethodChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Phương thức thanh toán',
                    data: counts,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.6', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.raw + ' đơn hàng';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up event listeners');
    if (initialStatistic) {
        console.log('Initial statistic from controller:', initialStatistic);
        updateDashboard(initialStatistic);
        createOrUpdateChart(initialStatistic);
        createOrUpdateCategorySalesChart(initialStatistic);
        createOrUpdatePaymentMethodChart(initialStatistic);
    }

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