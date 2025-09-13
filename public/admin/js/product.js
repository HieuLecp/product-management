// change status
const buttonChangeStatus = document.querySelectorAll("[button-change-status]");
if(buttonChangeStatus.length > 0){
    const formChangeStatus = document.querySelector("#form-change-status");
    const path = formChangeStatus.getAttribute("data-path");
    // console.log(path);

    buttonChangeStatus.forEach(button => {
        button.addEventListener("click", () =>{
            const statusCurrent = button.getAttribute("data-status");
            const id = button.getAttribute("data-id");

            let statusChange = statusCurrent == "active" ? "inactive" : "active";
            
            // console.log(statusCurrent);
            // console.log(id);
            // console.log(statusChange);

            const action = path + `/${statusChange}/${id}?_method=PATCH` ;
            // console.log(action);
            formChangeStatus.action = action;

            formChangeStatus.submit();
        })
    })
}
// end chang status

// delete product
const buttonDelete = document.querySelectorAll("[button-delete]");
// console.log(buttonDelete);
if(buttonDelete.length > 0){
    const formDeleteItem = document.querySelector("#form-delete-product");
    console.log(formDeleteItem)
    const path = formDeleteItem.getAttribute("data-path");

    buttonDelete.forEach(button => {
        button.addEventListener("click", () => {
            const isconfirm = confirm("Bạn có chắc chắn muốn xoá sản phẩm này?");
            if(isconfirm){
                const id = button.getAttribute("data-id");

                const action = `${path}/${id}?_method=DELETE`;
                formDeleteItem.action=action;

                // console.log(action);
                formDeleteItem.submit();
            }
        })
    })
}

// end delete product

// restore product
const buttonRestore = document.querySelectorAll("[button-restore]");
// console.log(buttonRestore);
if(buttonRestore.length > 0){
    const formRestoreItem = document.querySelector("#form-restore-item");
    const path = formRestoreItem.getAttribute("data-path");

    buttonRestore.forEach(button => {
        // console.log(button);
        if (!button.dataset.addedEvent){
            button.dataset.addedEvent = "true";
            button.addEventListener("click", () => {
                const isconfirm = confirm("Bạn có chắc chắn muốn khôi phục mục này?");
                if(isconfirm){
                    const id = button.getAttribute("data-id");
                    const action = `${path}/${id}?_method=PATCH`;
                    formRestoreItem.action=action;

                    // console.log(id);
                    // console.log(action);

                    formRestoreItem.submit();
                };
            })
        }
            
    })

}
// end restore product

// delete product bin
const buttonDeleteBin = document.querySelectorAll("[button-delete-bin]");
// console.log(buttonDelete);
if(buttonDeleteBin.length > 0){
    const formDeleteItemBin = document.querySelector("#form-delete-item-bin");
    const path = formDeleteItemBin.getAttribute("data-path");

    buttonDeleteBin.forEach(button => {
        // console.log(button);
        if (!button.dataset.addedEvent){
            button.dataset.addedEvent = "true";
            button.addEventListener("click", () => {
                const isconfirm = confirm("Bạn có chắc chắn muốn xoá hẳn mục này?");
                if(isconfirm){
                    const id = button.getAttribute("data-id");
                    const action = `${path}/${id}?_method=DELETE`;
                    formDeleteItemBin.action=action;

                    // console.log(id);
                    // console.log(action);

                    formDeleteItemBin.submit();
                }
            })
        }
    })

    // console.log(path);
}
// end delete product bin

