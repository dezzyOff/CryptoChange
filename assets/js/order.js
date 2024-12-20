import { errorToast, successToast, infoToast } from './utils.js';
$(document).ready(function () {
    const id = $('#order-id').val();
    async function fetchOrder() {
        try {
            const path = window.location.pathname;
            const pathSegments = path.split('/').filter(segment => segment !== '');
            const lang = pathSegments[0] || 'en'
            const response = await fetch(`/api/order/${encodeURIComponent(id)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    window.location.href = "/404";
                }
                else if (response.status >= 500 && response.status < 600) {
                    const errorMessage = data.message;
                    errorToast(errorMessage);
                }
                else {
                    const errorMessage = data.message;
                    errorToast(errorMessage);
                }
                return;
            }
            if (data.status_changed) {
                if (data.html) {
                    $('#order-container').html(data.html);
                } else {
                    errorToast("Internal Error");
                    return;
                }
            }
            updateOrderStatus(data.status);
            startCountdownTimer();
        } catch (error) {
            errorToast("Internal Error");
        }
    }

    function updateOrderStatus(status) {
        const normalizedStatus = status;

        const statusMap = {
            "Awaiting Deposit": 1,
            "Confirming Deposit": 2,
            "Exchanging": 2,
            "Sending": 3,
            "Complete": 4,
            "Failed": null,
            "Refund": null,
            "Action Request": null,
        };

        const activeIndex = statusMap[normalizedStatus];
        if (activeIndex === null) {
            $('.order__status-step').each(function () {
                $(this).removeClass('completed active').addClass('disabled');
            });

            if (normalizedStatus !== "action request") {
                $('.order__status-error-display').addClass('active');
            } else {
                $('.order__status-error-display').removeClass('active');
            }
            return;
        }
        $('.order__status-error-display').removeClass('active');
        $('.order__status-step').each(function (index) {
            const $step = $(this);

            if (index < activeIndex) {
                $step.removeClass('active disabled').addClass('completed');
            } else if (index === activeIndex) {
                $step.removeClass('completed disabled').addClass('active');
            } else {
                $step.removeClass('completed active').addClass('disabled');
            }
        });
    }

    function startCountdownTimer() {
        const $expirationTimeElement = $('#expiration-time');
        if (!$expirationTimeElement.length) return;

        const createdAt = $expirationTimeElement.data('created-at');
        const createdAtDate = new Date(Number(createdAt));
        if (isNaN(createdAtDate.getTime())) {
            $expirationTimeElement.text('Ошибка времени');
            return;
        }

        const countdownDuration = 2 * 60 * 60 * 1000;
        const expirationDate = new Date(createdAtDate.getTime() + countdownDuration);

        let timerInterval;

        function updateTimer() {
            const now = new Date();
            const timeLeft = expirationDate - now;

            if (timeLeft <= 0) {
                $expirationTimeElement.text('00:00:00');
                clearInterval(timerInterval);
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            $expirationTimeElement.text(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    $('body').on('click', '.order__details-copy-button', function () {
        const targetId = $(this).data('copy-target');
        const $targetElement = $(`#${targetId}`);
        if ($targetElement.length) {
            let textToCopy = $targetElement.text() || $targetElement.val();
            textToCopy = textToCopy.trim().replace(/\s+/g, ' ');
            copyToClipboard(textToCopy);

            const $button = $(this);
            const originalSvg = $button.html();

            $button.html(`<svg width="20" height="20" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.99985 7.58545L9.59605 2.98926L10.3032 3.69636L4.99985 8.99965L1.81787 5.8177L2.52498 5.1106L4.99985 7.58545Z" fill="#646F93"/>
</svg> `);

            setTimeout(() => {
                $button.html(originalSvg);
            }, 2000);
        }
    });
    $("body").on("click", ".details__qr-switch-button", function () {
        const targetType = $(this).data("target");

        $(".details__qr-switch-button").removeClass("active");
        $(this).addClass("active");

        $(".details__qr-code-image-item").removeClass("active");
        $(`.details__qr-code-image-item[data-type="${targetType}"]`).addClass("active");
    });

    fetchOrder();
    setInterval(fetchOrder, 15000);
});

function copyToClipboard(text) {
    const $temp = $('<textarea>').val(text).css({
        position: 'absolute',
        left: '-9999px'
    }).appendTo('body');
    $temp.select();
    try {
        document.execCommand("copy");
    } catch (err) { }
    $temp.remove();
}

