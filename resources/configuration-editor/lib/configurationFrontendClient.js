"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Services {
    constructor(store) {
        this.store = store;
    }
    getConfiguration() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.store.host}configuration/${this.store.id}`,
                method: 'GET',
                dataType: 'json',
                success: resolve,
                error: reject
            });
        });
    }
    getRecentRulesets() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${this.store.host}rulesets/recent`,
                method: 'GET',
                dataType: 'json',
                success: resolve,
                error: reject
            });
        });
    }
    getHelp() {
        return new Promise((resolve, reject) => {
            $.getJSON(`${this.store.host}help.json`, function (data) {
                $.each(data, function (key, val) {
                    console.log(`key: ${JSON.stringify(key)} value: ${JSON.stringify(val)}`);
                });
            });
        });
    }
}
exports.Services = Services;
class RhamtConfigurationStore {
    constructor(host, id) {
        this.host = host;
        this.id = id;
    }
    setConfig(config) {
        this.config = config;
        this.onReload(config);
    }
}
class SocketWrapper {
    constructor(_socket) {
        this._socket = _socket;
    }
    onServerMessage(message, fn) {
        return this._socket.on(message, (...args) => {
            try {
                fn(...args);
            }
            catch (err) {
                console.log(`Error onServerMessage - ${err}`);
            }
        });
    }
    emitToHost(message, ...args) {
        return this._socket.emit(message, ...args);
    }
}
exports.SocketWrapper = SocketWrapper;
class ConfigClient {
    constructor(host, id, elementData, form) {
        // const url = `${window.location.protocol}//${host}?id=${id}`;
        const url = `${host}?id=${id}`;
        this.store = new RhamtConfigurationStore(host, id);
        this._services = new Services(this.store);
        this.elementData = elementData;
        this.form = form;
        const tempUrl = new URL(url);
        console.log(`host: ${host}`);
        console.log(`url: ${url}`);
        console.log(`pathname: ${tempUrl.pathname}`);
        this._socket = new SocketWrapper(io.connect(url, {path: tempUrl.pathname}));
        this._socket.onServerMessage('connect', () => {
        });
        this._socket.onServerMessage('disconnect', () => {
            console.log('client disconnected');
        });
        this._socket.onServerMessage('notFound', () => {
            console.log('configuration not found');
        });
        this._socket.onServerMessage('progressMessage', (data) => {
            this.store.onProgress(data);
        });
        this._socket.onServerMessage('startingAnalysis', (data) => {
            this.store.onStartingAnalysis();
        });
        this._socket.onServerMessage('analysisStarted', (data) => {
            this.store.onAnalysisStarted();
        });
        this._socket.onServerMessage('analysisComplete', (data) => {
            this.store.onAnalysisCompleted(data);
        });
        this._socket.onServerMessage('analysisStopped', (data) => {
            this.store.onServerStopped();
        });
        this._socket.onServerMessage('errorStartingServer', (data) => {
            this.store.onErrorStartingServer();
        });
        this._socket.onServerMessage('errorCancellingAnalysis', (data) => {
            this.store.onErrorCancellingAnalysis();
        });
        this._socket.onServerMessage('installCliChanged', (data) => {
            this.store.onInstallCliChanged(data);
        });
        this._socket.onServerMessage('updateOption', (data) => {
            this.store.config.options = data.options;
            const option = this.elementData.options.find((item) => {
                return item.name === data.option.name;
            });
            this.bindOption(option, this.store.config);
        });
        this._socket.onServerMessage('updateName', (data) => {
        });
        this._socket.onServerMessage('recentRuleset', (data) => {
            console.log(`New ruleset: ${data}`);
            
        });
        this.loadConfiguration().then(() => {
            this.renderOptions(this.store.config);
            this.bindOptions(this.elementData, this.store.config);
        });
        $('.overlay-container').click(() => {
            this.hideEditDialog();
        });
        $('.overlay-container *').click(function (e) {
            e.stopPropagation();
        });
        $('.recent-container').click(() => {
            this.hideRecentDialog();
        });
        $('.recent-container *').click(function (e) {
            e.stopPropagation();
        });
        $(document).keyup(e => {
            if (e.key === 'Escape') {
                this.hideEditDialog();
                this.hideRecentDialog();
            }
            else if (e.which === 13 && $(`.recent-container`).is(':visible')) {
                this.hideRecentDialog();
                this.updateRulesetsOption();
            }
        });
        $('#elementForm').on('click', 'div.table-row', e => {
            if ($(e.target).hasClass('delete-action')) {
                return;
            }
            $('div.table-row').removeClass('selected');
            const container = $(e.target).closest('.table-row');
            console.log(container);
        });
    }
    loadConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._services.getConfiguration().then(data => {
                this.store.setConfig(data['config']);
            }).catch(e => {
                console.log(`exception getting configuration - ${e}`);
            });
        });
    }
    renderOptions(config) {
        for (const option of this.elementData['options']) {
            if (option.type === 'Boolean') {
                this.renderBooleanOption(option, config);
            }
            else if (option['ui-type'].includes('many') || option['ui-type'].includes('select-many')) {
                this.renderManyOption(option, config);
            }
            else {
                this.renderSingleOption(option, config);
            }
        }
    }
    renderManyOption(option, config) {
        const container = document.createElement('div');
        container.style.paddingTop = '12px';
        container.classList.add('form-checkbox');
        this.form.append(container);
        const wrapper = document.createElement('label');
        wrapper.setAttribute('aria-live', 'polite');
        container.appendChild(wrapper);
        const input = document.createElement('input');
        input.classList.add('form-checkbox-details-trigger');
        input.id = option.name;
        input.type = 'checkbox';
        input.setAttribute('aria-describedby', 'help-text-for-checkbox');
        wrapper.appendChild(input);
        const title = document.createElement('span');
        title.classList.add('code');
        title.textContent = `--${option.name}`;
        wrapper.appendChild(title);
        if (option.required) {
            const required = document.createElement('span');
            required.classList.add('form-required');
            required.textContent = '*';
            wrapper.appendChild(required);
            input.checked = true;
            input.setAttribute('checked', 'checked');
            input.disabled = true;
        }
        const note = document.createElement('p');
        note.classList.add('note');
        note.id = 'help-text-for-checkbox';
        note.textContent = option.description;
        wrapper.appendChild(note);
        const details = document.createElement('span');
        details.id = `${option.name}-details`;
        details.classList.add('text-normal');
        container.appendChild(details);
        input.onclick = () => {
            details.style.display = input.checked ? 'inherit' : 'none';
            this.updateOption({ name: option.name, value: [] });
        };
        const group = document.createElement('dl');
        group.style.marginTop = '10px';
        details.appendChild(group);
        const top = document.createElement('dd');
        group.appendChild(top);
        const table = document.createElement('table');
        table.id = `${option.name}-table`;
        table.style.width = '100%';
        table.style.marginRight = '20px';
        table.classList.add('user-table');
        top.appendChild(table);
        const availableOptions = option['available-options'];
        if (option['ui-type'].includes('select-many') && availableOptions && availableOptions.length > 0) {
            availableOptions.sort();
            availableOptions.forEach((item) => {
                table.appendChild(this.createTableRow(option, item, 'built-in', config, true));
            });
        }
        else {
            const placeholder = document.createElement('p');
            placeholder.id = `${option.name}-placeholder`;
            placeholder.style.display = 'block';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '16px';
            placeholder.style.borderRadius = '3px';
            placeholder.style.color = '#586069';
            placeholder.style.border = '1px #586069 dashed';
            placeholder.textContent = option.placeholder;
            top.appendChild(placeholder);
        }
        const toolbar = document.createElement('div');
        toolbar.style.padding = '0px 0px 0px 0px';
        toolbar.style.display = 'flex';
        toolbar.style.justifyContent = 'flex-start';
        toolbar.style.marginTop = '10px';
        top.appendChild(toolbar);
        const addButton = this.createAddButton();
        toolbar.appendChild(addButton);
        this.bindAddButton(option, addButton);
        
        if (option['ui-type'].includes('recent')) {
            const recentButton = this.createRecentButton();
            recentButton.style.marginLeft = '5px';
            toolbar.appendChild(recentButton);
            recentButton.onclick = () => {
                this.showRecentDialog(option, undefined);
            };
        }
    }

    createRecentButton() {
        const addButton = document.createElement('a');
        addButton.classList.add('monaco-button', 'monaco-text-button', 'setting-exclude-addButton');
        addButton.setAttribute('role', 'button');
        addButton.style.color = 'rgb(255, 255, 255)';
        addButton.style.backgroundColor = 'rgb(14, 99, 156)';
        addButton.style.width = 'auto';
        addButton.style.padding = '2px 14px';
        addButton.textContent = 'Recent...';
        return addButton;
    }

    showRecentDialog(option) {
        this._services.getRecentRulesets().then(data => {
            this.doShowRecentRulesetDialog(data, option);
        }).catch(e => {
            console.log(`error while lading recent rulesets - ${e}`);
        });
    }

    doShowRecentRulesetDialog(data, option) {
        this.populateRecentTable(option, this.store.config, data);
        $('.recent-container').css('display', 'block');
    }

    updateRulesetsOption() {
        const option = 'userRulesDirectory';
        let values = this.store.config.options[option] || [];
        $(`#recent-table .option-input:checkbox:checked`).each((index, value) => {
            values.push($(value).data('option-item'));
        });
        this.updateOption({ name: option, value: values });
    }

    populateRecentTable(option, config, recent) {
        const values = config.options[option.name];
        $('#recent-table').children().remove();
        let empty = true;
        if (recent) {
            recent.forEach((item) => {
                if (!values || !values.includes(item)) {
                    empty = false;
                    $(`#recent-table`).append(this.createTableRow(option, item, `recent-${option.name}-custom`, config, false));
                }
            });
        }
        if (!empty) {
            $('#recent-table').css('display', 'block');
            $('#no-rulesets-placeholder').css('display', 'none');
            $('#select-recent-label').css('display', 'block');
        }
        else {
            $('#recent-table').css('display', 'none');
            $('#no-rulesets-placeholder').css('display', 'block');
            $('#select-recent-label').css('display', 'none');
        }
    }

    hideRecentDialog() {
        $('.recent-container').css('display', 'none');
    }

    createTableRow(option, item, group, config, bind) {
        const row = document.createElement('tr');
        row.classList.add(group, 'option-row');
        const data = document.createElement('td');
        data.classList.add('option-data');
        data.style.padding = '0px';
        row.appendChild(data);
        const wrapper = document.createElement('label');
        wrapper.classList.add('option-label');
        data.appendChild(wrapper);
        const input = document.createElement('input');
        input.classList.add('option-input');
        input.style.margin = '0px';
        input.style.cssFloat = 'none';
        input.style.verticalAlign = 'inherit';
        input.style.outline = '0';
        input.id = `${option.name}-${item}`;
        input.type = 'checkbox';
        $(input).data('option-item', item);
        wrapper.appendChild(input);
        if (bind) {
            input.onclick = () => {
                this.updateSelectManyOption(option, item, input.checked, config);
            };
        }
        const content = document.createElement('div');
        content.classList.add('option-content');
        wrapper.appendChild(content);
        const title = document.createElement('span');
        title.textContent = item;
        content.appendChild(title);
        return row;
    }
    bindAddButton(option, button) {
        if (option['ui-type'].includes('java-package') || option['ui-type'].includes('select-many')) {
            button.onclick = () => {
                this.showEditDialog(option.name, undefined);
            };
        }
        else {
            button.onclick = () => {
                this.showEditDialog(option.name, () => this.promptExternal(option));
            };
        }
    }
    showEditDialog(option, lookupAction, edit) {
        $('#editDialogInput').unbind();
        $('#editDialogInput').keypress(e => {
            if (e.which === 13) {
                const name = $('#editDialogInput').attr('option');
                const value = $('#editDialogInput').val();
                this.hideEditDialog();
                if (edit && value) {
                    const values = this.store.config.options[option];
                    const index = values.indexOf(edit.currentValue);
                    if (index > -1) {
                        values[index] = value;
                        this.updateOption({ name: option, value: values });
                    }
                }
                else if (value) {
                    const option = this.elementData.options.find((item) => {
                        return item.name === name;
                    });
                    this.addOptionValue({ option, value });
                }
            }
        });
        if (edit) {
            $('#editDialogInput').val(edit.currentValue);
        }
        $('#openButton').unbind();
        $('#openButton').click(() => {
            if (lookupAction) {
                this.hideEditDialog();
                lookupAction();
            }
        });
        $('#openButton').css('display', lookupAction ? 'block' : 'none');
        $('#editDialogInput').attr('option', option);
        $('.overlay-container').css('display', 'block');
        $('.monaco-inputbox').addClass('synthetic-focus');
        $('#editDialogInput').focus();
    }
    hideEditDialog() {
        $('#editDialogInput').removeAttr('option');
        $('.overlay-container').css('display', 'none');
        $('#editDialogInput').val('');
        $('#openButton').css('display', 'none');
    }
    createAddButton() {
        const addButton = document.createElement('a');
        addButton.classList.add('monaco-button', 'monaco-text-button', 'setting-exclude-addButton');
        addButton.setAttribute('role', 'button');
        addButton.style.color = 'rgb(255, 255, 255)';
        addButton.style.backgroundColor = 'rgb(14, 99, 156)';
        addButton.style.width = 'auto';
        addButton.style.padding = '2px 14px';
        addButton.textContent = 'Add';
        return addButton;
    }
    renderBooleanOption(option, config) {
        const container = document.createElement('div');
        container.style.paddingTop = '12px';
        container.classList.add('form-checkbox');
        this.form.append(container);
        const wrapper = document.createElement('label');
        wrapper.setAttribute('aria-live', 'polite');
        container.appendChild(wrapper);
        const input = document.createElement('input');
        input.id = option.name;
        input.type = 'checkbox';
        input.setAttribute('aria-describedby', 'help-text-for-checkbox');
        wrapper.appendChild(input);
        input.onclick = () => {
            this.updateOption({ name: option.name, value: input.checked });
        };
        const title = document.createElement('span');
        title.classList.add('code');
        title.textContent = `--${option.name}`;
        wrapper.appendChild(title);
        const note = document.createElement('p');
        note.classList.add('note');
        note.id = 'help-text-for-checkbox';
        note.textContent = option.description;
        wrapper.appendChild(note);
    }
    renderSingleOption(option, config) {
        const container = document.createElement('div');
        container.style.paddingTop = '12px';
        container.classList.add('form-checkbox');
        this.form.append(container);
        const wrapper = document.createElement('label');
        wrapper.setAttribute('aria-live', 'polite');
        container.appendChild(wrapper);
        const input = document.createElement('input');
        input.id = option.name;
        input.type = 'checkbox';
        wrapper.appendChild(input);
        const title = document.createElement('span');
        title.classList.add('code');
        title.textContent = `--${option.name}`;
        wrapper.appendChild(title);
        if (option.required) {
            if (option.name === 'name') {
                title.textContent = `${option.name}`;   
            }
            const required = document.createElement('span');
            required.classList.add('form-required');
            required.textContent = '*';
            wrapper.appendChild(required);
            input.checked = true;
            input.setAttribute('checked', 'checked');
            input.disabled = true;
        }
        const note = document.createElement('p');
        note.classList.add('note');
        note.textContent = option.description;
        wrapper.appendChild(note);
        const details = document.createElement('span');
        details.id = `${option.name}-details`;
        details.classList.add('text-normal');
        container.appendChild(details);
        input.onclick = () => {
            details.style.display = input.checked ? 'inherit' : 'none';
            this.updateOption({ name: option.name, value: undefined });
        };
        const group = document.createElement('dl');
        group.classList.add('form-group');
        group.style.marginTop = '10px';
        group.style.marginBottom = '10px';
        details.appendChild(group);
        const top = document.createElement('dd');
        group.appendChild(top);
        const widget = document.createElement('input');
        widget.id = `${option.name}-input`;
        widget.classList.add('form-control', 'form-input', 'input-sm');
        widget.style.backgroundColor = 'hsla(0, 0%, 50%, .17)';
        widget.style.border = '1px solid rgb(77, 78, 78)';
        widget.style.borderRadius = '0px';
        widget.style.verticalAlign = 'top';
        widget.onkeyup = () => {
            this.updateOption({ name: option.name, value: widget.value });
        };
        top.appendChild(widget);
        if (option.type === 'File') {
            const addButton = this.createAddButton();
            widget.style.maxHeight = '26px';
            widget.style.minHeight = '26px';
            addButton.style.margin = '5px 0px 0px 0px';
            addButton.onmouseup = e => {
                this.promptExternal(option);
            };
            top.appendChild(addButton);
        }
    }
    bindOptions(data, config) {
        data.options.forEach((element) => this.bindOption(element, config));
        if (!$(`#name-input`).is(":focus")) {
            $(`#name-input`).val(config.name);
        }
    }
    bindOption(option, config) {
        if (!option.required) {
            const value = this.store.config.options[option.name];
            const checked = (typeof value !== 'undefined') && ((Array.isArray(value) && value.length > 0) ||
                (typeof value === 'boolean' && value) ||
                (typeof value === 'string' && value !== ''));
            if (option.name === 'mavenize') {
            }
            if (!checked && $(`#${option.name}`).is(':checked') && option.type !== 'Boolean') {
                $(`#${option.name}-details`).show();
            }
            else if (!checked && !$(`#${option.name}`).is(':checked') && option.type !== 'Boolean') {
                $(`#${option.name}-details`).hide();
            }
            else if (checked && !$(`#${option.name}`).is(':checked') && option.type !== 'Boolean') {
                $(`#${option.name}`).prop('checked', checked);
                $(`#${option.name}-details`).show();
            }
            else {
                $(`#${option.name}`).prop('checked', checked);
            }
        }

        if (option['ui-type'].includes('select-many')) {
            $(`.${option.name}-custom`).remove();
            const values = config.options[option.name];
            const options = option['available-options'];
            if (options) {
                options.forEach((item) => {
                    $(`#${option.name}-${item}`).prop('checked', values && values.includes(item));
                });
            }
            if (values) {
                values.forEach((item) => {
                    if (!options || !options.includes(item)) {
                        $(`#${option.name}-table`).append(this.createTableRow(option, item, `${option.name}-custom`, config, true));
                        $(`#${option.name}-${item}`).prop('checked', true);
                    }
                });
            }
        }
        else if (option['ui-type'].includes('many')) {
            this.bindDynamicTable(option, config);
        }
        else {
            const value = config.options[option.name];
            if (!$(`#${option.name}-input`).is(":focus")) {
                $(`#${option.name}-input`).val(value);
            }
        }
    }

    bindDynamicTable(option, config) {
        $(`#${option.name}-table`).children().remove();
        const input = config.options[option.name];
        const table = $(`#${option.name}-table`);
        const placeholder = $(`#${option.name}-placeholder`);
        if (!input || input.length === 0) {
            placeholder.show();
        }
        else {
            placeholder.hide();
            input.forEach((item) => {
                const row = document.createElement('tr');
                const data = document.createElement('td');
                data.style.padding = '0px';
                const wrapper = document.createElement('div');
                wrapper.classList.add('table-row');
                wrapper.tabIndex = -1;
                const bar = document.createElement('div');
                bar.classList.add('action-bar');
                wrapper.append(bar);
                const container = document.createElement('ul');
                container.classList.add('actions-container');
                bar.append(container);
                const editItem = document.createElement('li');
                editItem.classList.add('action-item');
                container.append(editItem);
                const editAction = document.createElement('a');
                editAction.classList.add('action-label', 'edit-action');
                editAction.title = 'Edit Item';
                editItem.append(editAction);
                editAction.onclick = () => {
                    this.showEditDialog(option.name, undefined, { currentValue: item });
                };
                const deleteItem = document.createElement('li');
                deleteItem.classList.add('action-item');
                container.append(deleteItem);
                const deleteAction = document.createElement('a');
                deleteAction.classList.add('action-label', 'delete-action');
                deleteAction.title = 'Delete Item';
                deleteItem.append(deleteAction);
                deleteAction.onclick = () => {
                    this.deleteItem(option, item, config);
                };
                const col1 = document.createElement('div');
                col1.classList.add('row-text');
                col1.textContent = item;
                wrapper.append(col1);
                data.append(wrapper);
                row.append(data);
                table.append(row);
            });
        }
    }
    deleteItem(option, item, config) {
        const values = config.options[option.name];
        const index = values.indexOf(item);
        if (index > -1) {
            values.splice(index, 1);
            this.updateOption({ name: option.name, value: values });
        }
    }
    updateSelectManyOption(option, item, value, config) {
        let values = config.options[option.name];
        if (values) {
            if (!value && values.includes(item)) {
                values.splice(values.indexOf(item), 1);
                this.updateOption({ name: option.name, value: values });
            }
            else if (value && !values.includes(item)) {
                values.push(item);
                this.updateOption({ name: option.name, value: values });
            }
        }
        else {
            values = [item];
            config.options[option.name] = values;
            this.updateOption({ name: option.name, value: values });
        }
    }
    updateName(name) {
        this._socket.emitToHost('updateName', name);
    }
    updateJvm(jvm) {
        this._socket.emitToHost('updateJvm', jvm);
    }
    updateCli(cli) {
        this._socket.emitToHost('updateCli', cli);
    }
    addOptionValue(data) {
        this._socket.emitToHost('addOptionValue', data);
    }
    updateOption(option) {
        this._socket.emitToHost('updateOption', option);
    }
    promptWorkspaceFileOrFolder(option) {
        this._socket.emitToHost('promptWorkspaceFileOrFolder', option);
    }
    promptWorkspaceFolder(option) {
        this._socket.emitToHost('promptWorkspaceFolder', option);
    }
    promptExternal(option) {
        this._socket.emitToHost('promptExternal', option);
    }
    openReport() {
        this._socket.emitToHost('openReport');
    }
    cloneRepo(repo) {
        this._socket.emitToHost('cloneRepo', repo);
    }
    downloadInstall(install) {
        this._socket.emitToHost('downloadInstall', install);
    }
    run() {
        this._socket.emitToHost('startAnalysis', { id: this.store.id });
    }
    cancel() {
        this._socket.emitToHost('cancelAnalysis', { id: this.store.id });
    }
}
exports.ConfigClient = ConfigClient;
//# sourceMappingURL=configurationFrontendClient.js.map