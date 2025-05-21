// form changeMultiOrder
const formChangeMulti = document.querySelector("[form-change-multi-order]");
// console.log(formChangeMulti);
if(formChangeMulti){
    formChangeMulti.addEventListener("submit", (e) => {
        e.preventDefault();

        const checkboxMulti = document.querySelector("[checkbox-multi]");
        // console.log(checkboxMulti);
        const inputsChecked = checkboxMulti.querySelectorAll("input[name=id]:checked");

        const typeChange = e.target.elements.type.value;
        // console.log(typeChange);

        if(typeChange == "delete-all"){
            const isconfirm = confirm("Bạn có chắc chắn muốn xoá sản phẩm này?");
            if(!isconfirm){
                return;
            }
        }
        
        if(inputsChecked.length > 0){
            let ids = [];
            const inputIds = formChangeMulti.querySelector("input[name=ids]");

            inputsChecked.forEach(input => {
                const id =input.value;

                if(typeChange == "change-position"){
                    const position = input
                    .closest("tr")
                    .querySelector("input[name=position]")
                    .value;

                    ids.push(`${id}-${position}`);
                    // console.log(`${id}-${position}`);
                }
                else{
                    ids.push(id);
                }
            })

            // console.log(ids.join(","));
            inputIds.value= ids.join(",");
            formChangeMulti.submit();

        }
        else{
            alert("Vui lòng chọn ít nhất một đơn hàng!");
        }
    })
}
// end form changeMultiOrder


// xem chi tiết đơn hàng
function toggleDetails(orderId) {
    const detailsContainer = document.getElementById(`details-${orderId}`);
    const detailsContent = document.getElementById(`details-content-${orderId}`);

    // Toggle hiển thị toàn bộ container (bao gồm tiêu đề và nội dung)
    if (detailsContainer.classList.contains('hidden')) {
        // Nếu chưa render dữ liệu, render từ dữ liệu đã có sẵn
        if (!detailsContent.innerHTML.trim()) {
            // Lấy dữ liệu từ biến toàn cục window.orderDetails
            const order = window.orderDetails.find(o => o.orderId === orderId);
            // console.log(order);
            // console.log(order.products)
            if (order && order.products) {
                let html = '';
                order.products.forEach(product => {
                    html += `
                        <div class="product-card">
                            <img src="${product.thumbnail}" alt="${product.title}" class="product-img" width="80px">
                            <div class="product-info">
                                <p class="product-title"> <span>${product.title}</span> </p>
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
};
// end danh sách đơn hàng