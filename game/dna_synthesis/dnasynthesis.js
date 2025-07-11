// DNA Synthesis Lab - Full UI and Logic
// Canvas-based module to finalize organism genome

(function () {
  const MAX_ENERGY = 50;
  const MAX_SLOTS = 8;

  let availableTraits = [];
  let selectedTraits = [];
  let totalEnergyUsed = 0;

  function getAllTraitsFromStorage() {
    const bioForge = JSON.parse(localStorage.getItem('geneBankData') || '[]');
    const traitDraft = JSON.parse(localStorage.getItem('selectedTraitsDraft') || '[]');
    return [...bioForge.map(name => ({ name, cost: 5, importance: 'Core survival trait.' })), ...traitDraft];
  }

  function renderDNAUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    availableTraits = getAllTraitsFromStorage();
    selectedTraits = [];
    totalEnergyUsed = 0;

    container.innerHTML = `
      <style>
        .trait-card { border: 1px solid #ccc; padding: 10px; margin: 5px; background: #fff; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .trait-card:hover { background: #f0f0f0; }
        .slot { border: 2px dashed #999; width: 160px; min-height: 80px; margin: 10px; padding: 10px; background: #fafafa; text-align: center; }
        .slot.filled { border-style: solid; background: #d0ffd0; }
      </style>

      <h2>🧬 DNA Synthesis Lab</h2>
      <p>Select up to ${MAX_SLOTS} traits. Max energy: ${MAX_ENERGY}</p>

      <div><strong>Energy Used:</strong> <span id="energyUsed">0</span> / ${MAX_ENERGY}</div>

      <div id="dnaSlots" style="display:flex; flex-wrap:wrap; gap:10px; margin:20px 0;"></div>

      <h3>Available Traits</h3>
      <div id="traitPool" style="display:flex; flex-wrap:wrap; gap:10px;"></div>

      <button id="finalizeBtn">✅ Finalize DNA</button>
      <div id="resultMessage"></div>
    `;

    renderTraitPool();
    renderDNASlots();
    document.getElementById("finalizeBtn").onclick = finalizeDNA;
  }

  function renderTraitPool() {
    const pool = document.getElementById("traitPool");
    pool.innerHTML = '';

    availableTraits.forEach((trait, index) => {
      const div = document.createElement("div");
      div.className = "trait-card";
      div.innerHTML = `<strong>${trait.name}</strong><br><em>${trait.importance}</em><br>Cost: ${trait.cost}`;
      div.onclick = () => addTraitToDNA(trait, index);
      pool.appendChild(div);
    });
  }

  function renderDNASlots() {
    const slots = document.getElementById("dnaSlots");
    slots.innerHTML = '';
    for (let i = 0; i < MAX_SLOTS; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.id = `slot-${i}`;
      slot.textContent = selectedTraits[i] ? selectedTraits[i].name : `Slot ${i + 1}`;
      if (selectedTraits[i]) slot.classList.add('filled');
      slot.onclick = () => {
        if (selectedTraits[i]) removeTraitFromSlot(i);
      };
      slots.appendChild(slot);
    }
  }

  function addTraitToDNA(trait, index) {
    if (selectedTraits.length >= MAX_SLOTS) return alert("All slots are filled.");
    if (totalEnergyUsed + trait.cost > MAX_ENERGY) return alert("Not enough energy.");

    selectedTraits.push(trait);
    totalEnergyUsed += trait.cost;
    availableTraits.splice(index, 1);

    updateUI();
  }

  function removeTraitFromSlot(i) {
    const removed = selectedTraits.splice(i, 1)[0];
    availableTraits.push(removed);
    totalEnergyUsed -= removed.cost;
    updateUI();
  }

  function updateUI() {
    document.getElementById("energyUsed").textContent = totalEnergyUsed;
    renderTraitPool();
    renderDNASlots();
  }

  function finalizeDNA() {
    if (selectedTraits.length < 4) return alert("You must select at least 4 traits.");
    localStorage.setItem('finalDNASequence', JSON.stringify(selectedTraits));
    document.getElementById("resultMessage").innerHTML = `<p>✅ DNA Synthesis Complete! ${selectedTraits.length} traits saved for next module.</p>`;
  }

  window.loadDNASynthesisLab = function (containerId) {
    renderDNAUI(containerId);
  };
})();
// DNA Synthesis Lab - Full UI and Logic
// Canvas-based module to finalize organism genome

(function () {
  const MAX_ENERGY = 50;
  const MAX_SLOTS = 8;

  let availableTraits = [];
  let selectedTraits = [];
  let totalEnergyUsed = 0;

  function getAllTraitsFromStorage() {
    const bioForge = JSON.parse(localStorage.getItem('geneBankData') || '[]');
    const traitDraft = JSON.parse(localStorage.getItem('selectedTraitsDraft') || '[]');
    return [...bioForge.map(name => ({ name, cost: 5, importance: 'Core survival trait.' })), ...traitDraft];
  }

  function renderDNAUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    availableTraits = getAllTraitsFromStorage();
    selectedTraits = [];
    totalEnergyUsed = 0;

    container.innerHTML = `
      <style>
        .trait-card { border: 1px solid #ccc; padding: 10px; margin: 5px; background: #fff; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .trait-card:hover { background: #f0f0f0; }
        .slot { border: 2px dashed #999; width: 160px; min-height: 80px; margin: 10px; padding: 10px; background: #fafafa; text-align: center; }
        .slot.filled { border-style: solid; background: #d0ffd0; }
      </style>

      <h2>🧬 DNA Synthesis Lab</h2>
      <p>Select up to ${MAX_SLOTS} traits. Max energy: ${MAX_ENERGY}</p>

      <div><strong>Energy Used:</strong> <span id="energyUsed">0</span> / ${MAX_ENERGY}</div>

      <div id="dnaSlots" style="display:flex; flex-wrap:wrap; gap:10px; margin:20px 0;"></div>

      <h3>Available Traits</h3>
      <div id="traitPool" style="display:flex; flex-wrap:wrap; gap:10px;"></div>

      <button id="finalizeBtn">✅ Finalize DNA</button>
      <div id="resultMessage"></div>
    `;

    renderTraitPool();
    renderDNASlots();
    document.getElementById("finalizeBtn").onclick = finalizeDNA;
  }

  function renderTraitPool() {
    const pool = document.getElementById("traitPool");
    pool.innerHTML = '';

    availableTraits.forEach((trait, index) => {
      const div = document.createElement("div");
      div.className = "trait-card";
      div.innerHTML = `<strong>${trait.name}</strong><br><em>${trait.importance}</em><br>Cost: ${trait.cost}`;
      div.onclick = () => addTraitToDNA(trait, index);
      pool.appendChild(div);
    });
  }

  function renderDNASlots() {
    const slots = document.getElementById("dnaSlots");
    slots.innerHTML = '';
    for (let i = 0; i < MAX_SLOTS; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.id = `slot-${i}`;
      slot.textContent = selectedTraits[i] ? selectedTraits[i].name : `Slot ${i + 1}`;
      if (selectedTraits[i]) slot.classList.add('filled');
      slot.onclick = () => {
        if (selectedTraits[i]) removeTraitFromSlot(i);
      };
      slots.appendChild(slot);
    }
  }

  function addTraitToDNA(trait, index) {
    if (selectedTraits.length >= MAX_SLOTS) return alert("All slots are filled.");
    if (totalEnergyUsed + trait.cost > MAX_ENERGY) return alert("Not enough energy.");

    selectedTraits.push(trait);
    totalEnergyUsed += trait.cost;
    availableTraits.splice(index, 1);

    updateUI();
  }

  function removeTraitFromSlot(i) {
    const removed = selectedTraits.splice(i, 1)[0];
    availableTraits.push(removed);
    totalEnergyUsed -= removed.cost;
    updateUI();
  }

  function updateUI() {
    document.getElementById("energyUsed").textContent = totalEnergyUsed;
    renderTraitPool();
    renderDNASlots();
  }

  function finalizeDNA() {
    if (selectedTraits.length < 4) return alert("You must select at least 4 traits.");
    localStorage.setItem('finalDNASequence', JSON.stringify(selectedTraits));
    document.getElementById("resultMessage").innerHTML = `<p>✅ DNA Synthesis Complete! ${selectedTraits.length} traits saved for next module.</p>`;
  }

  window.loadDNASynthesisLab = function (containerId) {
    renderDNAUI(containerId);
  };
})();
