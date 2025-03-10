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

