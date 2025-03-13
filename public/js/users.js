// request addFriend

const listBtnAddFriend= document.querySelectorAll("[btn-add-friend]");
if(listBtnAddFriend.length > 0){
    listBtnAddFriend.forEach(button => {
        button.addEventListener("click", () => {
            button.closest(".box-users").classList.add("add");
            
            const userId= button.getAttribute("btn-add-friend");
            // console.log(userId);

            socket.emit("client_add_friend", userId);

        })
    })
}

// end request addFriend

// Cancel addFriend

const listBtnCancelFriend= document.querySelectorAll("[btn-cancel-friend]");
if(listBtnCancelFriend.length > 0){
    listBtnCancelFriend.forEach(button => {
        button.addEventListener("click", () => {
            button.closest(".box-users").classList.remove("add");
            
            const userId= button.getAttribute("btn-cancel-friend");
            // console.log(userId);

            socket.emit("client_cancel_friend", userId);

        })
    })
}

// end Cancel addFriend

// refuse addFriend

const listBtnRefuseFriend= document.querySelectorAll("[btn-refuse-friend]");
if(listBtnRefuseFriend.length > 0){
    listBtnRefuseFriend.forEach(button => {
        button.addEventListener("click", () => {
            button.closest(".box-users").classList.add("refuse");
            
            const userId= button.getAttribute("btn-refuse-friend");
            // console.log(userId);

            socket.emit("client_refuse_friend", userId);
        })
    })
}

// end refuse addFriend

// accepted addFriend

const listBtnAcceptFriend= document.querySelectorAll("[btn-accept-friend]");
if(listBtnAcceptFriend.length > 0){
    listBtnAcceptFriend.forEach(button => {
        button.addEventListener("click", () => {
            button.closest(".box-users").classList.add("accepted");
            
            const userId= button.getAttribute("btn-accept-friend");
            // console.log(userId);

            socket.emit("client_accept_friend", userId);
        })
    })
}

// end accepted addFriend

// sever_return_lengthAcceptFriend

socket.on("sever_return_lengthAcceptFriend", (data) => {
    const badgeUsersAccept= document.querySelector("[badge-users-accpet]");
    const userId= badgeUsersAccept.getAttribute("badge-users-accpet");

    console.log(data);
    if(userId == data.userId){
        badgeUsersAccept.innerHTML= data.lengthAcceptFriend;
    }
    
})

// end sever_return_lengthAcceptFriend