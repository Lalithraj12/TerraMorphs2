// bioForge.js - Condition Simulation Game Module

(function() {
  const conditionData = {
    "Water Overload": {
      description: "The body has excess water. It needs to reduce water retention to avoid cellular damage.",
      options: ["Activate aquaporins", "Increase sweat rate", "Store water in vacuole", "Suppress ADH"],
      correct: "Suppress ADH",
      effect: "Suppressing ADH reduces water reabsorption in kidneys, helping expel excess water."
    },
    "Cold": {
      description: "Low temperature environment. The organism needs to maintain core body temperature.",
      options: ["Increase metabolism", "Dilate blood vessels", "Sweat more", "Hibernate"],
      correct: "Increase metabolism",
      effect: "Higher metabolism generates internal heat, aiding survival in cold environments."
    },
    "Low Oxygen": {
      description: "Oxygen availability is reduced, especially at high altitudes.",
      options: ["Increase heart rate", "Increase hemoglobin", "Hyperventilate", "Hold breath"],
      correct: "Increase hemoglobin",
      effect: "Elevated hemoglobin improves oxygen transport under hypoxic conditions."
    },
    "UV Exposure": {
      description: "Excessive UV radiation exposure can damage cells and DNA.",
      options: ["Produce melanin", "Increase sweating", "Widen pupils", "Decrease blood flow"],
      correct: "Produce melanin",
      effect: "Melanin absorbs harmful UV rays, protecting underlying tissues."
    },
    "High Salt": {
      description: "The environment has high salt concentration, leading to cellular dehydration.",
      options: ["Drink more water", "Accumulate solutes", "Open salt channels", "Decrease urine output"],
      correct: "Accumulate solutes",
      effect: "Accumulating solutes balances internal osmolarity and prevents water loss."
    },
    "Dehydration": {
      description: "The body is losing water faster than it's being replenished.",
      options: ["Suppress ADH", "Drink seawater", "Increase ADH", "Sweat more"],
      correct: "Increase ADH",
      effect: "ADH helps conserve water by promoting reabsorption in the kidneys."
    }
  };

  let lives;
  let completedConditions;
  let userResponses;
  let geneBankData;
  let currentCondition = null;

  function saveProgress() {
    localStorage.setItem('completedConditions', JSON.stringify([...completedConditions]));
    localStorage.setItem('userResponses', JSON.stringify(userResponses));
    localStorage.setItem('geneBankData', JSON.stringify(geneBankData));
  }

  function updateCompletedUI() {
    const container = document.getElementById("conditionContainer");
    container.innerHTML = '';
    for (const condition in conditionData) {
      if (!completedConditions.has(condition)) {
        const block = document.createElement('div');
        block.className = 'condition-block';
        block.setAttribute('data-condition', condition);
        block.textContent = condition;
        block.addEventListener('click', () => openCondition(condition));
        container.appendChild(block);
      }
    }
    container.style.display = "flex";
    document.getElementById("livesLeft").textContent = lives;
  }

  function openCondition(condition) {
    if (!conditionData[condition]) {
      alert('Condition data not found.');
      return;
    }
    currentCondition = condition;
    document.getElementById("conditionContainer").style.display = "none";
    document.getElementById("introText").style.display = "none";
    document.getElementById("summaryScreen").style.display = "none";
    document.getElementById("geneBank").style.display = "none";

    const data = conditionData[condition];
    const optionsHTML = data.options.map(opt => 
      `<button class='option-button' data-opt='${opt}'>${opt}</button>`
    ).join('');

    document.getElementById("conditionDetail").innerHTML = `
      <h2>${condition}</h2>
      <p>${data.description}</p>
      <div id="optionButtons">${optionsHTML}</div>
      <p id="statusMessage"></p>
      <button class="back-button" id="backButton">🔙 Back</button>
    `;

    document.getElementById("conditionDetail").style.display = "block";
    document.getElementById("backButton").addEventListener("click", goBack);
    document.querySelectorAll(".option-button").forEach(button => {
      button.addEventListener("click", () => selectOption(button, button.getAttribute("data-opt"), currentCondition));
    });
  }

  function selectOption(button, selected, condition) {
    const buttons = document.querySelectorAll('.option-button');
    buttons.forEach(btn => btn.classList.remove('option-selected'));
    button.classList.add('option-selected');
    button.style.backgroundColor = '#ffffff';
    button.style.borderColor = '#000000';
    button.style.color = '#000000';

    const correct = conditionData[condition].correct;

    if (selected !== correct) {
      lives--;
      if (lives <= 0) {
        alert("Game over. You have exhausted all lives.");
        location.reload();
        return;
      } else {
        document.getElementById("statusMessage").textContent = `❌ Incorrect! Lives remaining: ${lives}`;
        document.getElementById("statusMessage").style.color = "red";
        updateCompletedUI();
        return;
      }
    }

    document.getElementById("statusMessage").textContent = "✅ Response saved. Continue to the next condition.";
    document.getElementById("statusMessage").style.color = "blue";

    userResponses[condition] = selected;
    completedConditions.add(condition);

    if (!geneBankData.includes(condition)) {
      geneBankData.push(condition);
    }

    saveProgress();
    updateCompletedUI();

    if (completedConditions.size === Object.keys(conditionData).length) {
      document.getElementById("conditionDetail").style.display = "none";
      showSummary();
    }
  }

  function showSummary() {
    const summary = document.getElementById("summaryScreen");
    summary.innerHTML = `<h2>🧬 Adaptation Summary</h2><ul style='text-align:left;max-width:500px;margin:0 auto;'>`;
    for (let condition of completedConditions) {
      summary.innerHTML += `<li>✅ <strong>${condition}</strong>: ${conditionData[condition].effect}</li>`;
    }
    summary.innerHTML += `</ul><p><strong>Note:</strong> These adaptations will increase the survival percentage in the upcoming tasks.</p>`;
    summary.innerHTML += `<button class="back-button" onclick="goBack()">🔁 Back to Conditions</button>`;
    summary.style.display = "block";
  }

  function goBack() {
    document.getElementById("conditionDetail").style.display = "none";
    document.getElementById("summaryScreen").style.display = "none";
    document.getElementById("geneBank").style.display = "none";
    document.getElementById("introText").style.display = "block";
    updateCompletedUI();
  }

  function renderBioForgeUI(containerId) {
  const container = document.getElementById(containerId);
  container.style.backgroundColor = "#ffffff";   // set white background
  container.style.color = "#000000";             // ensure text is black
  container.style.padding = "30px";
  container.style.minHeight = "100vh";

  container.innerHTML = `
    <div style="max-width: 700px; margin: 0 auto; text-align: center; font-size: 18px;">
      <h2 style="font-size: 28px;">🌡️ Select a Physiological Condition</h2>
      <p id="introText">Click on a condition to learn more and begin the response simulation.</p>
      <div id="livesDisplay" style="margin: 10px 0; font-size: 20px;">❤️ Lives Left: <span id="livesLeft">3</span></div>
      <div class="condition-container" id="conditionContainer" style="gap: 15px;"></div>
      <div id="conditionDetail" class="condition-detail"></div>
      <div id="summaryScreen" class="condition-detail"></div>
      <div id="geneBank" class="condition-detail"></div>
    </div>
  `;
}

  window.loadBioForgeGame = function(containerId) {
    lives = 3;
    completedConditions = new Set(JSON.parse(localStorage.getItem('completedConditions') || '[]'));
    userResponses = JSON.parse(localStorage.getItem('userResponses') || '{}');
    geneBankData = JSON.parse(localStorage.getItem('geneBankData') || '[]');

    renderBioForgeUI(containerId);
    updateCompletedUI();
  }
})();
