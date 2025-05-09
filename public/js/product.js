
// public/js/priceFilter.js
document.addEventListener('DOMContentLoaded', () => {
    const filterPrice = document.querySelector('.price-filter');
    if (filterPrice) {
        const url = new URL(window.location.href);
        const btnFilter = filterPrice.querySelector('#filter-price-btn');
        const priceMinInput = filterPrice.querySelector('#price-min');
        const priceMaxInput = filterPrice.querySelector('#price-max');
        const priceRangeDisplay = filterPrice.querySelector('#price-range');

        // Tạo phần tử hiển thị thông báo lỗi
        let errorDisplay = document.querySelector('#price-error');
        if (!errorDisplay) {
            errorDisplay = document.createElement('p');
            errorDisplay.id = 'price-error';
            errorDisplay.className = 'text-danger';
            errorDisplay.style.marginTop = '0.5rem';
            filterPrice.appendChild(errorDisplay);
        }

        // Hàm kiểm tra priceMin <= priceMax
        const validatePriceRange = () => {
            const priceMin = priceMinInput.value ? parseFloat(priceMinInput.value) : null;
            const priceMax = priceMaxInput.value ? parseFloat(priceMaxInput.value) : null;

            if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
                errorDisplay.textContent = 'Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa';
                btnFilter.disabled = true; // Vô hiệu hóa nút Lọc
                return false;
            } else if ((priceMin !== null && priceMin < 0) || (priceMax !== null && priceMax < 0)) {
                errorDisplay.textContent = 'Giá không được nhỏ hơn 0';
                btnFilter.disabled = true; // Vô hiệu hóa nút Lọc
                return false;
            } else {
                errorDisplay.textContent = '';
                btnFilter.disabled = false; // Bật lại nút Lọc
                return true;
            }
        };

        // Gán giá trị từ query string vào input khi trang tải
        const min = url.searchParams.get('priceMin');
        const max = url.searchParams.get('priceMax');

        if (min !== null) {
            priceMinInput.setAttribute('value', min);
        }
        if (max !== null) {
            priceMaxInput.setAttribute('value', max);
        }

        // Cập nhật hiển thị khoảng giá ban đầu
        if (min !== null || max !== null) {
            priceRangeDisplay.textContent = `Giá: ${(min || 0).toLocaleString('vi-VN')} - ${(max || 50000000).toLocaleString('vi-VN')} đ`;
        } else {
            priceRangeDisplay.textContent = 'Chưa chọn khoảng giá';
        }

        // Thêm sự kiện input để kiểm tra ngay khi người dùng nhập
        priceMinInput.addEventListener('input', validatePriceRange);
        priceMaxInput.addEventListener('input', validatePriceRange);

        // Xử lý sự kiện click nút Lọc
        btnFilter.addEventListener('click', () => {
            const priceMin = priceMinInput.value ? parseFloat(priceMinInput.value) : null;
            const priceMax = priceMaxInput.value ? parseFloat(priceMaxInput.value) : null;

            // Kiểm tra lại trước khi gửi
            if (!validatePriceRange()) {
                return; // Không gửi nếu có lỗi
            }

            // Cập nhật hiển thị khoảng giá
            if (priceMin !== null || priceMax !== null) {
                priceRangeDisplay.textContent = `Giá: ${(priceMin || 0).toLocaleString('vi-VN')} - ${(priceMax || 50000000).toLocaleString('vi-VN')} đ`;
            } else {
                priceRangeDisplay.textContent = 'Chưa chọn khoảng giá';
            }

            // Cập nhật URL
            let url = new URL(window.location.href);
            if (priceMin !== null) {
                url.searchParams.set("priceMin", priceMin);
            } 
            if (priceMax !== null) {
                url.searchParams.set("priceMax", priceMax);
            } 
            // Chuyển hướng
            window.location.href = url.href;
        });
    }
});