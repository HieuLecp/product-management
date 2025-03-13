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

    // console.log(data);
    if(userId == data.userId){
        badgeUsersAccept.innerHTML= data.lengthAcceptFriend;
    }
    
})

// end sever_return_lengthAcceptFriend

// sever_return_inforRequestFriend

socket.on("sever_return_inforAcceptFriend", (data) => {
    // Trang lời mời kb
    const dataUserAccept= document.querySelector("[data-user-accept]");
    if(dataUserAccept){
        const userId= dataUserAccept.getAttribute("data-user-accept");

        if(userId == data.userId){
            const newBoxUser= document.createElement("div");
            newBoxUser.classList.add("col-6");
            newBoxUser.setAttribute("user-id", data.infoUserRequest._id);

            newBoxUser.innerHTML= `
                <div class="box-users ">
                    <div class="inner-avatar">
                        <img
                            src= "${data.infoUserRequest.avatar ? data.infoUserRequest.avatar : '/images/avt.png'}"
                            alt= ${data.infoUserRequest.fullName}
                        >
                        </div>
                    <div class="inner-info">
                        <div class="inner-name">
                            ${data.infoUserRequest.fullName}
                        </div>
                        <div class="inner-buttons">
                            <button 
                            class="btn btn-sm btn-primary mr-1" 
                            btn-accept-friend=${data.infoUserRequest._id}
                            >
                                Chấp nhận
                            </button>
                            <button 
                            class="btn btn-sm btn-secondary mr-1" 
                            btn-refuse-friend=${data.infoUserRequest._id}
                            >
                                Từ chối
                            </button>
                            <button 
                            class="btn btn-sm btn-secondary mr-1" 
                            btn-delete-friend= ""
                            disabled="disabled"
                            >
                                Đã từ chối
                            </button>
                            <button 
                            class="btn btn-sm btn-secondary mr-1" 
                            btn-accepted-friend="" 
                            disabled="disabled"
                            >
                                Đã chấp nhận
                            </button>
                        </div>
                    </div>
                </div>
            `
            dataUserAccept.appendChild(newBoxUser);

            // refuse addFriend
            const btnRefuseFriend= newBoxUser.querySelector("[btn-refuse-friend]");
            btnRefuseFriend.addEventListener("click", () => {
                btnRefuseFriend.closest(".box-users").classList.add("refuse");
                
                const userId= btnRefuseFriend.getAttribute("btn-refuse-friend");
                // console.log(userId);

                socket.emit("client_refuse_friend", userId);
            })

            // accept addFriend
            const btnAcceptFriend= newBoxUser.querySelector("[btn-accept-friend]");
            btnAcceptFriend.addEventListener("click", () => {
                btnAcceptFriend.closest(".box-users").classList.add("accepted");
                
                const userId= btnAcceptFriend.getAttribute("btn-accept-friend");
                // console.log(userId);

                socket.emit("client_accept_friend", userId);
            })
        }
    }
    
    // end trang lời mời kb

    // Trang danh sách người dùng
    const dataUserNotFriend= document.querySelector("[data-user-notFriend]");
    if(dataUserNotFriend){
        const userId= dataUserNotFriend.getAttribute("data-user-notFriend");
        if(userId == data.userId){
            // Xoá requestUser khỏi ds của AcceptUser
            const boxUserRemove= dataUserNotFriend.querySelector(`[user-id= "${data.infoUserRequest._id}"]`);
            if(boxUserRemove){
                dataUserNotFriend.removeChild(boxUserRemove);
            }
        }
    }
    // end Trang danh sách người dùng
})

// end sever_return_inforRequestFriend

// sever_return_cancelAddFriend

socket.on("sever_return_cancelAddFriend", (data) => {
    const dataUserAccept= document.querySelector("[data-user-accept]");
    const userId= dataUserAccept.getAttribute("data-user-accept");

    if(userId == data.userId){
        // Xoá requestUser khỏi ds của AcceptUser
        const boxUserRemove= dataUserAccept.querySelector(`[user-id= "${data.requestUserId}"]`);
        if(boxUserRemove){
            dataUserAccept.removeChild(boxUserRemove);
        }
    }
})

// end sever_return_cancelAddFriend