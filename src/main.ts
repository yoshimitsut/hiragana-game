import { words } from "./words";
import {
  startRound,
  placeTileAt,
  removeTileFromSlot,
  isComplete,
  isCorrect,
  type RoundState,
} from "./game";
import "./style.css";

let currentWordIndex = 0;
let state: RoundState = startRound(words[currentWordIndex]);

const app = document.querySelector<HTMLDivElement>("#app")!;

function render() {
  const complete = isComplete(state);
  const correct = complete && isCorrect(state);

  app.innerHTML = `
    <header class="game-header">
      <div class="challenge-prompt">Monte a palavra em Hiragana</div>
      ${
        state.word.image
          ? `<div class="word-image-wrapper">
               <img src="${state.word.image}" alt="${state.word.pt}" class="word-image" />
             </div>`
          : ""
      }
      <h1 class="target-word">${state.word.pt}</h1>
    </header>

    <!-- Slots / Buracos estilo Duolingo -->
    <div class="slots-container">
      ${state.slots
        .map((tile, idx) => {
          if (tile) {
            return `
              <div class="slot occupied" data-slot="${idx}">
                <button
                  class="tile"
                  draggable="true"
                  data-tile-uid="${tile.uid}"
                  data-from="slot"
                  data-slot-idx="${idx}"
                  title="Clique para remover ou arraste"
                >${tile.char}</button>
              </div>
            `;
          } else {
            return `
              <div
                class="slot empty"
                data-slot="${idx}"
                data-slot-empty="true"
                title="Solte o ideograma aqui"
              ></div>
            `;
          }
        })
        .join("")}
    </div>

    <!-- Banco de ideogramas disponíveis -->
    <div class="pool" data-pool-area="true">
      ${state.pool
        .map(
          (tile) => `
            <button
              class="tile"
              draggable="true"
              data-tile-uid="${tile.uid}"
              data-from="pool"
              title="Clique para enviar ou arraste até o buraco"
            >${tile.char}</button>
          `
        )
        .join("")}
    </div>

    <!-- Feedback e Próxima Palavra -->
    <div class="feedback-box">
      ${
        complete
          ? correct
            ? `
              <div class="feedback-msg correct">
                <span>🎉</span>
                <span>Excelente! (${state.word.romaji})</span>
              </div>
              <button class="btn-next" id="btn-next">Continuar →</button>
            `
            : `
              <div class="feedback-msg wrong">
                <span>❌</span>
                <span>Não foi dessa vez, tente novamente!</span>
              </div>
            `
          : `<p style="color: var(--text-muted); font-size: 0.9rem;">Arraste ou clique nos ideogramas para preencher os espaços</p>`
      }
    </div>
  `;

  attachInteractions();
}

// Vincula eventos de clique, Drag and Drop nativo e Touch para smartphone
function attachInteractions() {
  // Próxima rodada
  const btnNext = document.querySelector("#btn-next");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      currentWordIndex = (currentWordIndex + 1) % words.length;
      state = startRound(words[currentWordIndex]);
      render();
    });
  }

  // --- Clique simples (acessibilidade / alternativa rápida) ---
  const tiles = app.querySelectorAll<HTMLButtonElement>(".tile");
  tiles.forEach((tileEl) => {
    tileEl.addEventListener("click", (e) => {
      // Ignora se for o final de um drag
      if (tileEl.dataset.wasDragged === "true") {
        delete tileEl.dataset.wasDragged;
        return;
      }
      e.stopPropagation();
      const uid = Number(tileEl.dataset.tileUid);
      const from = tileEl.dataset.from;

      if (from === "pool") {
        // Envia para o primeiro espaço vago
        state = placeTileAt(state, uid);
      } else if (from === "slot") {
        const slotIdx = Number(tileEl.dataset.slotIdx);
        state = removeTileFromSlot(state, slotIdx);
      }
      render();
    });
  });

  // --- Drag and Drop com HTML5 Drag & Drop API (Desktop) ---
  tiles.forEach((tileEl) => {
    tileEl.addEventListener("dragstart", (e) => {
      const uid = tileEl.dataset.tileUid || "";
      const from = tileEl.dataset.from || "";
      const slotIdx = tileEl.dataset.slotIdx || "";

      e.dataTransfer?.setData("text/plain", JSON.stringify({ uid: Number(uid), from, slotIdx }));
      tileEl.classList.add("dragging");
    });

    tileEl.addEventListener("dragend", () => {
      tileEl.classList.remove("dragging");
    });
  });

  const slots = app.querySelectorAll<HTMLDivElement>(".slot");
  slots.forEach((slotEl) => {
    slotEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      slotEl.classList.add("drag-over");
    });

    slotEl.addEventListener("dragleave", () => {
      slotEl.classList.remove("drag-over");
    });

    slotEl.addEventListener("drop", (e) => {
      e.preventDefault();
      slotEl.classList.remove("drag-over");
      const targetSlot = Number(slotEl.dataset.slot);

      try {
        const data = JSON.parse(e.dataTransfer?.getData("text/plain") || "{}");
        if (data.uid !== undefined) {
          state = placeTileAt(state, data.uid, targetSlot);
          render();
        }
      } catch (err) {
        console.error("Drop error:", err);
      }
    });
  });

  // Devolver ao pool por drag-and-drop
  const poolArea = app.querySelector<HTMLDivElement>(".pool");
  if (poolArea) {
    poolArea.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    poolArea.addEventListener("drop", (e) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer?.getData("text/plain") || "{}");
        if (data.from === "slot" && data.slotIdx !== undefined) {
          state = removeTileFromSlot(state, Number(data.slotIdx));
          render();
        }
      } catch (err) {
        console.error("Drop pool error:", err);
      }
    });
  }

  // --- Touch Drag and Drop (Mobile e Tablets) ---
  setupTouchDrag();
}

// Suporte completo a Touch Drag para celular/tablet
function setupTouchDrag() {
  const tiles = app.querySelectorAll<HTMLButtonElement>(".tile");

  tiles.forEach((tileEl) => {
    let clone: HTMLDivElement | null = null;
    let startX = 0;
    let startY = 0;
    let hasMoved = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      hasMoved = false;

      const rect = tileEl.getBoundingClientRect();

      clone = document.createElement("div");
      clone.textContent = tileEl.textContent;
      clone.className = "tile dragging";
      clone.style.position = "fixed";
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.zIndex = "9999";
      clone.style.pointerEvents = "none";
      clone.style.transform = "scale(1.1)";
      clone.style.transition = "none";
      document.body.appendChild(clone);

      tileEl.style.opacity = "0.3";
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!clone) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Math.hypot(dx, dy) > 8) {
        hasMoved = true;
        // Previne scroll da tela no celular enquanto arrasta a peça
        if (e.cancelable) {
          e.preventDefault();
        }
      }

      clone.style.left = `${touch.clientX - clone.offsetWidth / 2}px`;
      clone.style.top = `${touch.clientY - clone.offsetHeight / 2}px`;

      // Highlight no slot sob o dedo
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetSlot = elemBelow?.closest<HTMLDivElement>(".slot");

      document.querySelectorAll(".slot.drag-over").forEach((s) => s.classList.remove("drag-over"));
      if (targetSlot) {
        targetSlot.classList.add("drag-over");
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (clone) {
        clone.remove();
        clone = null;
      }
      tileEl.style.opacity = "";
      document.querySelectorAll(".slot.drag-over").forEach((s) => s.classList.remove("drag-over"));

      if (!hasMoved) {
        return; // Foi apenas um toque/tap, o listener de click cuidará
      }

      tileEl.dataset.wasDragged = "true";
      const touch = e.changedTouches[0];
      const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);

      const targetSlot = elemBelow?.closest<HTMLDivElement>(".slot");
      const targetPool = elemBelow?.closest<HTMLDivElement>(".pool");
      const uid = Number(tileEl.dataset.tileUid);

      if (targetSlot) {
        const slotIdx = Number(targetSlot.dataset.slot);
        state = placeTileAt(state, uid, slotIdx);
        render();
      } else if (targetPool && tileEl.dataset.from === "slot") {
        const fromSlot = Number(tileEl.dataset.slotIdx);
        state = removeTileFromSlot(state, fromSlot);
        render();
      }
    };

    tileEl.addEventListener("touchstart", onTouchStart, { passive: true });
    tileEl.addEventListener("touchmove", onTouchMove, { passive: false });
    tileEl.addEventListener("touchend", onTouchEnd);
    tileEl.addEventListener("touchcancel", onTouchEnd);
  });
}

render();
