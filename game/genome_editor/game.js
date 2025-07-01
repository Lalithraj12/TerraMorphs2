// Genome Editor Game with Intro, Hints, and Codon-to-Protein Mapping

export function run(container) {
  console.log("✅ Genome Editor game module loaded");

  const codonToProtein = {
    "ATG": "MitoSynthase",
    "CGT": "OxyBalancer",
    "TGC": "RadShield",
    "GGA": "MetaboPump"
  }

  const proteinToTrait = {
    "MitoSynthase": "Energy Regulation",
    "OxyBalancer": "Low Oxygen Tolerance",
    "RadShield": "Radiation Resistance",
    "MetaboPump": "High Metabolism"
  }

  const sequenceInput = [];

  const unlockedTraits = {
    "Radiation Resistance": localStorage.getItem("trait_Radiation Resistance") === "true",
    "Low Oxygen Tolerance": localStorage.getItem("trait_Low Oxygen Tolerance") === "true",
    "High Metabolism": localStorage.getItem("trait_High Metabolism") === "true"
    };

  // Initial guidance screen
  container.innerHTML = `
    <div id="introScreen" style="font-family: monospace; color: lime; text-align: center; padding: 30px;">
      <h2>🧬 Welcome to the Genome Editor</h2>
      <p>Your mission is to create a genome that will allow a new species to survive in a hostile environment.</p>
      <p>Enter 3-letter DNA codons (like ATG, CGT) to form a protein chain.</p>
      <p>Each protein maps to a specific trait. Select codons wisely based on your knowledge of the world’s conditions.</p>
      <p>Unlocked traits from other equipment will affect the viability of your species.</p>
      <button id="continueBtn" style="margin-top: 20px; padding: 10px 20px; background: #0f0; color: black; font-weight: bold; border: none; cursor: pointer;">Continue</button>
    </div>
    <div id="editorScreen" style="display: none; text-align: center;"></div>
  `;

  const continueBtn = container.querySelector('#continueBtn');
  const editorScreen = container.querySelector('#editorScreen');

  continueBtn.onclick = () => {
    document.getElementById('introScreen').style.display = 'none';
    editorScreen.style.display = 'block';

    const nameInput = document.createElement("input");
    nameInput.id = "speciesNameInput";
    nameInput.placeholder = "Enter species name (e.g. Homo sapiens)";
    nameInput.style.cssText = "font-size: 18px; padding: 6px; margin: 25px auto; display: block; width: 65%; text-align: center;";

    
    

    // disable character movement
    window.disableCharacterMovement = true;

    const startButton = document.createElement("button");
    startButton.textContent = "Start Genome Edit";
    startButton.style.cssText = "padding: 10px 20px; font-weight: bold; background: #0f0; color: black; border: none; cursor: pointer; margin-top: 10px;";
    editorScreen.appendChild(nameInput);
    editorScreen.appendChild(startButton);

    startButton.onclick = () => {
      const name = nameInput.value.trim();
      if (!/^[A-Z][a-z]+ [a-z]+$/.test(name)) {
        alert("❌ Please enter a valid binomial name (e.g., Homo sapiens)");
        return;
      }

      editorScreen.innerHTML = "";
      const title = document.createElement("h1");
      title.textContent = `🧬 ${name}`;
      title.style = "text-align:center; color:lime;";
      editorScreen.appendChild(title);

      const continueToEditorBtn = document.createElement("button");
      continueToEditorBtn.textContent = "Continue to Genome Editor";
      continueToEditorBtn.style.cssText = "display: block; margin: 20px auto; padding: 10px 20px; font-weight: bold; background: #0f0; color: black; border: none; cursor: pointer;";
      editorScreen.appendChild(continueToEditorBtn);

      continueToEditorBtn.onclick = () => {
        window.disableCharacterMovement = true;
        launchEditor(editorScreen);
      };
    };

    
  };

  function launchEditor(container) {
    container.innerHTML = `
      <div style="font-family: monospace; color: lime; display: flex; flex-direction: column; align-items: center; gap: 30px">
        
        <div style="width: 100%; max-width: 500px;">
          <h2>🧬 Choose DNA Codons</h2>
          <p>Hint: ATG = Energy, CGT = Oxygen, TGC = Radiation, GGA = Metabolism</p>
          <input type="text" id="codonInput" placeholder="e.g. ATG" maxlength="3" style="font-size: 16px; padding: 4px; width: 60px;">
          <button id="addCodon">Add</button>
          <div id="codonChain" style="margin-top: 10px;"></div>
          <div id="proteinChain" style="margin-top: 20px;"></div>
          <div id="traitList" style="margin-top: 20px;"></div>
<div id="envCompatibility" style="margin-top: 20px; font-size: 16px;">
  🌡 Heat Resistance: <span id="heatVal">0%</span><br>
  🪐 Radiation Tolerance: <span id="radVal">0%</span><br>
  🫁 Oxygen Efficiency: <span id="oxyVal">0%</span>
</div>
<div style="margin-top: 10px;">
  🧬 Genome Stability:
  <div style="background: #222; width: 100%; height: 20px;">
    <div id="genomeBar" style="background: lime; width: 0%; height: 100%;"></div>
  </div>
</div>
          <button id="finalizeGenome" style="margin-top: 20px; padding: 10px 20px; font-weight: bold; background: #0f0; color: black; border: none; cursor: pointer;">Assemble Genome</button>
          <div id="finalResult" style="margin-top: 10px; font-size: 18px;"></div>
        </div>
        <div style="width: 100%; max-width: 500px;">
          <h2>🌍 Environment Requirements for Survival</h2>
<ul>
  <li>🌡 Heat Resistance: ≥ 40%</li>
  <li>🪐 Radiation Tolerance: ≥ 30%</li>
  <li>🫁 Oxygen Efficiency: ≥ 45%</li>
</ul>
        </div>
      </div>
    `;

    const codonInput = container.querySelector('#codonInput');
    const addBtn = container.querySelector('#addCodon');
    const codonChainEl = container.querySelector('#codonChain');
    const proteinChainEl = container.querySelector('#proteinChain');
    const traitListEl = container.querySelector('#traitList');
    const finalizeBtn = container.querySelector('#finalizeGenome');
    const finalResult = container.querySelector('#finalResult');

    finalizeBtn.onclick = () => {
      finalResult.innerHTML = '<div style="color: lime; font-size: 16px;">🧬 Synthesizing...</div>';
      finalResult.style.transition = 'all 0.5s';
      finalResult.style.opacity = '0.5';
      setTimeout(() => {
        finalResult.style.opacity = '1';
        let heatScore = sequenceInput.filter(c => c === "ATG").length * 12;
        let radScore = sequenceInput.filter(c => c === "TGC").length * 10;
        let oxyScore = sequenceInput.filter(c => c === "CGT").length * 9;
        let success = heatScore >= 10 && radScore >= 9 && oxyScore >= 8;

        const survivalRate = Math.min((heatScore + radScore + oxyScore), 100);
        finalResult.innerHTML = success
          ? `<div style='font-size:18px; color:lime;'>✅ Genome synthesis successful!<br>Survival likelihood: ${survivalRate}%</div>`
          : `<div style='font-size:18px; color:orange;'>⚠️ Genome unstable.<br>Survival likelihood: ${survivalRate}%<br>Consider more efficient codons.</div>`;
        finalResult.innerHTML += `<div style='font-size:14px; color:yellow; margin-top: 10px;'>⚠️ Repetition of codons reduces effectiveness. Try more diversity.</div>`;

        if (success) {
          const uniqueCodons = [...new Set(sequenceInput)];
          const uniqueTraits = [...new Set(proteinChain.map(p => proteinToTrait[p]).filter(Boolean))];
          const summaryScreen = document.createElement("div");
          summaryScreen.style = "margin-top: 20px; padding: 20px; background: #111; border: 2px solid lime; font-size: 16px;";
          summaryScreen.innerHTML = `
            <h3 style='color: lime;'>🧬 Genome Complete</h3>
            <p><strong>Full Genome Sequence:</strong><br>${sequenceInput.join(" - ")}</p>
            <p><strong>Unique Traits Generated:</strong><br>${uniqueTraits.join(", ")}</p>
            <!-- Button: Go to Atmospheric Spectrometer (next level) -->
          `;
          finalResult.appendChild(summaryScreen);
          document.getElementById("gotoSynthesis").onclick = () => {
            alert("🚀 Loading Synthesis Console...");
            // Trigger next level transition or callback here
          };
        }
      }, 1000);
    };

    const proteinChain = [];

    addBtn.onclick = () => {
      const heat = document.getElementById('heatVal');
      const rad = document.getElementById('radVal');
      const oxy = document.getElementById('oxyVal');
      const genomeBar = document.getElementById('genomeBar');
      const codon = codonInput.value.toUpperCase();
      if (!/^[ATGC]{3}$/.test(codon)) {
        alert("❌ Invalid codon. Use 3 letters A/T/G/C.");
        return;
      }
      if (sequenceInput.length < 15) {
        sequenceInput.push(codon);
      } else {
        sequenceInput.shift();
        sequenceInput.push(codon);
      }
      const lastCodon = sequenceInput[sequenceInput.length - 1];
      let effect = "+5% Unknown Stability";
      if (lastCodon === "ATG") effect = "+5% Energy";
      else if (lastCodon === "CGT") effect = "+4% Oxygen Efficiency";
      else if (lastCodon === "TGC") effect = "+3% Radiation Shielding";
      else if (lastCodon === "GGA") effect = "+5% Metabolic Rate";
      codonChainEl.innerHTML = `<div style="font-size: 36px; text-align: center; margin: 10px;">
        <strong>${lastCodon}</strong>
        <div style="font-size: 16px; margin-top: 4px;">${effect}</div>
      </div>`;

      if (codonToProtein[codon]) {
        const protein = codonToProtein[codon];
        proteinChain.push(protein);
        proteinChainEl.innerHTML = `Protein Generated: ${proteinChain[proteinChain.length - 1]}`;

        const traits = proteinChain.map(p => proteinToTrait[p]).filter(Boolean);
        traitListEl.innerHTML = `Trait Unlocked: ${traits[traits.length - 1]}`;
      } else {
        proteinChainEl.innerHTML = `⚠️ Codon '${codon}' does not map to a known protein.`;
      }
      codonInput.value = "";

      // Count consecutive repeats
      function countConsecutiveRepeats(arr, codon) {
        let penalty = 0;
        for (let i = 1; i < arr.length; i++) {
          if (arr[i] === codon && arr[i - 1] === codon) penalty++;
        }
        return penalty;
      }

      let heatRepeats = countConsecutiveRepeats(sequenceInput, "GGA");
      let radRepeats = countConsecutiveRepeats(sequenceInput, "TGC");
      let oxyRepeats = countConsecutiveRepeats(sequenceInput, "CGT");

      let heatVal = Math.max(0, sequenceInput.filter(c => c === "GGA").length * 8 - heatRepeats * 5);
      let radVal = Math.max(0, sequenceInput.filter(c => c === "TGC").length * 5 - radRepeats * 3);
      let oxyVal = Math.max(0, sequenceInput.filter(c => c === "CGT").length * 6 - oxyRepeats * 4);

      heat.textContent = `${heatVal}%`;
      rad.textContent = `${radVal}%`;
      oxy.textContent = `${oxyVal}%`;
      genomeBar.style.width = `${Math.min(sequenceInput.length * 10, 100)}%`;
    };

  } 
};

