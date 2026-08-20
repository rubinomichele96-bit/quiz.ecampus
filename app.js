let domandePaniere = [];
let indiceAttuale = 0;
let punteggio = 0;

document.getElementById("json-input").addEventListener("change", gestisciCaricamentoFile);

function gestisciCaricamentoFile(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const datiCaricati = JSON.parse(e.target.result);
        
        // Estrazione intelligente dell'array domande
        if (Array.isArray(datiCaricati)) {
          domandePaniere = datiCaricati;
        } else if (datiCaricati && Array.isArray(datiCaricati.domande)) {
          domandePaniere = datiCaricati.domande;
        } else if (datiCaricati && Array.isArray(datiCaricati[0])) {
          // Gestione caso matrice residua
          domandePaniere = datiCaricati[0];
        } else {
          domandePaniere = [];
        }
  
        console.log("Domande caricate con successo:", domandePaniere);
  
        if (domandePaniere.length > 0) {
          mescolaArray(domandePaniere);
          indiceAttuale = 0;
          punteggio = 0;
          avviaQuiz();
        } else {
          alert("Il file JSON non contiene un array 'domande' valido.");
        }
      } catch (error) {
        console.error("Errore di Parsing JSON:", error);
        alert("Errore nella sintassi del file JSON: " + error.message);
      } finally {
        // Resetta l'input per Safari Mobile
        event.target.value = "";
      }
    };
  
    // Forzatura codifica UTF-8 esplicita
    reader.readAsText(file, "UTF-8");
  }
  

function mescolaArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function avviaQuiz() {
  document.getElementById("screen-setup").classList.add("hidden");
  document.getElementById("screen-results").classList.add("hidden");
  document.getElementById("screen-quiz").classList.remove("hidden");
  caricaDomandaCorrente();
}

function caricaDomandaCorrente() {
  const domandaOggetto = domandePaniere[indiceAttuale];

  if (!domandaOggetto) {
    console.error("Domanda non trovata all'indice:", indiceAttuale);
    return;
  }
  
  // Mostra il conteggio aggiornato
  document.getElementById("quiz-badge").innerText = `Domanda ${indiceAttuale + 1} di ${domandePaniere.length}`;
  
  // Riconoscimento dinamico del testo della domanda
  const testoDomanda = domandaOggetto.quesito || domandaOggetto.domanda || domandaOggetto.testo || "Domanda senza testo";
  document.getElementById("quiz-question").innerText = testoDomanda;

  const container = document.getElementById("options-container");
  container.innerHTML = "";

  // 1. Gestione DOMANDE A RISPOSTA MULTIPLA
  if (domandaOggetto.tipo === "Multipla" && Array.isArray(domandaOggetto.opzioni) && domandaOggetto.opzioni.length > 0) {
    domandaOggetto.opzioni.forEach((opzione) => {
      const btn = document.createElement("button");
      btn.className = "btn-option";
      btn.innerText = opzione;
      
      const lettera = opzione.trim().charAt(0);
      btn.onclick = () => verificaRisposta(lettera, btn);
      container.appendChild(btn);
    });
  } 
  // 2. Gestione DOMANDE APERTE (Crea Textarea + Pulsante di conferma)
  else if (domandaOggetto.tipo === "Aperta" || !domandaOggetto.opzioni || domandaOggetto.opzioni.length === 0) {
    const textArea = document.createElement("textarea");
    textArea.id = "risposta-utente";
    textArea.placeholder = "Scrivi qui la tua risposta...";
    textArea.rows = 4;
    textArea.style.cssText = "width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; font-family: inherit; resize: vertical; box-sizing: border-box;";

    const btnConferma = document.createElement("button");
    btnConferma.id = "btn-conferma-aperta";
    btnConferma.className = "btn-option";
    btnConferma.style.marginTop = "10px";
    btnConferma.innerText = "Conferma Risposta";
    btnConferma.onclick = () => mostraSpiegazioneAperta();

    container.appendChild(textArea);
    container.appendChild(btnConferma);
  }

  document.getElementById("explanation-box").classList.add("hidden");
}

function verificaRisposta(letteraSelezionata, bottoneCliccato) {
  const domandaOggetto = domandePaniere[indiceAttuale];
  const tuttiIBottoni = document.querySelectorAll(".btn-option");

  tuttiIBottoni.forEach(btn => btn.style.pointerEvents = "none");

  const rispostaEsatta = domandaOggetto.risposta_corretta;

  if (letteraSelezionata === rispostaEsatta) {
    bottoneCliccato.classList.add("correct");
    punteggio++;
  } else {
    bottoneCliccato.classList.add("wrong");
  }

  tuttiIBottoni.forEach(btn => {
    const letteraBtn = btn.innerText.trim().charAt(0);
    if (letteraBtn === rispostaEsatta) {
      btn.classList.add("correct");
    }
  });

  // Lettura sicura della spiegazione associata alla lettera selezionata
  const testoSpiegazione = (domandaOggetto.spiegazioni && domandaOggetto.spiegazioni[letteraSelezionata]) 
    ? domandaOggetto.spiegazioni[letteraSelezionata] 
    : "Spiegazione non disponibile per questa opzione.";

  document.getElementById("explanation-text").innerText = testoSpiegazione;
  document.getElementById("explanation-box").classList.remove("hidden");
}

function mostraSpiegazioneAperta() {
  const domandaOggetto = domandePaniere[indiceAttuale];
  const textArea = document.getElementById("risposta-utente");
  const testoInserito = textArea ? textArea.value.trim() : "";

  if (!testoInserito) {
    alert("Scrivi una risposta prima di confermare!");
    return;
  }

  // Disabilita la casella di testo e il pulsante
  textArea.disabled = true;
  const btnConferma = document.getElementById("btn-conferma-aperta");
  if (btnConferma) btnConferma.style.pointerEvents = "none";

  // Rileva la risposta modello se presente
  const testoModello = (domandaOggetto.spiegazioni && domandaOggetto.spiegazioni.risposta_modello)
    ? domandaOggetto.spiegazioni.risposta_modello
    : (domandaOggetto.risposta_corretta || "Risposta modello non disponibile.");

  // Compone l'HTML con il confronto tra testo inserito e risposta modello
  const explanationEl = document.getElementById("explanation-text");
  explanationEl.innerHTML = `
    <div style="margin-bottom: 10px;">
      <strong>La tua risposta:</strong>
      <p style="font-style: italic; margin-top: 4px;">"${testoInserito}"</p>
    </div>
    <hr style="border: 0; border-top: 1px solid #ccc; margin: 8px 0;">
    <div>
      <strong>Risposta modello / Soluzione:</strong>
      <p style="margin-top: 4px;">${testoModello}</p>
    </div>
  `;

  document.getElementById("explanation-box").classList.remove("hidden");
}

function prossimaStep() {
  indiceAttuale++;
  if (indiceAttuale < domandePaniere.length) {
    caricaDomandaCorrente();
  } else {
    mostraRisultati();
  }
}

function mostraRisultati() {
  document.getElementById("screen-quiz").classList.add("hidden");
  document.getElementById("screen-results").classList.remove("hidden");
  
  const percentuale = domandePaniere.length > 0 
    ? Math.round((punteggio / domandePaniere.length) * 100) 
    : 0;
    
  document.getElementById("final-score").innerText = `${punteggio} / ${domandePaniere.length}`;
  document.getElementById("final-percentage").innerText = `Punteggio totale: ${percentuale}%`;
}

function ricominciaQuiz() {
  mescolaArray(domandePaniere);
  indiceAttuale = 0;
  punteggio = 0;
  avviaQuiz();
}