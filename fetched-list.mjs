/**
 * @element fetched-list
 *
 * @attr url - API endpoint for fetching options
 * @attr param - Name of query parameter where to put text from input
 * @attr check - Absolute JSON path to property that indicate successful response
 * @attr list-path - Absolute JSON path to property that contains array with options
 * @attr value-path - Relative JSON path to property that contains value of each option
 * @attr label-path - Relative JSON path to property that contains label of each option
 * @attr value-from - ID of outer input element to be used instead of inner input
 * @attr title-case - Automatically capitalize first letter when typing
 * @attr auto-select - Automatically select most relevant variant from list
 * @attr initial-fetch - Prefetch an options before input
 * @attr remove-options - Clear list of options before populating
 */
export class FetchedList extends HTMLElement {
    constructor() {
        super();

        this.options = []
        this.input = this.attachElement('input')
        this.url = this.getAttribute('url')
        this.param = this.getAttribute('param')
        this.check = this.getAttribute('check')
        this.datalist = this.attachElement('datalist')
        this.listPath = this.getAttribute('list-path')
        this.valuePath = this.getAttribute('value-path')
        this.labelPath = this.getAttribute('label-path')
        this.valueFrom = this.getAttribute('value-from')
        this.titleCase = this.getAttribute('title-case')
        this.autoSelect = this.getAttribute('auto-select')
        this.initialFetch = this.getAttribute('initial-fetch')
        this.removeOptions = this.getAttribute('remove-options')

        this.fetchHandler = this.throttle(this.requestOptionsUpdate.bind(this), 500)
        this.connectDatalist()
    }

    /**
     * Getter for target input element
     * @return {HTMLElement|*}
     */
    get targetInput() {
        if (this.valueFrom && document.getElementById(this.valueFrom)) return document.getElementById(this.valueFrom)
        return this.input
    }

    connectedCallback() {
        this.targetInput.addEventListener('input', this.fetchHandler.bind(this))
        if (this.titleCase) this.targetInput.addEventListener('keyup', this.valueToTitleCase.bind(this, undefined))
        if (this.autoSelect) {
            this.targetInput.addEventListener('blur', this.selectOption.bind(this, undefined))
            this.targetInput.addEventListener('keyup', this.keyboardHandler.bind(this))
        }
        if (this.titleCase && this.initialFetch) this.valueToTitleCase()
        if (this.initialFetch) this.fetchHandler()
    }

    disconnectedCallback() {
        this.targetInput.removeEventListener('input', this.fetchHandler.bind(this))
        this.targetInput.removeEventListener('keyup', this.valueToTitleCase.bind(this, undefined))
        this.targetInput.removeEventListener('blur', this.selectOption.bind(this, undefined))
        this.targetInput.removeEventListener('keyup', this.keyboardHandler.bind(this))
    }

    /**
     * Triggers options update lifecycle
     * @return {Promise<Array>} Array of current options
     */
    requestOptionsUpdate() {
        return this.fetchOptions().then(this.parseOptions.bind(this)).then(this.fillOptions.bind(this))
    }

    /**
     * Fetch API endpoint with current parameters
     * @return {Promise<any>} Response data
     */
    fetchOptions() {
        const url = new URL(this.url, window.location)
        if (this.targetInput && this.targetInput.value && this.targetInput.value.length)
            url.searchParams.set(this.param, this.targetInput.value)
        return fetch(url).then(r => r.json())
    }

    /**
     * Parsing options from data with fallback array
     * @param data {Object} Data object
     * @param initial {Array<Object>} Fallback array
     * @return {Array<Object>} Array of options
     */
    parseOptions(data = {}, initial = []) {
        if (typeof data != 'object' || (this.check && !this.resolvePath(data, this.check))) return initial;
        const items = this.listPath ? this.resolvePath(data, this.listPath) : data;
        const options = this.valuePath ? items.map(item => ({
            label: this.resolvePath(item, this.labelPath),
            value: this.resolvePath(item, this.valuePath)
        })) : items.map(value => ({value}));
        return Array.isArray(options) ? [...new Set(options)] : initial;
    }

    /**
     * Options filling from an array to a datalist
     * @param options {Array<Object>} Array of options
     * @return {Array<Object>} Array of options
     */
    fillOptions(options = []) {
        const optionsValues = options.map(({value} = {}) => value)
        if (this.removeOptions) this.options.filter(value =>
            !optionsValues.includes(value)).forEach(this.removeOption.bind(this))
        options.filter(({value} = {}) => !this.options.includes(value)).forEach(this.createOption.bind(this))
        this.options = optionsValues
        return options
    }

    /**
     * Adds an option element to datalist if it doesn't exist
     * @param value {String} Option value
     * @param label {String} Option label
     */
    createOption({value = '', label = ''} = {}) {
        if (this.datalist.querySelector(`option[value="${value}"]`)) return;
        this.datalist.appendChild(Object.assign(document.createElement('option'), {label, value}))
    }

    /**
     * Removes an option from datalist
     * @param value {String} Option value
     */
    removeOption(value) {
        this.datalist.querySelectorAll(`option[value="${value}"]`).forEach(node => node.parentNode.removeChild(node))
    }

    /**
     * Adds an element to host root if it doesn't exist
     * @param name Element tag
     * @return {HTMLElement} Target element node
     */
    attachElement(name) {
        return this.querySelector(name) || this.appendChild(document.createElement(name))
    }

    /**
     * Sets target option as value of input element
     * @param option {HTMLOptionElement} Target option element
     */
    selectOption(option = this.getFirstOption()) {
        if (option && option.value) this.targetInput.value = option.value
    }

    /**
     * Returns first suggested option for target value
     * @param value {String} Target value
     * @return {HTMLOptionElement|undefined} Suggested option element
     */
    getFirstOption(value = this.targetInput.value) {
        return this.datalist.querySelector(`option[value*="${value}"]`)
    }

    /**
     * Connects datalist to target input element via an ID
     * @param id {String} ID of datalist element
     */
    connectDatalist(id = this.id) {
        if (!this.datalist.id) this.datalist.id = id || Math.random().toString(16).slice(2)
        if (this.datalist.id !== this.input.getAttribute('list'))
            this.input.setAttribute('list', this.datalist.id)
    }

    /**
     * Returns property from object by JSON path
     * @param object {Object} Target object
     * @param path {String} JSON path
     * @param defaultValue Fallback value
     * @return {*} Target value
     */
    resolvePath(object = {}, path = '', defaultValue) {
        if (!object || typeof path !== 'string' || !path.length) return defaultValue;
        return path.split('.').reduce((o, p) => o ? o[p] : defaultValue, object)
    }

    /**
     * Returns wrapper of throttled method
     * @param callback {Function} Target method
     * @param limit {Number} Throttling time
     * @return {Function} Throttled method
     */
    throttle(callback, limit = 0) {
        let waiting = false;
        return function () {
            if (!waiting) {
                callback.apply(this, arguments);
                waiting = true;
                setTimeout(function () {
                    waiting = false;
                }, limit);
            }
        }
    }

    /**
     * Handler for keyboard events
     * @param key {String} Target key name
     */
    keyboardHandler({key} = {}) {
        if (key === "Enter") this.selectOption()
    }

    /**
     * Convert string to Title Case
     * @param value {String} String to conversion
     * @return {String} Converted string
     */
    toTitleCase(value = '') {
        return value.split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase()).join(" ");
    }

    /**
     * Set target input value to Title Case
     * @param input {HTMLInputElement} Target input
     */
    valueToTitleCase(input = this.targetInput) {
        input.value = this.toTitleCase(input.value)
    }
}

export default FetchedList
