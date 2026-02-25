const btn = document.createElement("button");
btn.textContent = "Chat with Support";
btn.style.position = "fixed";
btn.style.right = "20px";
btn.style.bottom = "20px";
btn.style.padding = "10px 14px";
btn.style.border = "0";
btn.style.borderRadius = "10px";
btn.style.cursor = "pointer";
document.body.appendChild(btn);

btn.addEventListener("click", () => {
  fetch("http://localhost:4000/messages")
    .then((r) => r.json())
    .then((d) => console.log("Support:", d))
    .catch((e) => console.error("Support fetch error:", e));
});