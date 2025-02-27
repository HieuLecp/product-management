// restore product
const buttonItem = document.querySelectorAll("[button-restore]");
if(buttonItem.length > 0){
    const formRestoreItem = document.querySelector("#form-restore-item");
    const path = formRestoreItem.getAttribute("data-path");

    buttonItem.forEach(button => {
        // console.log(button);
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-id");
            const action = `${path}/${id}?_method=PATCH`;
            formRestoreItem.action=action;

            // console.log(id);
            console.log(action);

            formRestoreItem.submit();
        })
    })

    console.log(path);
}

// end restore product

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