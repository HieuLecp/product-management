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
