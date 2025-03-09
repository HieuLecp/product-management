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
        ${data.fullName}
        <div class="inner-content">${data.content}</div>
    `

    body.appendChild(div)
})
// end server_return_message