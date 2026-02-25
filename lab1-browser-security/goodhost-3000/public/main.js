document.cookie = "SessionID=123456";

fetch("/api/emails")
  .then((r) => r.json())
  .then((emails) => {
    const list = document.getElementById("emailList");
    const subj = document.getElementById("emailSubject");
    const body = document.getElementById("emailBody");

    emails.forEach((e) => {
      const li = document.createElement("li");
      li.style.cursor = "pointer";
      li.textContent = `${e.sender}: ${e.subject}`;
      li.addEventListener("click", () => {
        subj.textContent = e.subject;
        body.textContent = e.body;
      });
      list.appendChild(li);
    });
  })
  .catch((err) => console.error(err));
