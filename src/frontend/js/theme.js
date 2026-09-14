document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const savedTheme = localStorage.getItem('theme');
    
    const initialTheme = savedTheme ? savedTheme : 'dark';
    setTheme(initialTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    function setTheme(themeName) {
        htmlElement.setAttribute('data-bs-theme', themeName);
        
        if (themeIcon) {
            if (themeName === 'dark') {
                themeIcon.className = 'bi bi-sun-fill';
                if(themeToggleBtn) {
                    themeToggleBtn.className = 'btn btn-outline-light rounded-circle';
                    themeToggleBtn.setAttribute('aria-label', 'Mudar para modo claro');
                }
            } else {
                themeIcon.className = 'bi bi-moon-fill';
                if(themeToggleBtn) {
                    themeToggleBtn.className = 'btn btn-outline-dark rounded-circle';
                    themeToggleBtn.setAttribute('aria-label', 'Mudar para modo escuro');
                }
            }
        }
    }
});
