function toggleDetails(orderId) {
    const detailsContainer = document.getElementById(`details-${orderId}`);
    const detailsContent = document.getElementById(`details-content-${orderId}`);
    console.log(detailsContainer);
    console.log(detailsContent);

    // Toggle hiển thị toàn bộ container (bao gồm tiêu đề và nội dung)
    if (detailsContainer.classList.contains('hidden')) {
        // Nếu chưa render dữ liệu, render từ dữ liệu đã có sẵn
        if (!detailsContent.innerHTML.trim()) {
            // Lấy dữ liệu từ biến toàn cục window.orderDetails
            const order = window.orderDetails.find(o => o.orderId === orderId);
            if (order && order.products) {
                let html = '';
                order.products.forEach(product => {
                    html += `
                        <div class="product-card">
                            <img src="${product.thumbnail}" alt="${product.title}" class="product-img" width="80px">
                            <div class="product-info">
                                <a href="/product/detail/${product.slug}" class="product-title" >${product.title}
                                <p class="product-price">Giá: <span>${product.price}</span> đ</p>
                                <p class="product-quantity">Số lượng: ${product.quantity}</p>
                            </div>
                        </div>
                    `;
                });
                detailsContent.innerHTML = html;
            } else {
                detailsContent.innerHTML = `<p class="details-error">Không có dữ liệu sản phẩm</p>`;
            }
        }
        detailsContainer.classList.remove('hidden');
        detailsContainer.classList.add('slide-down');
    } else {
        detailsContainer.classList.add('hidden');
        detailsContainer.classList.remove('slide-down');
    }
}