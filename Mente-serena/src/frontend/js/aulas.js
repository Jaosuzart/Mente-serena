
const modules = [
    {
        id: 1,
        title: "Módulo 1 — A pausa consciente",
        lessons: [
            { id: "m1a1", title: "Como fazer uma pausa antes de reagir", duration: "08 min", desc: "Uma introdução prática à diferença entre reação impulsiva e resposta consciente." },
            { id: "m1a2", title: "Respiração guiada", duration: "12 min", desc: "Exercícios práticos para diminuir o ritmo fisiológico da resposta inicial." },
            { id: "m1a3", title: "A regra dos 10 segundos", duration: "10 min", desc: "Como aplicar na prática o distanciamento da situação imediata." }
        ]
    },
    {
        id: 2,
        title: "Módulo 2 — Calma não é fraqueza",
        lessons: [
            { id: "m2a1", title: "O que é assertividade", duration: "15 min", desc: "Como se comunicar com firmeza sem precisar ser agressivo." },
            { id: "m2a2", title: "Estabelecendo limites", duration: "11 min", desc: "Aprendendo a dizer não sem sentir culpa e respeitando o outro." }
        ]
    },
    {
        id: 3,
        title: "Módulo 3 — Escuta ativa",
        lessons: [
            { id: "m3a1", title: "Ouvir para compreender", duration: "14 min", desc: "Como parar de formular respostas enquanto o outro ainda fala." },
            { id: "m3a2", title: "Confirmando entendimento", duration: "09 min", desc: "Técnicas de paráfrase para evitar mal-entendidos e conflitos." },
            { id: "m3a3", title: "Perguntas abertas", duration: "13 min", desc: "Como incentivar o outro a se expressar melhor através de perguntas adequadas." }
        ]
    }
];

let currentLessonIndex = 0;
const allLessons = modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })));

function renderLessonsList() {
    const container = document.getElementById('aula-list-container');
    container.innerHTML = '';

    modules.forEach(module => {
        const moduleHeader = document.createElement('h5');
        moduleHeader.className = 'text-muted fs-6 fw-bold mt-3 mb-2 px-2';
        moduleHeader.textContent = module.title;
        container.appendChild(moduleHeader);

        module.lessons.forEach(lesson => {
            const index = allLessons.findIndex(l => l.id === lesson.id);
            const isActive = index === currentLessonIndex;

            const lessonItem = document.createElement('div');
            lessonItem.className = `aula-list-item d-flex justify-content-between align-items-center mb-1 ${isActive ? 'active' : ''}`;
            lessonItem.onclick = () => loadLesson(index);

            lessonItem.innerHTML = `
                <div>
                    <span class="d-block small fw-semibold ${isActive ? 'text-primary-ms' : 'text-dark'}">${lesson.title}</span>
                    <span class="text-muted small" style="font-size: 0.75rem;">${lesson.duration}</span>
                </div>
                ${isActive ? '<span class="text-accent-ms small">▶ Reproduzindo</span>' : ''}
            `;

            container.appendChild(lessonItem);
        });
    });
}

function loadLesson(index) {
    if (index < 0 || index >= allLessons.length) return;

    currentLessonIndex = index;
    const lesson = allLessons[index];

    document.getElementById('current-module-title').textContent = lesson.moduleTitle;
    document.getElementById('current-lesson-title').textContent = `Aula: ${lesson.title}`;

    document.getElementById('lesson-detail-title').textContent = lesson.title;
    document.getElementById('lesson-detail-duration').textContent = lesson.duration;
    document.getElementById('lesson-detail-desc').textContent = lesson.desc;

    document.getElementById('btn-prev').disabled = index === 0;
    document.getElementById('btn-next').disabled = index === allLessons.length - 1;

    if (typeof updateProgressUI === 'function') {
        updateProgressUI(index + 1, allLessons.length);
    }

    renderLessonsList();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-prev').addEventListener('click', () => loadLesson(currentLessonIndex - 1));
    document.getElementById('btn-next').addEventListener('click', () => loadLesson(currentLessonIndex + 1));

    renderLessonsList();
    loadLesson(0);
});
