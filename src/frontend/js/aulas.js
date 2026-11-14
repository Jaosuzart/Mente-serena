const modules = [
    {
        id: 1,
        title: "Módulo 1 — Inteligência Emocional e Foco no Caos",
        instructor: "João Marcelo",
        instructorRole: "Coordenação & Inteligência Emocional",
        lessons: [
            { id: "m1a1", title: "Mapeamento de gatilhos: o que drena sua energia", duration: "12 min", desc: "Aprenda a mapear os estímulos que causam reações impulsivas e exercite o distanciamento da situação imediata.", instructor: "João Marcelo" },
            { id: "m1a2", title: "A pausa consciente e a resposta intencional", duration: "15 min", desc: "A diferença prática entre reação no piloto automático e tomada de decisão consciente sob pressão.", instructor: "João Marcelo" },
            { id: "m1a3", title: "Foco afunilado: eliminando o excesso de ruído mental", duration: "14 min", desc: "Estratégias práticas para filtrar a enxurrada de informações diárias e priorizar o essencial.", instructor: "João Marcelo" },
            { id: "m1a4", title: "Roteiro prático de clareza mental para decisões difíceis", duration: "16 min", desc: "Exercícios simples de discernimento cognitivo para momentos de dúvida e sobrecarga.", instructor: "João Marcelo" }
        ]
    },
    {
        id: 2,
        title: "Módulo 2 — O Corpo em Harmonia e Fisiologia da Calma",
        instructor: "Luan Castro",
        instructorRole: "Regulação Somática & Bem-Estar",
        lessons: [
            { id: "m2a1", title: "A neurobiologia do estresse e da tranquilidade", duration: "14 min", desc: "Compreendendo como o sistema nervoso responde aos estímulos diários e como acionar o freio biológico do estresse.", instructor: "Luan Castro" },
            { id: "m2a2", title: "Protocolos de respiração para alívio imediato da ansiedade", duration: "16 min", desc: "Técnicas de respiração guiada para baixar picos de ansiedade em qualquer lugar em menos de 3 minutos.", instructor: "Luan Castro" },
            { id: "m2a3", title: "Higiene do sono e desconexão da mente noturna", duration: "15 min", desc: "Como desarmar a hiperestimulação mental ao deitar para garantir um descanso reparador.", instructor: "Luan Castro" },
            { id: "m2a4", title: "Micropausas de descompressão na rotina de trabalho", duration: "12 min", desc: "Rituais de 3 minutos para restaurar a vitalidade e evitar o esgotamento no meio do dia.", instructor: "Luan Castro" }
        ]
    },
    {
        id: 3,
        title: "Módulo 3 — Autoliderança, Limites e Relações Saudáveis",
        instructor: "Nilton Lima Filho",
        instructorRole: "Autoliderança & Comunicação Assertiva",
        lessons: [
            { id: "m3a1", title: "A arte de estabelecer limites saudáveis sem culpa", duration: "15 min", desc: "Como dizer não com firmeza e elegância, mantendo o respeito a si e ao outro.", instructor: "Nilton Lima Filho" },
            { id: "m3a2", title: "Comunicação assertiva e desarmando conflitos", duration: "18 min", desc: "Como sustentar conversas difíceis sem agressividade e sem passividade paralisante.", instructor: "Nilton Lima Filho" },
            { id: "m3a3", title: "Gestão da autoexigência e da cobrança interna", duration: "14 min", desc: "Eliminando o perfeccionismo paralisante e cultivando a disciplina da consistência.", instructor: "Nilton Lima Filho" },
            { id: "m3a4", title: "Plano individual de sustentabilidade emocional", duration: "17 min", desc: "Construindo uma blindagem emocional duradoura para ambientes e relacionamentos desafiadores.", instructor: "Nilton Lima Filho" }
        ]
    },
    {
        id: 4,
        title: "Módulo Especial — Filosofia, Consciência e Sociedade (Bônus)",
        instructor: "Eliseu (Instrutor Convidado)",
        instructorRole: "Filosofia Social & Consciência",
        lessons: [
            { id: "m4a1", title: "Propósito, pensamento crítico e autonomia interior", duration: "18 min", desc: "Reflexões essenciais para resgatar sua autenticidade e autonomia em um mundo acelerado.", instructor: "Eliseu" },
            { id: "m4a2", title: "Mulheres, sociedade e a desconstrução de padrões", duration: "20 min", desc: "Perspectivas históricas e práticas sobre autonomia feminina, relações conscientes e emancipação.", instructor: "Eliseu" },
            { id: "m4a3", title: "Sabedoria prática para o florescimento pessoal", duration: "16 min", desc: "Integrando mente, corpo e propósito para uma vida serena e com significado.", instructor: "Eliseu" }
        ]
    }
];

let currentLessonIndex = 0;
const allLessons = modules.flatMap(m => m.lessons.map(l => ({
    ...l,
    moduleTitle: m.title,
    instructor: l.instructor || m.instructor
})));

function renderLessonsList() {
    const container = document.getElementById('aula-list-container');
    container.innerHTML = '';

    modules.forEach(module => {
        const moduleHeader = document.createElement('div');
        moduleHeader.className = 'mt-3 mb-2 px-2';
        moduleHeader.innerHTML = `
            <h5 class="text-muted fs-6 fw-bold mb-1">${module.title}</h5>
            <span class="badge bg-light text-primary border" style="font-size: 0.72rem; font-weight: 500;">
                👨‍🏫 ${module.instructor}
            </span>
        `;
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
                    <span class="text-muted small" style="font-size: 0.75rem;">${lesson.duration} &bull; ${lesson.instructor}</span>
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
    document.getElementById('current-lesson-title').textContent = `👨‍🏫 ${lesson.instructor} | Aula: ${lesson.title}`;

    document.getElementById('lesson-detail-title').textContent = lesson.title;
    document.getElementById('lesson-detail-duration').textContent = lesson.duration;
    document.getElementById('lesson-detail-desc').textContent = `${lesson.desc} (Ministrado por: ${lesson.instructor})`;

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
