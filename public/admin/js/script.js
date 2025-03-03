// Button status
const buttonStatus = document.querySelectorAll("[button-status]");
if(buttonStatus.length > 0){
    let url = new URL(window.location.href) ;
    // console.log(url);

    buttonStatus.forEach(button => {
        button.addEventListener("click", () => {
            const status = button.getAttribute("button-status");
            // console.log(status);

            if(status){
                url.searchParams.set("status", status);
            }
            else{
                url.searchParams.delete("status");
            }

            // console.log(url.href);
            window.location.href = url.href;
        })
    })
}
// Button status end

// form search
const formSearch = document.querySelector("#form-search");
if(formSearch){

    let url = new URL(window.location.href) ;

    formSearch.addEventListener("submit", (e) => {
        e.preventDefault();
        // console.log(e.target.elements.keyword.value);
        const keyword = e.target.elements.keyword.value;

        if(keyword){
            url.searchParams.set("keyword", keyword);
        }
        else{
            url.searchParams.delete("keyword");
        }

        window.location.href = url.href;
    });
}
// end form search

// pagination
const buttonPagination = document.querySelectorAll("[button-pagination]");
// console.log(buttonPagination);
if(buttonPagination){
    let url = new URL(window.location.href);
    
    buttonPagination.forEach(button => {
        button.addEventListener("click", () => {
            const page = button.getAttribute("button-pagination");
            // console.log(page);

            url.searchParams.set("page", page);

            window.location.href = url.href;
        })
    })
}
// end paginatio
// checkbox multi
const checkboxMulti = document.querySelector("[checkbox-multi]");
    if(checkboxMulti){
        const inputCheckAll = checkboxMulti.querySelector("input[name=checkall]");
        const inputsId = checkboxMulti.querySelectorAll("input[name=id]");

        inputCheckAll.addEventListener("click", () => {
            // console.log(inputCheckAll.checked);
            if(inputCheckAll.checked){
                inputsId.forEach(input => {
                    input.checked = true;
                });
            }
            else{
                inputsId.forEach(input => {
                    input.checked = false;
                });
            }
        });

        inputsId.forEach(input => {
            input.addEventListener("click", () => {
                const countChecked = checkboxMulti.querySelectorAll("input[name=id]:checked").length;
                
                // console.log(countChecked);
                // console.log(inputsId.length);
                if(countChecked == inputsId.length){
                    inputCheckAll.checked = true;
                }
                else{
                    inputCheckAll.checked = false;
                }
            });
        });
    }
// end checkboxMulti

// form changeMulti
const formChangeMulti = document.querySelector("[form-change-multi]");
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
            alert("Vui lòng chọn ít nhất một sản phẩm!");
        }
    })
}
// end form changeMulti


// show alert
const showAlert = document.querySelector("[show-alert]");
if(showAlert){
    const time = parseInt(showAlert.getAttribute("data-time"));
    const closeAlert = showAlert.querySelector("[close-alert]");

    setTimeout(() => {
        showAlert.classList.add("alert-hidden");
    }, time)

    closeAlert.addEventListener("click", () => {
        showAlert.classList.add("alert-hidden");
    })

}
// end show alert

// preview Image
const uploadImage = document.querySelector("[upload-image]");
if(uploadImage){
    const uploadImageInput = document.querySelector("[upload-image-input]");
    const uploadImagePreview = document.querySelector("[upload-image-preview]");
    const closeImage = document.querySelector("[button-close-image]");

    uploadImageInput.addEventListener("change", (e) => {
        // console.log(e);

        const file = e.target.files[0];
        if(file){
            uploadImagePreview.src= URL.createObjectURL(file);
        }
    });
}
// end preview Image

// close Image
// const closeImage = document.querySelector("[button-close-image]");
// if(closeImage){
//     const uploadImageInput = document.querySelector("[upload-image-input]");
//     const uploadImagePreview = document.querySelector("[upload-image-preview]");

//     uploadImageInput.addEventListener("change", (e) => {
//         console.log(e);

//         const file = e.target.files[0];
//         if(file){
//             uploadImagePreview.src= URL.createObjectURL(file);
//         }
//     });

// }
// end close image


// sort
const sort = document.querySelector("[sort]");
// console.log(sort);
if(sort){
    let url = new URL(window.location.href);

    const sortSelect = sort.querySelector("[sort-select]");
    const sortClear = sort.querySelector("[sort-clear]");

    sortSelect.addEventListener("change", (e) => {
        const value = e.target.value;
        const [sortKey, sortValue] = value.split("-");

        url.searchParams.set("sortKey", sortKey);
        url.searchParams.set("sortValue", sortValue);

        window.location.href = url.href;

    });

    // end sort
    sortClear.addEventListener("click", () => {
        url.searchParams.delete("sortKey");
        url.searchParams.delete("sortValue");
        window.location.href = url.href;
    })

    // selected cho option
    const sortKey = url.searchParams.get("sortKey");
    const sortValue = url.searchParams.get("sortValue");

    // console.log(sortKey);
    // console.log(sortValue);
    if(sortKey && sortValue){
        const stringSort = `${sortKey}-${sortValue}`;
        // console.log(stringSort);

        const optionSelected = sortSelect.querySelector(`option[value='${stringSort}']`);
        optionSelected.selected = true;
    }

}
// end sort

// delete product
const buttonDelete = document.querySelectorAll("[button-delete]");
// console.log(buttonDelete);
if(buttonDelete.length > 0){
    const formDeleteItem = document.querySelector("#form-delete-item");
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

    // console.log(path);
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