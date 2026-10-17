import { words } from "./words";
import { startRound, placeTile, removeTile, isComplete, isCorrect, type RoundState } from "./game";
import "./style.css";

let state: RoundState = startRound(words[0]);

const app = document.querySelector<HTMLDivElement>("#app")!;

function render() {
  app.innerHTML = `
    <h2>${state.word.pt}</h2>
    <div class="answer">${state.answer.map(t => `<button class="tile" data-answer="${t.uid}">${t.char}</button>`).join("")}</div>
    <div class="pool">${state.pool.map(t => `<button class="tile" data-pool="${t.uid}">${t.char}</button>`).join("")}</div>
    <p id="msg"></p>
  `;

  if (isComplete(state)) {
    document.querySelector("#msg")!.textContent =
      isCorrect(state) ? `✅ Correto! (${state.word.romaji})` : "❌ Tente de novo";
  }
}

app.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest("button");
  if (!el) return;
  if (el.dataset.pool) state = placeTile(state, Number(el.dataset.pool));
  if (el.dataset.answer) state = removeTile(state, Number(el.dataset.answer));
  render();
});

render();