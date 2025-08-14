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

      // Pregunta de selección de deporte
      const sportQuestion = {
        id: 'sport-selection',
        text: '<h2><span>¿PARA</span> <strong>CUÁL DEPORTE</strong> <span>QUIERES<br>CREAR TU PLAN?</span></h2>',
        key: 'sport_selection',
        type: 'sport',
        forAllSports: false,
        sports: []
      };

      state.questions = [
        sportQuestion,
        ...data.questions.map(q => ({
          ...q,
          sports: q.sports || (q.sportId ? [{ sportId: q.sportId, order: q.order || 0 }] : [])
        }))
      ];

      renderCurrentQuestion();
    } catch (err) {
      container.innerHTML = `<p>Error cargando el formulario. Intenta más tarde.</p>`;
      console.error(err);
    }
  };

  // Funciones auxiliares
  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateTotalTime = (question, values = {}) => {
    if (!question.timeComponents) return '00:00';
    const total = question.timeComponents.reduce((sum, comp) => {
      return sum + (parseInt(values[comp.key] || 0));
    }, 0);
    return formatTime(total);
  };

  const renderCurrentQuestion = () => {
    const current = state.questions[state.currentIndex];
    if (!current) return renderSummary();

    if (current.type === 'sport') {
      container.innerHTML = `
        <div class="thehub-question">
          ${current.text}
          <div class="thehub-sport-grid">
            ${state.sports.map(s => `
              <button class="thehub-sport-btn" data-sport="${s.id}">${s.name}</button>
            `).join('')}
          </div>
          <button class="thehub-next-btn" id="next" disabled>SIGUIENTE →</button>
        </div>
      `;

      container.querySelectorAll('[data-sport]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          state.currentSportId = e.target.getAttribute('data-sport');
          container.querySelectorAll('.thehub-sport-btn').forEach(b => {
            b.classList.remove('selected');
          });
          e.target.classList.add('selected');
          document.getElementById('next').disabled = false;
        });
      });

      document.getElementById('next').addEventListener('click', () => {
        if (!state.currentSportId) {
          alert('Por favor selecciona un deporte');
          return;
        }
        state.currentIndex++;
        renderCurrentQuestion();
      });

      return;
    }

    // Filtrar preguntas para el deporte seleccionado
    const sportQuestions = state.questions.filter(q =>
      q.type === 'sport' || q.forAllSports ||
      (q.sports && q.sports.some(s => s.sportId === state.currentSportId))
    ).sort((a, b) => {
      const aOrder = a.sports?.find(s => s.sportId === state.currentSportId)?.order || 0;
      const bOrder = b.sports?.find(s => s.sportId === state.currentSportId)?.order || 0;
      return aOrder - bOrder;
    });

    const currentFiltered = sportQuestions[state.currentIndex];
    if (!currentFiltered) return renderSummary();

    // Renderizar pregunta normal
    let questionHTML = `
      <div class="thehub-question">
        ${currentFiltered.text}
    `;

    if (currentFiltered.type === 'select') {
      questionHTML += `
        <div class="thehub-select-options">
          ${currentFiltered.options.map(opt => `
            <button class="thehub-sport-btn" data-option="${opt}">${opt}</button>
          `).join('')}
        </div>
        <input type="hidden" id="answer" />`;
    }
    else if (currentFiltered.type === 'time') {
      questionHTML += `
        <div class="thehub-time-slider">
          <input
            id="answer"
            class="thehub-slider"
            type="range"
            min="0"
            max="1440"
            step="15"
            value="${state.answers[currentFiltered.key] || 0}"
          />
          <div id="time-display" class="thehub-time-display">00:00</div>
        </div>
      `;
    }
    else if (currentFiltered.type === 'multitime') {
      questionHTML += `
        <div class="thehub-multitime-container">
          ${(currentFiltered.timeComponents || []).map(component => `
            <div class="thehub-multitime-component">
              <h4>${component.label}</h4>
              <div class="thehub-multitime-slider">
                <div class="thehub-multitime-display" data-key="${component.key}">
                  ${formatTime(state.answers[currentFiltered.key]?.[component.key] || 0)}
                </div>
                <input
                  class="thehub-multitime-input"
                  data-key="${component.key}"
                  type="range"
                  min="0"
                  max="720"
                  step="5"
                  value="${state.answers[currentFiltered.key]?.[component.key] || 0}"
                />
              </div>
            </div>
          `).join('')}
          <div class="thehub-total-time">
            <strong>Tiempo total:</strong> 
            <span id="multitime-total">${calculateTotalTime(currentFiltered, state.answers[currentFiltered.key] || {})}</span>
          </div>
        </div>
        <input type="hidden" id="answer" />`;
    }
    else {
      questionHTML += `
        <input id="answer" class="thehub-input" type="${currentFiltered.type === 'number' ? 'number' : 'text'
        }" placeholder="${currentFiltered.unit ? `En ${currentFiltered.unit}` : 'Tu respuesta'}" />`;
    }

    questionHTML += `</div>
      <div class="thehub-navigation-buttons">
        ${state.currentIndex > 0 ? '<button class="thehub-back" id="prev">← Regresar</button>' : ''}
        <button class="thehub-btn" id="next">
          ${state.currentIndex < sportQuestions.length - 1 ? 'Siguiente →' : 'Ver resultados'}
        </button>
      </div>
    `;

    container.innerHTML = questionHTML;
    const answerEl = document.getElementById('answer');

    // Manejo de eventos
    if (currentFiltered.type === 'select') {
      document.querySelectorAll('[data-option]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('[data-option]').forEach(b => b.classList.remove('selected'));
          e.target.classList.add('selected');
          if (answerEl) answerEl.value = e.target.getAttribute('data-option');
        });
      });
    }
    else if (currentFiltered.type === 'time') {
      const display = document.getElementById('time-display');
      const updateTimeDisplay = (val) => {
        const hrs = Math.floor(val / 60);
        const mins = val % 60;
        if (display) display.textContent = `${hrs}:${mins.toString().padStart(2, '0')}`;
      };

      if (answerEl) {
        answerEl.addEventListener('input', (e) => {
          updateTimeDisplay(parseInt(e.target.value, 10));
        });
        updateTimeDisplay(parseInt(answerEl.value, 10) || 0);
      }
    }
    else if (currentFiltered.type === 'multitime') {
      document.querySelectorAll('.thehub-multitime-input').forEach(input => {
        const key = input.getAttribute('data-key');
        const display = document.querySelector(`.thehub-multitime-display[data-key="${key}"]`);
        const totalDisplay = document.getElementById('multitime-total');

        const updateDisplay = () => {
          const val = parseInt(input.value, 10) || 0;
          if (display) display.textContent = formatTime(val);
          if (totalDisplay) {
            const values = {};
            document.querySelectorAll('.thehub-multitime-input').forEach(i => {
              const k = i.getAttribute('data-key');
              values[k] = parseInt(i.value, 10) || 0;
            });
            totalDisplay.textContent = calculateTotalTime(currentFiltered, values);
          }
        };

        input.addEventListener('input', updateDisplay);
        updateDisplay();
      });
    }

    // Cargar respuesta previa
    if (currentFiltered.key && state.answers[currentFiltered.key] && answerEl && currentFiltered.type !== 'multitime') {
      answerEl.value = state.answers[currentFiltered.key];
    }

    // Botón siguiente
    document.getElementById('next').addEventListener('click', () => {
      let val;
      if (currentFiltered.type === 'time') {
        val = parseInt(answerEl.value, 10);
        if (isNaN(val)) {
          alert('Por favor selecciona una duración válida');
          return;
        }
      }
      else if (currentFiltered.type === 'multitime') {
        val = {};
        let hasInvalidTime = false;
        let totalTime = 0;

        document.querySelectorAll('.thehub-multitime-input').forEach(input => {
          const key = input.getAttribute('data-key');
          const timeValue = parseInt(input.value, 10);

          if (isNaN(timeValue)) {
            hasInvalidTime = true;
            input.style.border = '1px solid red';
          } else {
            val[key] = timeValue;
            totalTime += timeValue;
            input.style.border = '';
          }
        });

        if (hasInvalidTime) {
          alert('Por favor ingresa tiempos válidos para todos los componentes');
          return;
        }

        if (totalTime <= 0) {
          alert('El tiempo total debe ser mayor a 0');
          return;
        }
      }
      else if (currentFiltered.type !== 'sport') {
        val = answerEl.value.trim();
        if (!val) {
          alert('Por favor responde la pregunta');
          return;
        }
      }

      if (currentFiltered.key) {
        state.answers[currentFiltered.key] = val;
      }

      state.currentIndex++;
      renderCurrentQuestion();
    });

    // Botón anterior
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
      body: JSON.stringify({ 
        answers: state.answers,
        sportId: state.currentSportId
      }),
    });

    const data = await res.json();
    state.recommendations = data.recommendations;

    container.innerHTML = `
      <div class="thehub-question">
        <h2>Recomendaciones Personalizadas</h2>
      </div>
      <div class="thehub-recommendations-container">
        ${
          state.recommendations.length === 0
            ? '<p class="thehub-no-recommendations">No se encontraron recomendaciones para tu plan.</p>'
            : state.recommendations.map(r => `
                <div class="thehub-recommendation-category">
                  <h3 class="thehub-category-title">${r.categoryName || r.categoryId}</h3>
                  <p class="thehub-category-total">Cantidad total recomendada: ${r.totalAmount}</p>
                  
                  <div class="thehub-products-grid">
                    ${(r.products || []).map(p => `
                      <div class="thehub-product-card">
                        ${p.imageUrl ? `
                          <div class="thehub-product-image">
                            <img src="${p.imageUrl}" alt="${p.productName}" loading="lazy">
                          </div>
                        ` : ''}
                        <div class="thehub-product-info">
                          <h4 class="thehub-product-title">${p.productName}</h4>
                          <p class="thehub-product-quantity">${p.quantityRecommended} unidad(es)</p>
                          <div class="thehub-product-actions">
                            <a href="${p.productUrl || '#'}" 
                               class="thehub-product-link" 
                               target="_blank">
                              Ver producto
                            </a>
                            <button class="thehub-add-to-cart" 
                                    data-product-id="${p.variantid}"
                                    data-quantity="${p.quantityRecommended}">
                              Agregar al carrito
                            </button>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')
        }
      </div>
      <button class="thehub-btn" id="restart">Volver a empezar</button>
    `;

    // Manejar el evento de agregar al carrito
    container.querySelectorAll('.thehub-add-to-cart').forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        const quantity = parseInt(this.getAttribute('data-quantity')) || 1;
        addToCart(gidToVariantId(productId), quantity);
      });
    });

    document.getElementById('restart').addEventListener('click', () => {
      state.currentIndex = 0;
      state.currentSportId = null;
      state.answers = {};
      renderCurrentQuestion();
    });

  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    container.innerHTML = `
      <div class="thehub-error">
        <p>Error generando recomendaciones. Intenta más tarde.</p>
        <button class="thehub-btn" id="restart">Volver a empezar</button>
      </div>
    `;
    document.getElementById('restart').addEventListener('click', () => {
      state.currentIndex = 0;
      state.currentSportId = null;
      state.answers = {};
      renderCurrentQuestion();
    });
  }
};
function gidToVariantId(gid) {
  return gid.split("/").pop();
}
function updateCartCounter() {
  fetch('/cart.js')
    .then(res => res.json())
    .then(cart => {
      const countElement = document.querySelector('.cart-item-count-header--quantity');
      if (countElement) {
        countElement.classList.remove('hide');
        countElement.textContent = cart.item_count; // Actualiza el contador
      }
    })
    .catch(err => console.error('Error al actualizar contador:', err));
}

function updateMiniCart() {
  fetch(window.location.pathname + '?section_id=flash-incentives-cart')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error fetching mini cart: ${response.statusText}`);
      }
      return response.text();
    })
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      console.log(doc);
      // Buscar el template que contiene la sección
      const template = doc.querySelector('template[data-upsell-section-id="flash-incentives-cart"]');
      if (!template) {
        console.warn('Template de la sección no encontrado.');
        return;
      }
      // El contenido real está dentro del template.content
      const fragment = template.content;
      const newCartForm = fragment.querySelector('#cart_form');
      const upsell = document.querySelector('.upsell-cart');
      if (newCartForm) {
        const miniCart = document.querySelector('#cart_form');
        if (miniCart) {
          miniCart.innerHTML = newCartForm.innerHTML;
          if (upsell.classList.contains('upsell-cart--empty')){
            console.log('Carrito vacio, cambiando clase...');
            upsell.classList.remove('upsell-cart--empty');
          }
          console.log('Mini cart actualizado desde template.');
          const closeBtn = document.querySelector('.upsell-cart__close');
          if (closeBtn) {
            closeBtn.addEventListener('click', Obsidian.Upsell.close.bind(Obsidian.Upsell));
          }
        } else {
          console.warn('No se encontró el #cart_form actual en el DOM.');
        }
      } else {
        console.warn('No se encontró #cart_form dentro del template.');
      }
    })
    .catch((error) => {
      console.error('Error updating mini cart:', error);
    });
}


// Función para agregar productos al carrito (simulada)
function addToCart(productId, quantity = 1) {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: productId, // Esto debe ser el "variant_id", no el productId
      quantity: quantity
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Producto agregado:', data);
    updateCartCounter();
    updateMiniCart();
    // Feedback al usuario
    const feedback = document.createElement('div');
    feedback.className = 'thehub-cart-feedback';
    feedback.textContent = 'Producto agregado al carrito ✅';
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
    
    // Opcional: abrir el mini-cart si tu tema lo soporta
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cart) {
      // lógica para abrir el mini-cart
    }
  })
  .catch(err => {
    console.error('Error al agregar al carrito:', err);
    alert('Hubo un problema al agregar el producto al carrito.');
  });
}

  loadData();
})();