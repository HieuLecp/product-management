// change status
// const buttonChangeStatus = document.querySelectorAll("[button-change-status]");
// if(buttonChangeStatus.length > 0){
//     const formChangeStatus = document.querySelector("#form-change-status");
//     const path = formChangeStatus.getAttribute("data-path");
//     // console.log(path);

//     buttonChangeStatus.forEach(button => {
//         button.addEventListener("click", () =>{
//             const statusCurrent = button.getAttribute("data-status");
//             const id = button.getAttribute("data-id");

//             let statusChange = statusCurrent == "active" ? "inactive" : "active";
            
//             // console.log(statusCurrent);
//             // console.log(id);
//             // console.log(statusChange);

//             const action = path + `/${statusChange}/${id}?_method=PATCH` ;
//             // console.log(action);
//             formChangeStatus.action = action;

//             formChangeStatus.submit();
//         })
//     })
// }
// end chang status

// restore product
const buttonRestore = document.querySelectorAll("[button-restore]");
// console.log(buttonRestore);
if(buttonRestore.length > 0){
    const formRestoreItem = document.querySelector("#form-restore-item");
    const path = formRestoreItem.getAttribute("data-path");

    buttonRestore.forEach(button => {
        // console.log(button);
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-id");
            const action = `${path}/${id}?_method=PATCH`;
            formRestoreItem.action=action;

            // console.log(id);
            // console.log(action);

            formRestoreItem.submit();
        })
    })

    // console.log(path);
}
// end restore product

// delete product
const buttonDelete = document.querySelectorAll("[button-delete]");
if(buttonDelete.length > 0){
    const formDeleteItem = document.querySelector("#form-delete-item");
    const path = formDeleteItem.getAttribute("data-path");

    buttonDelete.forEach(button => {
        // console.log(button);
        button.addEventListener("click", () => {
            const isconfirm = confirm("Bạn có chắc chắn muốn xoá hẳn sản phẩm này?");
            if(isconfirm){
                const id = button.getAttribute("data-id");
                const action = `${path}/${id}?_method=PATCH`;
                formDeleteItem.action=action;

                // console.log(id);
                console.log(action);

                formDeleteItem.submit();
            }
        })
    })

    // console.log(path);
}
// end delete product