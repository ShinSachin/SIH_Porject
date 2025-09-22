(function () {
  const STORAGE_KEY = "prescriptions";
  const $ = id => document.getElementById(id);

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function showMsg(msg, error = false) {
    $("message").textContent = msg;
    $("message").style.color = error ? "red" : "#666";
  }

  function addMedRow(med = { name: "", dose: "", freq: "" }) {
    const row = document.createElement("div");
    row.className = "med-row";
    row.innerHTML = `
      <input type="text" class="med-name" placeholder="Medicine" value="${med.name}">
      <input type="text" class="med-dose" placeholder="Dose" value="${med.dose}">
      <input type="text" class="med-freq" placeholder="Frequency" value="${med.freq}">
      <button type="button" class="remove">X</button>
    `;
    row.querySelector(".remove").onclick = () => row.remove();
    $("medList").appendChild(row);
  }

  function readForm() {
    const doctor = $("doctor").value.trim();
    const patient = $("patient").value.trim();
    const notes = $("notes").value.trim();
    const meds = [...document.querySelectorAll(".med-row")].map(r => ({
      name: r.querySelector(".med-name").value.trim(),
      dose: r.querySelector(".med-dose").value.trim(),
      freq: r.querySelector(".med-freq").value.trim(),
    })).filter(m => m.name);

    return { doctor, patient, notes, meds };
  }

  function validate(p) {
    if (!p.doctor) return "Doctor name required";
    if (!p.patient) return "Patient name required";
    if (p.meds.length === 0) return "At least 1 medicine required";
    return "";
  }

  function generateQR(pres) {
    const container = $("qrContainer");
    container.innerHTML = "";
    const qrText = `
Doctor: ${pres.doctor}
Patient: ${pres.patient}
Notes: ${pres.notes}
Medications:
${pres.meds.map(m => `${m.name} ${m.dose} ${m.freq}`).join("\n")}
    `;
    new QRCode(container, {
      text: qrText,
      width: 120,
      height: 120,
      colorDark: "#2563eb",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  function savePres() {
    const pres = readForm();
    const err = validate(pres);
    if (err) return showMsg(err, true);

    pres.id = Date.now();
    pres.date = new Date().toLocaleString();

    const all = loadAll();
    all.unshift(pres);
    saveAll(all);
    renderList();
    showMsg("Saved ✔");
    generateQR(pres);
  }

  function renderList(filter = "") {
    const list = $("savedList");
    list.innerHTML = "";
    const all = loadAll().filter(p => (p.patient + p.doctor).toLowerCase().includes(filter.toLowerCase()));
    if (all.length === 0) { list.innerHTML = "<p class='muted'>No prescriptions</p>"; return; }

    all.forEach(p => {
      const div = document.createElement("div");
      div.className = "pres-item";
      div.innerHTML = `
        <strong>${p.patient}</strong> — ${p.doctor}<br>
        <small>${p.date}</small>
        <div class="actions">
          <button class="load">Load</button>
          <button class="del">Delete</button>
        </div>
      `;
      div.querySelector(".load").onclick = () => { populateForm(p); generateQR(p); };
      div.querySelector(".del").onclick = () => deletePres(p.id);
      list.appendChild(div);
    });
  }

  function populateForm(p) {
    $("doctor").value = p.doctor;
    $("patient").value = p.patient;
    $("notes").value = p.notes;
    $("medList").innerHTML = "";
    p.meds.forEach(m => addMedRow(m));
  }

  function deletePres(id) {
    let all = loadAll().filter(p => p.id !== id);
    saveAll(all);
    renderList();
    showMsg("Deleted ✔");
    $("qrContainer").innerHTML = "";
  }

  function clearAll() {
    if (confirm("Delete all prescriptions?")) {
      localStorage.removeItem(STORAGE_KEY);
      renderList();
      $("qrContainer").innerHTML = "";
    }
  }

  function printPres() {
    const p = readForm();
    if (validate(p)) return showMsg("Fill doctor, patient & meds first", true);

    const w = window.open("", "_blank", "width=600,height=800");
    w.document.write("<h2>Prescription</h2>");
    w.document.write(`<p><strong>Doctor:</strong> ${p.doctor}</p>`);
    w.document.write(`<p><strong>Patient:</strong> ${p.patient}</p>`);
    w.document.write("<h3>Medications</h3><ul>");
    p.meds.forEach(m => w.document.write(`<li>${m.name} ${m.dose} ${m.freq}</li>`));
    w.document.write("</ul>");
    w.document.write(`<p><strong>Notes:</strong> ${p.notes}</p>`);
    w.document.write('<div id="qrcode"></div>');

    const qrScript = w.document.createElement("script");
    qrScript.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    qrScript.onload = () => {
      new w.QRCode(w.document.getElementById("qrcode"), {
        text: JSON.stringify(p),
        width: 120,
        height: 120,
        colorDark: "#2563eb",
        colorLight: "#ffffff",
        correctLevel: w.QRCode.CorrectLevel.H
      });
    };
    w.document.body.appendChild(qrScript);

    w.print();
  }

  function init() {
    $("addMed").onclick = () => addMedRow();
    $("savePres").onclick = savePres;
    $("printPres").onclick = printPres;
    $("clearForm").onclick = () => {
      if (confirm("Clear form?")) {
        $("doctor").value = "";
        $("patient").value = "";
        $("notes").value = "";
        $("medList").innerHTML = "";
        $("qrContainer").innerHTML = "";
      }
    };
    $("clearAll").onclick = clearAll;
    $("search").oninput = e => renderList(e.target.value);

    addMedRow();
    renderList();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
