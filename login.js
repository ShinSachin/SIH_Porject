document.getElementById("loginBtn").onclick = function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  fetch("users.csv")
    .then(res => res.text())
    .then(data => {
      const rows = data.trim().split("\n").slice(1); 
      const users = rows.map(r => r.split(","));
      const valid = users.find(u => u[0] === username && u[1] === password);

      if (valid) {
        localStorage.setItem("loggedIn", "true");
        window.location.href = "index.html";
      } else {
        document.getElementById("loginMsg").textContent = "Invalid credentials";
        document.getElementById("loginMsg").style.color = "red";
      }
    });
};
