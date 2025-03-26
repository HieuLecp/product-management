// Cập nhập số lượng sp trong giỏ

const inputQuantity= document.querySelectorAll("input[name='quantity']");
if(inputQuantity.length > 0){
    inputQuantity.forEach(input => {
        input.addEventListener("change", (e) => {
            const productId= input.getAttribute("product-id");
            const quantity= parseInt(input.value);
            if(quantity > 0){
                window.location.href= `cart/update/${productId}/${quantity}`;
            }
        })
    })
}

// end Cập nhập số lượng sp trong giỏ

// Cập nhập tổng tiền khi tick
document.addEventListener("DOMContentLoaded", function () {
    const checkAll = document.querySelector("input[name='checkall']");
    const checkboxes = document.querySelectorAll("input[name='productIds[]']");
    const quantityInputs = document.querySelectorAll("input[name='quantity']");
    const totalPriceElement = document.getElementById("totalPriceCart");

    function updateTotalPrice() {
        let total = 0;
        let hasChecked = false;

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                hasChecked = true;
                const row = checkbox.closest("tr");
                const priceText = row.querySelector("td:nth-child(5)").textContent;
                const price = parseInt(priceText.replace(/\./g, ""), 10); // Giá sản phẩm
                const quantity = parseInt(row.querySelector("input[name='quantity']").value); // Số lượng
                const totalProductPrice = price * quantity;

                row.querySelector("td:nth-child(7)").textContent = totalProductPrice.toLocaleString("vi-VN"); // Cập nhật tổng tiền từng sản phẩm
                total += totalProductPrice;
            }
        });

        totalPriceElement.innerHTML = hasChecked 
            ? `Tổng đơn hàng: ${total.toLocaleString()} (vnd)` 
            : `Tổng đơn hàng: 0 đ`;
    }

    // Xử lý chọn/bỏ chọn tất cả checkbox
    checkAll.addEventListener("change", function () {
        checkboxes.forEach(checkbox => {
            checkbox.checked = checkAll.checked;
        });
        updateTotalPrice(); // Cập nhật tổng tiền ngay khi tích "Chọn tất cả"
    });

    // Xử lý chọn checkbox từng sản phẩm
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function () {
            // Nếu có bất kỳ checkbox nào bỏ chọn, bỏ chọn checkAll
            checkAll.checked = [...checkboxes].every(chk => chk.checked);
            updateTotalPrice();
        });
    });

    // Xử lý thay đổi số lượng sản phẩm
    quantityInputs.forEach(input => {
        input.addEventListener("input", updateTotalPrice);
    });

    // Cập nhật tổng tiền khi tải trang
    updateTotalPrice();
});

// end cập nhập tổng tiền khi tick

// gửi form cart
document.addEventListener("DOMContentLoaded", function () {
    const formChangeMulti = document.querySelector("[form-change-multi]");
    if (!formChangeMulti) return;

    const orderButton = document.querySelector("#orderButton"); // Nút đặt hàng
    const checkboxes = document.querySelectorAll('input[name="productIds[]"]'); // Checkbox sản phẩm

    orderButton.addEventListener("click", function (e) {
        e.preventDefault(); // Chặn hành động mặc định

        // Lấy danh sách sản phẩm được chọn
        let selectedProducts = [];
        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                selectedProducts.push(checkbox.value);
            }
        });

        if (selectedProducts.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
            return;
        }

        // Tạo URL chứa danh sách ID sản phẩm
        const queryString = new URLSearchParams({ productIds: selectedProducts.join(",") }).toString();

        // Điều hướng đến trang checkout kèm danh sách sản phẩm trên URL
        window.location.href = `/checkout?${queryString}`;
    });
});


// end gửi form cart
