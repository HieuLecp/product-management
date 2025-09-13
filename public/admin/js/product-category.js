// delete product category
const buttonDelete = document.querySelectorAll("[button-delete]");
// console.log(buttonDelete);
if(buttonDelete.length > 0){
    const formDeleteItem = document.querySelector("#form-delete-product-category");
    const path = formDeleteItem.getAttribute("data-path");

    buttonDelete.forEach(button => {
        button.addEventListener("click", () => {
            const isconfirm = confirm("Bạn có chắc chắn muốn xoá danh mục này?");
            if(isconfirm){
                const id = button.getAttribute("data-id");

                const action = `${path}/${id}?_method=DELETE`;
                formDeleteItem.action=action;

                console.log(action);
                formDeleteItem.submit();
            }
        })
    })
}

// end delete product