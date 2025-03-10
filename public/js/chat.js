import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'


// client_send_message
const formSendData= document.querySelector(".chat .inner-form");
if(formSendData){
    
    formSendData.addEventListener("submit", (e) => {
        e.preventDefault();
        const content= e.target.elements.content.value;
        if(content) {
            socket.emit("client_send_message", content);
            e.target.elements.content.value="";
            // console.log(content);
        }
    })
}
// end client_send_message

// server_return_message
socket.on("server_return_message", (data) => {
    const myId= document.querySelector("[my-id]").getAttribute("my-id");
    const body= document.querySelector(".chat .inner-body");

    const div= document.createElement("div");

    let htmlFullName= "";

    if(myId == data.userId){
        div.classList.add("inner-outgoing");
    } else{
        div.classList.add("inner-incoming");
        htmlFullName= `<div class="inner-name">${data.fullName}</div>`
    }
    div.innerHTML= `
        ${htmlFullName}
        <div class="inner-content">${data.content}</div>
    `

    body.appendChild(div)

    body.scrollTop = body.scrollHeight;
})
// end server_return_message

// Scroll chat to bottom

const bodyChat= document.querySelector(".chat .inner-body");
if(bodyChat){
    bodyChat.scrollTop = bodyChat.scrollHeight;
}

// end Scroll chat to bottom

// emoji
const buttonIcon= document.querySelector(".button-icon");
console.log(buttonIcon);
if(buttonIcon){
    const tooltip= document.querySelector(".tooltip");
    Popper.createPopper(buttonIcon, tooltip)

    buttonIcon.onclick= () => {
        tooltip.classList.toggle('shown')
    }
}

const emojiPicker= document.querySelector('emoji-picker')
    if(emojiPicker){
        const input= document.querySelector(".chat .inner-form input[name='content']");

        emojiPicker.addEventListener("emoji-click", (e) => {
            const icon= e.detail.unicode;
            // console.log(icon);
            input.value= input.value + icon;
        })
    }
// end emoji