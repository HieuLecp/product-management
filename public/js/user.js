
// Danh sách đơn hàng
function toggleDetails(orderId) {
    const detailsContainer = document.getElementById(`details-${orderId}`);
    const detailsContent = document.getElementById(`details-content-${orderId}`);

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
// end danh sách đơn hàng

// Huỷ đơn
const btnCancelOrder= document.querySelectorAll(".cancel-order-btn");

if(btnCancelOrder.length > 0){

    btnCancelOrder.forEach(button => {
        const formCancelOrder= button.querySelector("#button-cancel-order");

        button.addEventListener("click", () => {
      
            const orderId= button.getAttribute("order-id");
            const path= formCancelOrder.getAttribute("data-path")
    
            const action= `${path}/${orderId}?_method=PATCH`;
            formCancelOrder.action= action;
            
            formCancelOrder.submit();
        })
    })  
};
// end Huỷ đơn

// Nhận đơn
const btnDeliveOrder= document.querySelectorAll(".delivered-order-btn");

if(btnDeliveOrder.length > 0){

    btnDeliveOrder.forEach(button => {
        const formCancelOrder= button.querySelector("#button-delivered-order");

        button.addEventListener("click", () => {
      
            const orderId= button.getAttribute("order-id");
            const path= formCancelOrder.getAttribute("data-path")
    
            const action= `${path}/${orderId}?_method=PATCH`;
            formCancelOrder.action= action;
            
            formCancelOrder.submit();
        })
    })  
};
// end nhận đơn

// lọc trạng thái đơn hàng
const filterOrder= document.querySelector(".order-filter");

if(filterOrder){
    let url= new URL(window.location.href);

    const filterSelect= filterOrder.querySelector("#statusFilter");
    // console.log(filterSelect);

    filterSelect.addEventListener("change", (e) => {
        const value= e.target.value;
        console.log(value);

        url.searchParams.set("value", value);

        window.location.href= url.href;
    });

    const filterValue= url.searchParams.get("value");
    if(filterValue){
        const stringFilter= `${filterValue}`;

        const optionSelect= filterSelect.querySelector(`option[value='${stringFilter}']`);
        optionSelect.selected= true;
    }

}
// end lọc trạng thái đơn hàng
