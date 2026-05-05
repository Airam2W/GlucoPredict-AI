(function () {
    const storageKey = "glucopredict-theme";
    const root = document.documentElement;

    function getStoredTheme() {
        try {
            const value = localStorage.getItem(storageKey);
            return value === "dark" || value === "light" ? value : "light";
        } catch (error) {
            return "light";
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            // The theme still changes for the current page when storage is blocked.
        }
    }

    function applyTheme(theme) {
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        saveTheme(theme);
        updateToggle(theme);
        window.dispatchEvent(new CustomEvent("glucopredict-theme-change", { detail: { theme } }));
    }

    function moonIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8z"/></svg>';
    }

    function sunIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
    }

    function updateToggle(theme) {
        const toggle = document.getElementById("themeToggle");
        if (!toggle) return;

        const nextTheme = theme === "dark" ? "light" : "dark";
        const icon = toggle.querySelector(".theme-toggle__icon");
        const text = toggle.querySelector(".theme-toggle__text");

        toggle.setAttribute("aria-label", `Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}`);
        toggle.title = `Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}`;

        if (icon) icon.innerHTML = theme === "dark" ? sunIcon() : moonIcon();
        if (text) text.textContent = nextTheme === "dark" ? "Oscuro" : "Claro";
    }

    function createToggle() {
        if (document.getElementById("themeToggle")) return;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.id = "themeToggle";
        toggle.className = "theme-toggle";
        toggle.innerHTML = '<span class="theme-toggle__icon" aria-hidden="true"></span><span class="theme-toggle__text"></span>';
        toggle.addEventListener("click", () => {
            const currentTheme = root.dataset.theme === "dark" ? "dark" : "light";
            applyTheme(currentTheme === "dark" ? "light" : "dark");
        });

        document.body.appendChild(toggle);
        updateToggle(root.dataset.theme === "dark" ? "dark" : "light");
    }

    root.dataset.theme = getStoredTheme();
    root.style.colorScheme = root.dataset.theme;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createToggle);
    } else {
        createToggle();
    }

    window.GlucoTheme = {
        get theme() {
            return root.dataset.theme === "dark" ? "dark" : "light";
        },
        setTheme: applyTheme,
        toggle() {
            applyTheme(this.theme === "dark" ? "light" : "dark");
        }
    };
})();
