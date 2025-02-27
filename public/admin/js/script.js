// console.log("Ok");
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
    })
}

// end form search

// phan trang
const buttonPagination = document.querySelectorAll("[button-pagination]");
// console.log(buttonPagination);
if(buttonPagination){
    let url = new URL(window.location.href);
    
    buttonPagination.forEach(button => {
        button.addEventListener("click", () => {
            const page = button.getAttribute("button-pagination");
            console.log(page);

            url.searchParams.set("page", page);

            window.location.href = url.href;
        })
    })
}
// end phan trang

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
        console.log(e);

        const file = e.target.files[0];
        if(file){
            uploadImagePreview.src= URL.createObjectURL(file);
        }
    });

    closeImage.addEventListener("click", () => {
        uploadImageInput.value= "";
        uploadImagePreview.src="";

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