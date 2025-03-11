import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'
import { FileUploadWithPreview } from "https://unpkg.com/file-upload-with-preview/dist/index.js";


// upload-image-preview
const upload = new FileUploadWithPreview('upload-images', {
    multiple: true,
    maxFileCount: 6
});

// end upload-image-preview

// client_send_message
const formSendData= document.querySelector(".chat .inner-form");
if(formSendData){
    
    formSendData.addEventListener("submit", (e) => {
        e.preventDefault();
        const content= e.target.elements.content.value;
        const images= upload.cachedFileArray || [];

        console.log(images);

        if(content || images.length > 0) {
            
            socket.emit("client_send_message", {
                content: content,
                images: images
            });
            
            e.target.elements.content.value="";
            upload.resetPreviewPanel();
            socket.emit("client_send_typing", "hidden");
            // console.log(content);
        }
    })
}
// end client_send_message

// server_return_message
socket.on("server_return_message", (data) => {
    console.log(data);
    const myId= document.querySelector("[my-id]").getAttribute("my-id");
    const body= document.querySelector(".chat .inner-body");
    const boxTyping= document.querySelector(".inner-list-typing");

    const div= document.createElement("div");

    let htmlFullName= "";
    let htmlContent= "";
    let htmlImages="";

    if(myId == data.userId){
        div.classList.add("inner-outgoing");
    } else{
        div.classList.add("inner-incoming");
        htmlFullName= `<div class="inner-name">${data.fullName}</div>`
    }

    if(data.content){
        htmlContent= `
            <div class="inner-content">${data.content}</div>
        `
    }

    if(data.images) {
        htmlImages += `<div class="inner-images">` ;

        for(const image of data.images){
            htmlImages +=  `
                <img src="${image}">       
            `
        }

        htmlImages += `</div>` ;
    }

    div.innerHTML= `
        ${htmlFullName}
        ${htmlContent}
        ${htmlImages}
    `

    body.insertBefore(div, boxTyping);

    body.scrollTop = body.scrollHeight;

    // preview image
    const boxImage= div.querySelector(".inner-images");
    if(boxImage){
        const gallery= new Viewer(boxImage);
    }
    // end preview image
})
// end server_return_message

// Scroll chat to bottom

const bodyChat= document.querySelector(".chat .inner-body");
if(bodyChat){
    bodyChat.scrollTop = bodyChat.scrollHeight;
}

// end Scroll chat to bottom

// show typing
var timeOut;
const showTyping = () => {
    socket.emit("client_send_typing", "show");

    clearTimeout(timeOut);

    timeOut= setTimeout(() => {
        socket.emit("client_send_typing", "hidden")
    }, 3000);
}

// end show typing

// emoji
const buttonIcon= document.querySelector(".button-icon");
// console.log(buttonIcon);
if(buttonIcon){
    const tooltip= document.querySelector(".tooltip");
    Popper.createPopper(buttonIcon, tooltip)

    buttonIcon.onclick= () => {
        tooltip.classList.toggle('shown')
    }
}

const emojiPicker= document.querySelector('emoji-picker')
    if(emojiPicker){
        const inputChat= document.querySelector(".chat .inner-form input[name='content']");

        emojiPicker.addEventListener("emoji-click", (e) => {
            const icon= e.detail.unicode;
            console.log(icon);
            inputChat.value= inputChat.value + icon;
            
            const end= inputChat.value.length;
            inputChat.setSelectionRange(end, end);
            inputChat.scrollLeft = inputChat.scrollWidth;
            // inputChat.focus();

            showTyping();
        })

        inputChat.addEventListener("keyup", () => {
            showTyping();
        });

    }
// end emoji


// server_return_typing
const elementListTyping= document.querySelector(".chat .inner-list-typing");
if(elementListTyping){
    socket.on("server_return_typing", (data) => {
        if(data.type == "show"){
            const exitsTyping= elementListTyping.querySelector(`[user-id="${data.userId}"]`);
            if(!exitsTyping){
                const boxTyping= document.createElement("div");
                boxTyping.classList.add("box-typing");
                boxTyping.setAttribute("user-id", data.userId);

                boxTyping.innerHTML= `
                <div class="box-typing">
                    <div class="inner-name">${data.fullName}</div>
                    <div class="inner-dots">
                        <span> </span>
                        <span> </span>
                        <span> </span> 
                    </div>
                </div>`
                
                elementListTyping.appendChild(boxTyping);
                bodyChat.scrollTop = bodyChat.scrollHeight;
            }
        } else{
            const boxTypingRemove= elementListTyping.querySelector(`[user-id="${data.userId}"]`);

            if(boxTypingRemove){
                elementListTyping.removeChild(boxTypingRemove);
            }
        }
        
    });
};

// end server_return_typing


// preview image
const chatBody= document.querySelector(".chat .inner-body");
    if(chatBody){
        const gallery= new Viewer(chatBody);
    }
// end preview image 