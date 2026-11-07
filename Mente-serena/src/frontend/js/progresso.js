
window.updateProgressUI = function (currentLessonNumber, totalLessons) {
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('course-progress');

    if (progressText && progressBar) {
        progressText.textContent = `${currentLessonNumber}/${totalLessons}`;

        const percentage = Math.round((currentLessonNumber / totalLessons) * 100);

        progressBar.style.width = `${percentage}%`;
    }
};
