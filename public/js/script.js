const { url } = require("inspector");

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


// button-go-back
const buttonGoback= document.querySelectorAll("[button-go-back]");
if(buttonGoback.length > 0){
    buttonGoback.forEach(button => {
        button.addEventListener("click", () => {
            history.back();
        })
    })
}
// end button-go-back

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
// end pagination


// sort
const sort = document.querySelector("[sort]");
// console.log(sort);
if(sort){
    let url = new URL(window.location.href);

    const sortSelect = sort.querySelector("[sort-select]");
    // const sortClear = sort.querySelector("[sort-clear]");

    sortSelect.addEventListener("change", (e) => {
        const value = e.target.value;
        const [sortKey, sortValue] = value.split("-");

        url.searchParams.set("sortKey", sortKey);
        url.searchParams.set("sortValue", sortValue);

        window.location.href = url.href;

    });

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

// quick link
const quickLink= document.querySelector(".quick-links");

if(quickLink){
    let url = new URL(window.location.href);

    const btnPriceMax= quickLink.querySelector("#priceMax");
    console.log(btnPriceMax);

    if(btnPriceMax){
        btnPriceMax.addEventListener("click", () => {

        })
    }
}
// end quick link
