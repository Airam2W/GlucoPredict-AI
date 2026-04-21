const TEXT_PATTERN = /^[A-Za-z\u00C0-\u017F0-9.,/#()\- ]+$/;

function getOrCreateFieldError(input) {
    const errorId = `${input.id}-error`;
    let errorElement = document.getElementById(errorId);

    if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.id = errorId;
        errorElement.className = "field-error";
        input.insertAdjacentElement("afterend", errorElement);
    }

    return errorElement;
}

function getOrCreateFormMessage(form) {
    let messageElement = form.querySelector(".form-feedback");

    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.className = "form-feedback";
        form.prepend(messageElement);
    }

    return messageElement;
}

export function showFieldError(input, message) {
    const errorElement = getOrCreateFieldError(input);
    errorElement.textContent = message;
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errorElement.id);
}

export function clearFieldError(input) {
    const errorElement = document.getElementById(`${input.id}-error`);
    if (errorElement) {
        errorElement.textContent = "";
    }

    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
}

export function setFormFeedback(form, message = "", type = "error") {
    const messageElement = getOrCreateFormMessage(form);
    messageElement.textContent = message;
    messageElement.classList.toggle("is-error", type === "error");
    messageElement.classList.toggle("is-success", type === "success");
}

export function attachValidation(form, fieldConfigs) {
    const entries = Object.entries(fieldConfigs).map(([fieldId, config]) => {
        const input = document.getElementById(fieldId);
        return [fieldId, { ...config, input }];
    });

    function validateField(fieldId) {
        const config = fieldConfigs[fieldId];
        const input = document.getElementById(fieldId);

        if (!input || !config?.validate) {
            return true;
        }

        const message = config.validate(input.value, input);

        if (message) {
            showFieldError(input, message);
            return false;
        }

        clearFieldError(input);
        return true;
    }

    entries.forEach(([, config]) => {
        if (!config.input) {
            return;
        }

        const eventName = config.input.tagName === "SELECT" ? "change" : "input";
        config.input.addEventListener(eventName, () => validateField(config.input.id));
        config.input.addEventListener("blur", () => validateField(config.input.id));
    });

    return {
        validateAll() {
            setFormFeedback(form, "");

            let firstInvalid = null;
            let isValid = true;

            entries.forEach(([fieldId, config]) => {
                if (!config.input) {
                    return;
                }

                const fieldValid = validateField(fieldId);
                if (!fieldValid && !firstInvalid) {
                    firstInvalid = config.input;
                }
                isValid = isValid && fieldValid;
            });

            if (!isValid) {
                setFormFeedback(form, "Corrige los campos marcados antes de continuar.");
                firstInvalid?.focus();
            }

            return isValid;
        },
        validateField
    };
}

export function validateRequiredText(value, label, options = {}) {
    const trimmed = String(value || "").trim();
    const min = options.min ?? 2;
    const max = options.max ?? 120;
    const pattern = options.pattern ?? TEXT_PATTERN;

    if (!trimmed) {
        return `El campo ${label} es obligatorio.`;
    }
    if (trimmed.length < min) {
        return `${label} debe tener al menos ${min} caracteres.`;
    }
    if (trimmed.length > max) {
        return `${label} no puede exceder ${max} caracteres.`;
    }
    if (!pattern.test(trimmed)) {
        return options.patternMessage || `${label} contiene caracteres no permitidos.`;
    }

    return "";
}

export function validateOptionalText(value, label, options = {}) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
        return "";
    }

    return validateRequiredText(trimmed, label, options);
}

export function validateRequiredSelect(value, label) {
    if (!String(value || "").trim()) {
        return `Selecciona una opcion para ${label}.`;
    }

    return "";
}

export function validateInteger(value, label, min, max) {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return `El campo ${label} es obligatorio.`;
    }

    const number = Number(trimmed);
    if (!Number.isInteger(number)) {
        return `${label} debe ser un numero entero.`;
    }
    if (number < min || number > max) {
        return `${label} debe estar entre ${min} y ${max}.`;
    }

    return "";
}

export function validateOptionalNumber(value, label, min, max) {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return "";
    }

    const number = Number(trimmed);
    if (Number.isNaN(number)) {
        return `${label} debe ser un numero valido.`;
    }
    if (number < min || number > max) {
        return `${label} debe estar entre ${min} y ${max}.`;
    }

    return "";
}

export function validateRequiredNumber(value, label, min, max) {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return `El campo ${label} es obligatorio.`;
    }

    const number = Number(trimmed);
    if (Number.isNaN(number)) {
        return `${label} debe ser un numero valido.`;
    }
    if (number < min || number > max) {
        return `${label} debe estar entre ${min} y ${max}.`;
    }

    return "";
}

export function validateOptionalPhone(value, label = "telefono") {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return "";
    }

    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
        return `El ${label} debe tener entre 10 y 15 digitos.`;
    }

    return "";
}

export function validateOptionalEmail(value, label = "correo electronico") {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return "";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return `Ingresa un ${label} valido.`;
    }

    return "";
}

export function validateBloodType(value) {
    const trimmed = String(value || "").trim().toUpperCase();

    if (!trimmed) {
        return "";
    }

    if (!/^(A|B|AB|O)[+-]$/.test(trimmed)) {
        return "Ingresa un tipo de sangre valido. Ejemplo: O+.";
    }

    return "";
}
