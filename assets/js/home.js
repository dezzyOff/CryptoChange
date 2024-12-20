
import { debounce } from './utils.js';
import { errorToast, successToast, infoToast } from './utils.js';

const isOrderPage = window.location.pathname.includes('/order');
let selectedGiveObject = null;
let selectedReceiveObject = null;
let currenciesData = [];
const itemsPerPage = 50;
let loadedItems = 0;
let minimumAmount = null;
let maximumAmount = null;


function showLoader($element) {
    if ($element.find('.loader').length === 0) {
        const loaderHtml = '<div class="loader"></div>';
        $element.append(loaderHtml);
    }
}

function hideLoader($element) {
    $element.find('.loader').remove();
}

function showErrorMin() {
    $('#give-amount').addClass("error");
    $('.exchange__form-limit--min').addClass("error");
    $('.exchange__form-limit--min')
        .closest('.exchange__form-limit')
        .addClass("error");
    $('#receive-amount').text('');
}

function showErrorMax() {
    $('#give-amount').addClass("error");
    $('.exchange__form-limit--max').addClass("error");
    $('.exchange__form-limit--max')
        .closest('.exchange__form-limit')
        .addClass("error");
    $('#receive-amount').text('');
}

function clearErrorStyles() {
    $('#give-amount').removeClass("error");
    $('.exchange__form-limit--min, .exchange__form-limit--max').removeClass("error");
    $('.exchange__form-limit--max')
        .closest('.exchange__form-limit')
        .removeClass("error");
    $('.exchange__form-limit--min')
        .closest('.exchange__form-limit')
        .removeClass("error");
}
function displayError(message) {
    const $limitMinValue = $('.exchange__form-limit--min');
    const $limitMaxValue = $('.exchange__form-limit--max');
    $('#receive-amount').text(message);
    $limitMinValue.text('');
    $limitMaxValue.text('');
    showLoader($limitMinValue);
    showLoader($limitMaxValue);
}

async function fetchCurrencies() {
    const $form = $('.exchange__form-current-token');
    const $reciveAmount = $("#receive-amount");
    try {
        showLoader($form);
        $reciveAmount.text('');
        showLoader($reciveAmount);
        const response = await fetch('/api/currencies', {
            method: 'GET'
        });
        if (response.status !== 200) {
            displayError("Unavailable");
            hideLoader($form);
            hideLoader($reciveAmount);
            return;
        }

        const data = await response.json();

        if (response.status == 200) {
            hideLoader($form);
            hideLoader($reciveAmount);
            currenciesData = data.content;

            filteredCurrenciesMap['give'] = currenciesData;
            filteredCurrenciesMap['receive'] = currenciesData;

            renderCurrencies('.give-dialog', 'give');
            renderCurrencies('.receive-dialog', 'receive');
            setDefaultSelections();
            if (isOrderPage) {
                setSelectionsFromUrl();
            }
        } else {
            displayError("Unavailable");
            hideLoader($form);
            hideLoader($reciveAmount);
        }

    } catch (error) {
        displayError("Unavailable");
        hideLoader($form);
        hideLoader($reciveAmount);
    } finally {
        $('#give-amount').prop('disabled', false);
    }
}

async function validateAddress(currency, address, network) {
    try {
        const response = await fetch('/api/address/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency, address, network }),
        });

        if (response.status === 200) {
            const data = await response.json();
            return { valid: true, message: 'Address is valid.', address: data.address };
        } else {
            const errorData = await response.json();
            return { valid: false, message: errorData.message || 'Invalid address.' };
        }
    } catch (error) {
        return { valid: false, message: 'Network error occurred. Please try again later.' };
    }
}
async function submitOrderToApi(orderData) {
    try {
        const $submitOrder = $('#submit-order');
        $submitOrder.prop('disabled', true).text('');
        showLoader($submitOrder);

        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });

        if (response.status === 200) {
            const responseData = await response.json();
            const content = responseData.content;
            const id = content?.id;

            if (id) {
                const orderLink = `/order/${id}`;
                window.location.href = orderLink;
            } else {
                errorToast('An unexpected error occurred. Please contact support.');
            }
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.message || 'An unexpected error occurred. Please try again.';
            errorToast(errorMessage);
        }
    } catch (error) {
        errorToast('Network error occurred. Please try again later.');
    } finally {
        $('#submit-order').prop('disabled', false).text('Exchange');
    }
}

async function validatePairSettings() {
    const { currency: giveCurrency, network: giveNetwork } = selectedGiveObject || {};
    const { currency: receiveCurrency, network: receiveNetwork } = selectedReceiveObject || {};
    const $limitMinValue = $('.exchange__form-limit--min');
    const $limitMaxValue = $('.exchange__form-limit--max');
    if (!giveCurrency || !receiveCurrency || !receiveNetwork || !giveNetwork) {
        return;
    }

    const queryParams = new URLSearchParams({
        send: giveCurrency,
        receive: receiveCurrency,
        sendNetwork: giveNetwork,
        receiveNetwork: receiveNetwork
    });

    try {
        const response = await fetch(`/api/exchange/pair?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 200) {
            const data = await response.json();
            const content = data.content;

            minimumAmount = parseFloat(content.minimumAmount);
            maximumAmount = parseFloat(content.maximumAmount);
            $limitMinValue.text(`${content.minimumAmount} ${giveCurrency}`);
            $limitMaxValue.text(`${content.maximumAmount} ${giveCurrency}`);

            validateAmount();

            if (isOrderPage) {
                updateOrderTitle();
            }
        } else {
            const errorData = await response.json();
            displayError(errorData.message);
        }
    } catch (error) {
        displayError("Сетевая ошибка. Попробуйте позже.");
    }
}

async function fetchReceiveAmount(amount) {
    const giveCurrency = selectedGiveObject ? selectedGiveObject.currency : null;
    const giveNetwork = selectedGiveObject ? selectedGiveObject.network : null;
    const receiveCurrency = selectedReceiveObject ? selectedReceiveObject.currency : null;
    const receiveNetwork = selectedReceiveObject ? selectedReceiveObject.network : null;

    const queryParams = new URLSearchParams({
        send: giveCurrency,
        receive: receiveCurrency,
        sendNetwork: giveNetwork,
        receiveNetwork: receiveNetwork,
        amount: amount
    });

    try {
        const $reciveAmount = $("#receive-amount");
        $reciveAmount.text('');
        if (isOrderPage) {
            const $confirmation = $('.exchange__info-item-value-confirmation');
            const $fee = $('.exchange__info-item-value-fee');
            const $processing = $('.exchange__info-item-value-processing');

            const elements = [$confirmation, $fee, $processing];
            elements.forEach(element => element.html(''));
            elements.forEach(showLoader);
        }
        showLoader($reciveAmount);
        const response = await fetch(`/api/exchange/rate?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 200) {
            const data = await response.json();
            const content = data.content;
            $('#receive-amount').text(content.receiveAmount);
            if (isOrderPage) {
                const $confirmation = $('.exchange__info-item-value-confirmation');
                const $fee = $('.exchange__info-item-value-fee');
                const $processing = $('.exchange__info-item-value-processing');

                const elements = [$confirmation, $fee, $processing];
                elements.forEach(hideLoader);

                $confirmation.text(content.confirmations);
                $fee.text(`${content.networkFee} ${selectedReceiveObject.currency}`);
                $processing.text(content.processingTime);
            }
        } else {
            const errorData = await response.json();
            displayError(errorData.message);
        }
    } catch (error) {
        displayError("Сетевая ошибка. Попробуйте позже.");
    }
}

function isValidCurrencyNetwork(currency, network) {
    return currenciesData.some(
        (item) =>
            item.currency === currency &&
            item.networkList.some((net) => net.network === network)
    );
}

function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('from');
    const toParam = params.get('to');
    const amountParam = params.get('amount');
    return { fromParam, toParam, amountParam };
}

function setSelectionsFromUrl() {
    if (!isOrderPage) return;

    const { fromParam, toParam, amountParam } = getUrlParameters();

    if (fromParam) {
        const [currency, network] = fromParam.split('-');
        if (isValidCurrencyNetwork(currency, network)) {
            selectedGiveObject = { currency, network };
            updateSelectedToken('.give-currency .exchange__form-current-token', selectedGiveObject);
        } else {
        }
    }

    if (toParam) {
        const [currency, network] = toParam.split('-');
        if (isValidCurrencyNetwork(currency, network)) {
            selectedReceiveObject = { currency, network };
            updateSelectedToken('.receive-currency .exchange__form-current-token', selectedReceiveObject);
        } else {
        }
    }

    if (amountParam && !isNaN(parseFloat(amountParam))) {
        $('#give-amount').val(amountParam);
        validateAmount();
    } else if (amountParam) {
    }

    setDefaultSelections();

    validatePairSettings();
}


function updateUrlParameters(from, to, amount) {
    if (!isOrderPage) return;

    const params = new URLSearchParams();

    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (amount) params.set('amount', amount);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
}

function updateOrderTitle() {
    const giveElement = document.querySelector('.order__title-give');
    const receiveElement = document.querySelector('.order__title-receive');

    if (selectedGiveObject && selectedReceiveObject) {
        giveElement.textContent = selectedGiveObject.currency || 'Unknown';
        receiveElement.textContent = selectedReceiveObject.currency || 'Unknown';
    }
}

let loadedItemsMap = { give: 0, receive: 0 };
let filteredCurrenciesMap = { give: [], receive: [] };
function renderCurrencies(dialogSelector, type) {
    const $dialog = $(dialogSelector).empty();
    loadedItemsMap[type] = 0;

    if ($dialog.find('.currency-search-container').length === 0) {
        const $searchContainer = $('<div>')
            .addClass('exchange__form-dialog-search-container')


        const $searchInput = $('<input>')
            .attr({
                'type': 'text',
                'aria-label': 'Поиск монеты',
                'placeholder': 'Token'
            })
            .addClass('exchange__form-dialog-search-input')

            .on('input', debounce(function () {
                const query = $(this).val().trim().toLowerCase();
                handleSearch(type, query);
            }, 300));
        const searchIconHTML = `
                <svg class="exchange__form-dialog-search-icon" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M2.875 7.79167C2.875 5.07626 5.07626 2.875 7.79167 2.875C10.5071 2.875 12.7083 5.07626 12.7083 7.79167C12.7083 10.5071 10.5071 12.7083 7.79167 12.7083C5.07626 12.7083 2.875 10.5071 2.875 7.79167ZM7.79167 1.375C4.24784 1.375 1.375 4.24784 1.375 7.79167C1.375 11.3355 4.24784 14.2083 7.79167 14.2083C9.29334 14.2083 10.6745 13.6925 11.7677 12.8284L14.345 15.4057C14.6379 15.6985 15.1128 15.6985 15.4057 15.4057C15.6985 15.1128 15.6985 14.6379 15.4057 14.345L12.8284 11.7677C13.6925 10.6745 14.2083 9.29334 14.2083 7.79167C14.2083 4.24784 11.3355 1.375 7.79167 1.375Z" fill="currentColor"></path>
                </svg>
        `;
        const closeIconHTML = `
            <div class="exchange__form-dialog-close-icon-container">
                <svg class="exchange__form-dialog-close-icon" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.847904 9.9278C1.26392 10.338 1.98462 10.3204 2.36548 9.93952L5.50025 6.80475L8.62329 9.93366C9.02759 10.338 9.72486 10.338 10.135 9.92194C10.551 9.50592 10.5569 8.80866 10.1526 8.40436L7.02954 5.27545L10.1526 2.15241C10.5569 1.74811 10.551 1.05084 10.135 0.640688C9.719 0.224672 9.02759 0.218813 8.62329 0.62311L5.50025 3.74616L2.36548 0.61725C1.98462 0.236391 1.26392 0.218813 0.847904 0.634828C0.437748 1.05084 0.449467 1.76569 0.836186 2.14655L3.97095 5.27545L0.836186 8.41022C0.449467 8.79108 0.431889 9.51178 0.847904 9.9278Z" fill="currentColor"></path>
                </svg>
            </div>
        `;
        const $searchIcon = $(searchIconHTML);
        const $closeIcon = $(closeIconHTML);
        $searchContainer.append($searchIcon, $searchInput, $closeIcon);
        $dialog.append($searchContainer);
    }

    if (!filteredCurrenciesMap[type].length) {
        filteredCurrenciesMap[type] = currenciesData;
    }

    loadMoreCurrencies($dialog, type);

    $dialog.off('scroll').on('scroll', () => {
        if ($dialog.scrollTop() + $dialog.innerHeight() >= $dialog[0].scrollHeight - 10) {
            loadMoreCurrencies($dialog, type);
        }
    });
}
function handleSearch(type, query) {
    if (query === '') {

        filteredCurrenciesMap[type] = currenciesData;
    } else {

        filteredCurrenciesMap[type] = currenciesData.filter(currency =>
            currency.currency.toLowerCase().includes(query)
        );
    }

    loadedItemsMap[type] = 0;
    const $dialog = $(type === 'give' ? '.give-dialog' : '.receive-dialog');
    $dialog.find('.exchange__form-token').remove();
    loadMoreCurrencies($dialog, type);
}

function loadMoreCurrencies($dialog, type, onclick) {
    const listToRender = filteredCurrenciesMap[type] || currenciesData;
    const startIndex = loadedItemsMap[type];
    const currenciesToRender = listToRender.slice(startIndex, startIndex + itemsPerPage);

    if (currenciesToRender.length === 0) return;

    currenciesToRender.forEach(currency => {
        const $tokenDiv = createTokenDiv(currency, type);
        $dialog.append($tokenDiv);
    });

    loadedItemsMap[type] += itemsPerPage;
}

function createTokenDiv(currency, type) {
    const $iconImg = $('<img>')
        .addClass('exchange__form-token-icon')
        .attr({
            src: `/assets/images/coins/${currency.currency}.svg`,
            alt: ``
        })
        .on('error', function () {
            this.onerror = null;
            this.src = '/assets/icon.svg';
        });
    const $textDiv = $('<div>')
        .addClass('exchange__form-token-text')
        .text(currency.currency);

    const $tokenOption = $('<button>')
        .addClass('exchange__form-token-option')
        .append($iconImg, $textDiv);

    const $networkDiv = $('<div>')
        .addClass('exchange__form-network')
        .hide();

    currency.networkList.forEach(network => {
        const $networkItem = createNetworkItem(currency, network, type);
        $networkDiv.append($networkItem);
    });

    $tokenOption.on('click', event => {
        event.stopPropagation();
        $networkDiv.slideToggle();
    });

    return $('<div>')
        .addClass('exchange__form-token')
        .append($tokenOption, $networkDiv);
}

function createNetworkItem(currency, network, type) {
    const $iconImg = $('<img>')
        .addClass('exchange__form-network-icon')
        .attr({
            src: `/assets/images/coins/${currency.currency}.svg`,
            alt: ``
        })
        .on('error', function () {
            this.onerror = null;
            this.src = '/assets/icon.svg';
        });
    const $textDiv = $('<div>')
        .addClass('exchange__form-network-text')
        .text(`${currency.currency} - `);
    const $textDivNetwork = $('<div>')
        .addClass('exchange__form-network-text')
        .text(`${network.network}`);
    const $networkItem = $('<button>', { type: 'button' })
        .addClass('exchange__form-network-option')
        .append($iconImg, $textDiv, $textDivNetwork)
        .on('click', event => {
            event.stopPropagation();
            handleNetworkSelection(currency, network, type);
        });

    return $networkItem;
}

function handleNetworkSelection(currency, network, type) {
    const selectedObject = { currency: currency.currency, network: network.network };

    if (type === 'give') {
        selectedGiveObject = selectedObject;
        updateSelectedToken('.give-currency .exchange__form-current-token', selectedGiveObject);
    } else if (type === 'receive') {
        selectedReceiveObject = selectedObject;
        updateSelectedToken('.receive-currency .exchange__form-current-token', selectedReceiveObject);
    }

    closeAllDialogs();
    validatePairSettings();

    if (isOrderPage) {
        updateUrlParameters(
            selectedGiveObject ? `${selectedGiveObject.currency}-${selectedGiveObject.network}` : null,
            selectedReceiveObject ? `${selectedReceiveObject.currency}-${selectedReceiveObject.network}` : null,
            $('#give-amount').val() || null
        );
    }
}

function updateSelectedToken(selector, selectedObject) {
    const $iconImg = $('<img>')
        .addClass('exchange__form-token-icon')
        .attr({
            src: `/assets/images/coins/${selectedObject.currency}.svg`,
            alt: `${selectedObject.currency} icon`
        })
        .on('error', function () {
            this.onerror = null;
            this.src = '/assets/icon.svg';
        });
    const $textDiv = $('<div>')
        .addClass('exchange__form-token-text')
        .text(`${selectedObject.currency} - `);
    const $textDivNetwork = $('<div>')
        .addClass('exchange__form-token-text')
        .text(`${selectedObject.network}`);

    $(selector)
        .empty()
        .append($iconImg, $textDiv, $textDivNetwork);
}

function setDefaultSelections() {
    if (isOrderPage) {
        const { fromParam, toParam } = getUrlParameters();
        const isFromSet = fromParam && isValidCurrencyNetwork(...fromParam.split('-'));
        const isToSet = toParam && isValidCurrencyNetwork(...toParam.split('-'));

        if (isFromSet && isToSet) {
            return;
        }
    }

    if (!selectedGiveObject) {
        const btcCurrency = currenciesData.find(currency => currency.currency === 'BTC');
        if (btcCurrency && btcCurrency.networkList.length > 0) {
            selectedGiveObject = {
                currency: btcCurrency.currency,
                network: btcCurrency.networkList[2].network
            };
            updateSelectedToken('.give-currency .exchange__form-current-token', selectedGiveObject);
        }
    }

    if (!selectedReceiveObject) {
        const ethCurrency = currenciesData.find(currency => currency.currency === 'ETH');
        if (ethCurrency && ethCurrency.networkList.length > 0) {
            selectedReceiveObject = {
                currency: ethCurrency.currency,
                network: ethCurrency.networkList[3].network
            };
            updateSelectedToken('.receive-currency .exchange__form-current-token', selectedReceiveObject);
        }
    }

    validatePairSettings();
}


function validateOrderData(data) {
    const address = $("#receive-address").val().trim();
    const currency = selectedReceiveObject?.currency || null;
    const network = selectedReceiveObject?.network || null;
    const amount = parseFloat($('#give-amount').val());

    if (!$("#checkbox").is(':checked')) {
        return false;
    }

    if (!address || !currency || !network) {
        return false;
    }

    if (isNaN(amount) || amount <= 0) {
        return false;
    }
    const hash = payloadHash.getHash();
    const payload = hash;
    return {
        send: selectedGiveObject?.currency,
        receive: selectedReceiveObject?.currency,
        sendNetwork: selectedGiveObject?.network,
        receiveNetwork: selectedReceiveObject?.network,
        amount: amount,
        receiveAddress: address,
        payload: payload
    };
}

function isAmountWithinLimits(amount) {
    if (minimumAmount === null || maximumAmount === null) return false;
    if (amount === '') {
        $('#receive-amount').text('');
        showErrorMin();
        showErrorMax();
        return false;
    }
    if (isNaN(amount)) {
        $('#receive-amount').text('');
        showErrorMin();
        showErrorMax();
        return false;
    }
    if (amount < minimumAmount) {
        showErrorMin();
        return false;
    }
    if (amount > maximumAmount) {
        showErrorMax();
        return false;
    }
    return true;
}


function updateSubmitButtonState() {
    const isAddressValid = $('#receive-address').hasClass('valid');
    const isCheckboxChecked = $('#checkbox').is(':checked');
    const amount = parseFloat($('#give-amount').val());
    const isAmountValid = isAmountWithinLimits(amount);
    const isValid = isAddressValid && isCheckboxChecked && isAmountValid;

    $('#submit-order').prop('disabled', !isValid).toggleClass('enabled', isValid);
}
const debouncedValidateAddress = debounce(async () => {
    const address = $('#receive-address').val().trim();
    const currency = selectedReceiveObject?.currency || null;
    const network = selectedReceiveObject?.network || null;

    if (!address || !currency) {
        $('#receive-address').removeClass('valid invalid loading error');
        updateSubmitButtonState();
        return;
    }

    $('#receive-address').addClass('loading');
    const { valid, message } = await validateAddress(currency, address, network);

    $('#receive-address').removeClass('loading');

    if (valid) {
        $('#receive-address').removeClass('error invalid').addClass('valid');
    } else {
        $('#receive-address').removeClass('valid').addClass('error');
        errorToast(message);
    }

    updateSubmitButtonState();
}, 500);


function validateAmount() {
    try {
        const amount = parseFloat($('#give-amount').val());

        if (!isAmountWithinLimits(amount)) {
            if (isOrderPage) {
                updateSubmitButtonState();
            }
            $('#receive-amount').text('');
            return;
        }

        clearErrorStyles();
        fetchReceiveAmount(amount);

        if (isOrderPage) {
            updateUrlParameters(
                selectedGiveObject ? `${selectedGiveObject.currency}-${selectedGiveObject.network}` : null,
                selectedReceiveObject ? `${selectedReceiveObject.currency}-${selectedReceiveObject.network}` : null,
                amount
            );
            updateSubmitButtonState();
        }
    } catch (error) {
    }
}

function initializeEventHandlers() {
    $('#checkbox').on('change', updateSubmitButtonState);
    $('#receive-address').on('input', debouncedValidateAddress);
}

function closeAllDialogs() {
    $('.exchange__form-dialog, .exchange__form-network').slideUp();
}
$('.exchange__form-current-token').on('click', function (event) {
    event.stopPropagation(); 

    var $currentDialog = $(this).siblings('.exchange__form-dialog');

    if ($currentDialog.is(':visible')) {
        $currentDialog.slideUp();
    } else {
        closeAllDialogs();
        $currentDialog.slideDown();
    }
});
$('body').on('click', '.exchange__form-dialog-close-icon-container', function (event) {
    event.stopPropagation();
    $(this).closest('.exchange__form-dialog').slideUp();
});
$(document).on('click', function (event) {
    if (!$(event.target).closest('.exchange__form-dialog, .exchange__form-network, .exchange__form-current-token').length) {
        closeAllDialogs();
    }
});
const debouncedValidateAmount = debounce(validateAmount, 500);
$('#give-amount').on('input', debouncedValidateAmount);

$('#reverse-currency').on('click', async function () {

    $(this).prop('disabled', true);

    $(".exchange__form-limit--min").text('');
    $(".exchange__form-limit--max").text('');
    showLoader($('.exchange__form-limit--min'));
    showLoader($('.exchange__form-limit--max'));

    if (!selectedGiveObject || !selectedReceiveObject) {
        return;
    }

    const temp = selectedGiveObject;
    selectedGiveObject = selectedReceiveObject;
    selectedReceiveObject = temp;

    updateSelectedToken('.give-currency .exchange__form-current-token', selectedGiveObject);
    updateSelectedToken('.receive-currency .exchange__form-current-token', selectedReceiveObject);

    try {
        await Promise.all([
            validatePairSettings(),
            isOrderPage ? debouncedValidateAddress() : Promise.resolve()
        ]);
        const giveAmount = $('#give-amount').val();
        if (isOrderPage) {
            updateUrlParameters(
                selectedGiveObject ? `${selectedGiveObject.currency}-${selectedGiveObject.network}` : null,
                selectedReceiveObject ? `${selectedReceiveObject.currency}-${selectedReceiveObject.network}` : null,
                giveAmount || null
            );
        }
    } finally {
        $(this).prop('disabled', false);
    }
});


$('.exchange__form-button').on('click', function () {
    if (!selectedGiveObject || !selectedReceiveObject) {
        return;
    }
    if ($('#give-amount').hasClass("error") || $('#receive-amount').text() === '') {
        return;
    }
    const amount = parseFloat($('#give-amount').val());
    if (isNaN(amount) || amount <= 0) {
        return;
    }
    const fromParam = selectedGiveObject ? `${selectedGiveObject.currency}-${selectedGiveObject.network}` : null;
    const toParam = selectedReceiveObject ? `${selectedReceiveObject.currency}-${selectedReceiveObject.network}` : null;
    const amountParam = amount;

    const params = new URLSearchParams();
    if (fromParam) params.set('from', fromParam);
    if (toParam) params.set('to', toParam);
    if (amountParam) params.set('amount', amountParam);
    const orderUrl = `/order?${params.toString()}`;
    window.location.href = orderUrl;
});

$('#submit-order').on('click', function () {
    const orderData = validateOrderData();
    if (orderData) {
        submitOrderToApi(orderData);
    }
});

$(document).ready(async function () {
    $('#give-amount').prop('disabled', true);
    fetchCurrencies();
});
window.addEventListener('popstate', () => {
    if (isOrderPage) {
        setSelectionsFromUrl();
    }
});
$(document).ready(function () {
    if (isOrderPage) {
        updateOrderTitle();
    }
    initializeEventHandlers();
    updateSubmitButtonState();
});



