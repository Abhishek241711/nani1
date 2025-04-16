const protocol = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${protocol}://${location.host}`);

const chatWindow = document.getElementById("chatWindow");
const usernameInput = document.getElementById("username");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = localStorage.getItem("chatUser");

if (currentUser) {
  usernameInput.value = currentUser;
  usernameInput.disabled = true;
} else {
  usernameInput.addEventListener("blur", () => {
    const user = usernameInput.value.trim();
    if (user) {
      localStorage.setItem("chatUser", user);
      usernameInput.disabled = true;
      currentUser = user;
    }
  });
}

function appendMessage(user, text, imageUrl) {
  const div = document.createElement("div");
  div.classList.add("message");

  const isMe = user === currentUser;
  div.classList.add(isMe ? "me" : "them");

  div.innerHTML = `<strong>${user}</strong>: ${text || ""}`;

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    div.appendChild(img);
  }

  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "init") {
    data.messages.forEach((msg) => appendMessage(msg.user, msg.text, msg.image));
  } else if (data.type === "new") {
    const msg = data.message;
    appendMessage(msg.user, msg.text, msg.image);
  }
};

sendBtn.addEventListener("click", () => {
  const user = usernameInput.value.trim();
  const text = messageInput.value.trim();
  const file = imageInput.files[0];

  if (!user || (!text && !file)) return;

  if (!currentUser) {
    localStorage.setItem("chatUser", user);
    currentUser = user;
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      ws.send(JSON.stringify({ user, text, image: reader.result }));
    };
    reader.readAsDataURL(file);
  } else {
    ws.send(JSON.stringify({ user, text }));
  }

  messageInput.value = "";
  imageInput.value = null;
});
