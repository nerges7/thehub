(() => {
 const mountPoint = document.getElementById('thehub-form');
  if (!mountPoint) return;

  const apiBase = 'https://thehub-zeta.vercel.app/api';

  const container = document.createElement('div');
  container.className = 'thehub-container';
  mountPoint.appendChild(container);

  const state = {
    sports: [],
    questions: [],
    currentSportId: null,
    currentIndex: 0,
    answers: {},
    recommendations: [],
  };

  const loadData = async () => {
    try {
      const res = await fetch(`${apiBase}/form-data`);
      const data = await res.json();
      state.sports = data.sports;
      state.questions = data.questions;
      renderSportSelector();
    } catch (err) {
      container.innerHTML = `<p>Error cargando el formulario. Intenta más tarde.</p>`;
      console.error(err);
    }
  };

  const renderSportSelector = () => {
    container.innerHTML = `
      <div class="thehub-question">
  <h2><span>¿PARA</span> <strong>CUÁL DEPORTE</strong> <span>QUIERES<br>CREAR TU PLAN?</span></h2>
  <div class="thehub-sport-grid">
    ${state.sports
      .map(
        (s) =>
          `<button class="thehub-sport-btn" data-sport="${s.id}">${s.name}</button>`
      )
      .join('')}
        </div>
  <button class="thehub-next-btn" id="sport-next" disabled>SIGUIENTE →</button>
</div>
    `;

    container.querySelectorAll('[data-sport]').forEach((btn) =>
  btn.addEventListener('click', (e) => {
    state.currentSportId = e.target.getAttribute('data-sport');
    state.currentIndex = 0;
    state.answers = {};

    // Visualmente marcar seleccionado
    container.querySelectorAll('.thehub-sport-btn').forEach((b) =>
      b.classList.remove('selected')
    );
    btn.classList.add('selected');

    // Habilitar botón siguiente
    document.getElementById('sport-next').disabled = false;
  })
);

document.getElementById('sport-next').addEventListener('click', () => {
  renderCurrentQuestion();
});
  };

  const renderCurrentQuestion = () => {
   const sportQuestions = state.questions
  .filter((q) => q.forAllSports || q.sportId === state.currentSportId)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));


    const current = sportQuestions[state.currentIndex];
    if (!current) return renderSummary();

    container.innerHTML = `
      <div class="thehub-question">
        ${current.text}
        ${
  current.type === 'select'
    ? `    <div class="thehub-select-options">
      ${current.options
        .map(
          (opt) =>
            `<button class="thehub-sport-btn" data-option="${opt}">${opt}</button>`
        )
        .join('')}
    </div>
    <input type="hidden" id="answer" />`
    : current.type === 'time'
    ? `
      <div class="thehub-time-slider">
        <input
          id="answer"
          class="thehub-slider"
          type="range"
          min="0"
          max="1440"
          step="15"
          value="${state.answers[current.key] || 0}"
        />
        <div id="time-display" class="thehub-time-display">00:00</div>
      </div>
    `
    : `<input id="answer" class="thehub-input" type="${
        current.type === 'number' ? 'number' : 'text'
      }" placeholder="${current.unit ? `En ${current.unit}` : 'Tu respuesta'}" />`
}

      </div>
      <div>
        ${
          state.currentIndex > -1
            ? '<button class="thehub-back" id="prev">← Anterior</button>'
            : ''
        }
        <button class="thehub-btn" id="next">Siguiente →</button>
      </div>
    `;

    const answerEl = container.querySelector('#answer');
    if (current.type === 'select') {
  const optionButtons = container.querySelectorAll('[data-option]');
  optionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      optionButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      answerEl.value = btn.getAttribute('data-option');
    });
  });
}

    if (current.type === 'time') {
  const display = container.querySelector('#time-display');
  const updateTimeDisplay = (val) => {
    const hrs = Math.floor(val / 60);
    const mins = val % 60;
    display.textContent = `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}`;
  };

  answerEl.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    updateTimeDisplay(val);
  });

  updateTimeDisplay(parseInt(answerEl.value, 10) || 0);
}
    const prevAnswer = state.answers[current.key];
    if (prevAnswer) {
      answerEl.value = prevAnswer;
    }

    document.getElementById('next').addEventListener('click', () => {
let val;
if (current.type === 'time') {
  val = parseInt(answerEl.value, 10);
  if (isNaN(val)) {
    alert('Por favor selecciona una duración válida');
    return;
  }
  state.answers[current.key] = val; // minutos
} else {
  val = answerEl.value.trim();
  if (!val) {
    alert('Por favor responde la pregunta');
    return;
  }
  state.answers[current.key] = val;
}


      state.currentIndex++;
      renderCurrentQuestion();
    });

    if (state.currentIndex > 0) {
      document.getElementById('prev').addEventListener('click', () => {
        state.currentIndex--;
        renderCurrentQuestion();
      });
    }
  };

 const renderSummary = async () => {
  container.innerHTML = `<p>Generando recomendaciones...</p>`;

  try {
    const res = await fetch(`${apiBase}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: state.answers }),
    });

    const data = await res.json();
    state.recommendations = data.recommendations;

    container.innerHTML = `
      <div class="thehub-question"><h2>Recomendaciones</h2></div>
      <div class="thehub-recommendation_container">
      ${
        state.recommendations.length === 0
          ? '<p>No se encontraron recomendaciones.</p>'
          : state.recommendations
              .map(
                (r) => `
                
              <div class="thehub-recommendation">
                <strong>Categoría:</strong> ${r.categoryName || r.categoryId} <br />
                <strong>Cantidad total:</strong> ${r.totalAmount}<br />
                ${r.products
                  .map(
                    (p) =>
                      `<div style="margin-top:6px;">
                        <strong>${p.productName}</strong>: ${p.quantityRecommended} unidad(es)
                      </div>`
                  )
                  .join('')}
              </div>`
              )
              .join('')
      }
      </div><button class="thehub-btn" id="restart">Volver a empezar</button>
    `;

    document.getElementById('restart').addEventListener('click', () => {
      renderSportSelector();
    });
  } catch (error) {
    container.innerHTML = `<p>Error generando recomendaciones. Intenta más tarde.</p>`;
  }
};


  loadData();
})();
