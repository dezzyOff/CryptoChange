export const debounce = (func, wait, immediate) => {
    let timeout;
    return function () {
        let context = this;
        let args = arguments;
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            timeout = undefined;
            if (!immediate) {
                func.apply(context, args);
            }
        }, wait);
        if (callNow) func.apply(context, args);
    };
};

/**
 * @param {string} message 
 */

export function errorToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        className: "error",
        escapeMarkup: false,
        offset: {
            x: 0,
            y: 64
        }
    }).showToast();
}
export function successToast(message) {
    Toastify({
        text: message,
        duration: 1500,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        className: "success",
        escapeMarkup: true,
        offset: {
            x: 0,
            y: 64
        }
    }).showToast();
}
export function infoToast(message) {
    Toastify({
        text: message,
        duration: 1500,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        className: "info",
        escapeMarkup: true,
        offset: {
            x: 0,
            y: 64
        }
    }).showToast();
}