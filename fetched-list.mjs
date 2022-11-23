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

    get targetInput() {
        if (this.valueFrom && document.getElementById(this.valueFrom)) return document.getElementById(this.valueFrom)
        return this.input
    }

    connectedCallback() {
        this.targetInput.addEventListener('input', this.fetchHandler.bind(this))
        if (this.titleCase) this.targetInput.addEventListener('keyup', this.toTitleCase.bind(this))
        if (this.autoSelect) {
            this.targetInput.addEventListener('blur', this.selectFirstOption.bind(this))
            this.targetInput.addEventListener('keyup', this.enterKeyHandler.bind(this))
        }
        if (this.titleCase && this.initialFetch) this.toTitleCase()
        if (this.initialFetch) this.fetchHandler()
    }

    disconnectedCallback() {
        this.targetInput.removeEventListener('input', this.fetchHandler.bind(this))
        this.targetInput.removeEventListener('keyup', this.toTitleCase.bind(this))
        this.targetInput.removeEventListener('blur', this.selectFirstOption.bind(this))
        this.targetInput.removeEventListener('keyup', this.enterKeyHandler.bind(this))
    }

    requestOptionsUpdate() {
        return this.fetchOptions().then(this.parseOptions.bind(this)).then(this.fillOptions.bind(this))
    }

    fetchOptions() {
        const url = new URL(this.url, window.location)
        url.searchParams.set(this.param, this.targetInput.value)
        return fetch(url.href).then(r => r.json())
    }

    parseOptions(data, initial = []) {
        if (typeof data != 'object' || (this.check && !this.resolvePath(data, this.check))) return initial;
        const items = this.listPath ? this.resolvePath(data, this.listPath) : data;
        const options = this.valuePath ? items.map(item => ({
            label: this.resolvePath(item, this.labelPath),
            value: this.resolvePath(item, this.valuePath)
        })) : items;
        return Array.isArray(options) ? [...new Set(options)] : initial;
    }

    fillOptions(options = []) {
        const optionsValues = options.map(({value} = {}) => value)
        if (this.removeOptions) this.options.filter(value =>
            !optionsValues.includes(value)).forEach(this.removeOption.bind(this))
        options.filter(({value} = {}) => !this.options.includes(value)).forEach(this.createOption.bind(this))
        this.options = optionsValues
    }

    createOption({label = '', value = ''} = {}) {
        return this.datalist.querySelector(`option[value="${value}"]`) ||
            this.datalist.appendChild(Object.assign(document.createElement('option'), {label, value}))
    }

    removeOption(value) {
        return this.datalist.querySelectorAll(`option[value="${value}"]`).forEach(node => node.parentNode.removeChild(node))
    }

    attachElement(name) {
        return this.querySelector(name) || this.appendChild(document.createElement(name))
    }

    selectFirstOption() {
        const targetOption = this.datalist.querySelector(`option[value*="${this.targetInput.value}"]`)
        if (targetOption) this.targetInput.value = targetOption.value
    }

    connectDatalist(id = this.id) {
        if (!this.datalist.id) this.datalist.id = id || Math.random().toString(16).slice(2)
        if (this.datalist.id !== this.input.getAttribute('list')) this.input.setAttribute('list', this.datalist.id)
    }

    resolvePath(object, path, defaultValue) {
        if (!path || !object) return defaultValue;
        return path?.split('.')?.reduce((o, p) => o ? o[p] : defaultValue, object)
    }

    throttle(callback, limit) {
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

    enterKeyHandler({key} = {}) {
        return key === "Enter" ? this.selectFirstOption() : null
    }

    toTitleCase() {
        return this.targetInput.value = this.targetInput.value.split(/\s+/).map(s => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase()).join(" ");
    }
}

export default FetchedList
