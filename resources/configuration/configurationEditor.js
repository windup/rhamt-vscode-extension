window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'bind': {
            config = message.config;
            elementData = message.elementData;
            init();
            break;
        }
        case 'updateOption': {
            refreshOption(message)
            break;
        }
        case 'showRecentRulesets': {
            showRecentDialog(message.rulesets, message.option)
            break;
        }
    }
    
});

function refreshOption(message) {
    config.options = message.options;
    data = message.option;
    const option = elementData.options.find((item) => {
        return item.name === data.name;
    });
    bindOption(option, config);
}

function init() {
    renderOptions(elementData, config);
    bindOptions(elementData, config);
}

function renderOptions(elementData, config) {
    for (const option of elementData.options) {
        if (option.type === 'Boolean') {
            renderBooleanOption(option, config);
        }
        else if (option['ui-type'].includes('many') || option['ui-type'].includes('select-many')) {
            renderManyOption(option, config);
        }
        else {
            renderSingleOption(option, config);
        }
    }
}

function renderManyOption(option, config) {
    const container = document.createElement('div');
    container.style.paddingTop = '12px';
    container.classList.add('form-checkbox');
    document.getElementById('elementForm').append(container);
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
    // note.textContent = option.description;
    note.innerHTML = option.description;
    wrapper.appendChild(note);
    const details = document.createElement('span');
    details.id = `${option.name}-details`;
    details.classList.add('text-normal');
    container.appendChild(details);
    input.onclick = () => {
        details.style.display = input.checked ? 'inherit' : 'none';
        updateOption({ name: option.name, value: [] });
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
            table.appendChild(createTableRow(option, item, 'built-in', config, true));
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
    const addButton = createAddButton();
    toolbar.appendChild(addButton);
    bindAddButton(option, addButton);
    
    if (option['ui-type'].includes('recent')) {
        const recentButton = createRecentButton();
        recentButton.style.marginLeft = '5px';
        toolbar.appendChild(recentButton);
        recentButton.onclick = () => {
            showRecentRulesets(option);
        };
    }
}

function createRecentButton() {
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

function showRecentDialog(data, option) {
    populateRecentTable(option, config, data);
    $('.recent-container').css('display', 'block');
}

function updateRulesetsOption() {
    const option = 'userRulesDirectory';
    let values = config.options[option] || [];
    $(`#recent-table .option-input:checkbox:checked`).each((index, value) => {
        values.push($(value).data('option-item'));
    });
    updateOption({ name: option, value: values });
}

function populateRecentTable(option, config, recent) {
    const values = config.options[option.name];
    $('#recent-table').children().remove();
    let empty = true;
    if (recent) {
        recent.forEach((item) => {
            if (!values || !values.includes(item)) {
                empty = false;
                $(`#recent-table`).append(createTableRow(option, item, `recent-${option.name}-custom`, config, false));
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

function hideRecentDialog() {
    $('.recent-container').css('display', 'none');
}

function createTableRow(option, item, group, config, bind) {
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
            updateSelectManyOption(option, item, input.checked, config);
        };
    }
    const content = document.createElement('div');
    content.classList.add('option-content');
    wrapper.appendChild(content);

    const newFeatures = option['new-features'];
    const title = document.createElement('span');

    title.textContent = item;

    /*if (newFeatures && newFeatures.includes(item)) {
        title.innerHTML = item + '<span class="newFeatureTag"> new</span>';
    }
    else {
        title.textContent = item;
    }*/
    
    content.appendChild(title);

    return row;
}

function bindAddButton(option, button) {
    if (option['ui-type'].includes('java-package') || option['ui-type'].includes('select-many')) {
        button.onclick = () => {
            showEditDialog(option.name, undefined);
        };
    }
    else {
        button.onclick = () => {
            showEditDialog(option.name, () => promptExternal(option));
        };
    }
}

function showEditDialog(option, lookupAction, edit) {
    $('#editDialogInput').unbind();
    $('#editDialogInput').keypress(e => {
        if (e.which === 13) {
            const name = $('#editDialogInput').attr('option');
            const value = $('#editDialogInput').val();
            hideEditDialog();
            if (edit && value) {
                const values = config.options[option];
                const index = values.indexOf(edit.currentValue);
                if (index > -1) {
                    values[index] = value;
                    updateOption({ name: option, value: values });
                }
            }
            else if (value) {
                const option = elementData.options.find((item) => {
                    return item.name === name;
                });
                addOptionValue({ option, value });
            }
        }
    });
    if (edit) {
        $('#editDialogInput').val(edit.currentValue);
    }
    $('#openButton').unbind();
    $('#openButton').click(() => {
        if (lookupAction) {
            hideEditDialog();
            lookupAction();
        }
    });
    $('#openButton').css('display', lookupAction ? 'block' : 'none');
    $('#editDialogInput').attr('option', option);
    $('.overlay-container').css('display', 'block');
    $('.monaco-inputbox').addClass('synthetic-focus');
    $('#editDialogInput').focus();
}

function hideEditDialog() {
    $('#editDialogInput').removeAttr('option');
    $('.overlay-container').css('display', 'none');
    $('#editDialogInput').val('');
    $('#openButton').css('display', 'none');
}

function createAddButton() {
    const addButton = document.createElement('a');
    addButton.classList.add('monaco-button', 'monaco-text-button', 'setting-exclude-addButton');
    addButton.setAttribute('role', 'button');
    addButton.style.color = 'rgb(255, 255, 255)';
    addButton.style.backgroundColor = 'rgb(14, 99, 156)';
    addButton.style.width = 'auto';
    addButton.style.padding = '2px 14px';
    addButton.textContent = 'Add';
    addButton.style.textDecoration = 'none';
    return addButton;
}

function renderBooleanOption(option, config) {
    const container = document.createElement('div');
    container.style.paddingTop = '12px';
    container.classList.add('form-checkbox');
    document.getElementById('elementForm').append(container);
    const wrapper = document.createElement('label');
    wrapper.setAttribute('aria-live', 'polite');
    container.appendChild(wrapper);
    const input = document.createElement('input');
    input.id = option.name;
    input.type = 'checkbox';
    input.setAttribute('aria-describedby', 'help-text-for-checkbox');
    wrapper.appendChild(input);
    input.onclick = () => {
        updateOption({ name: option.name, value: input.checked });
    };
    const title = document.createElement('span');
    title.classList.add('code');
    title.textContent = `--${option.name}`;
    wrapper.appendChild(title);
    const note = document.createElement('p');
    note.classList.add('note');
    note.id = 'help-text-for-checkbox';
    note.textContent = option.description;

    if (option.hasOwnProperty('editable') && !option.editable) {
        input.checked = true;
        input.setAttribute('checked', 'checked');
        input.disabled = true;
    }

    wrapper.appendChild(note);
}

function renderSingleOption(option, config) {
    const container = document.createElement('div');
    container.style.paddingTop = '12px';
    container.classList.add('form-checkbox');
    document.getElementById('elementForm').append(container);
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
        updateOption({ name: option.name, value: undefined });
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
    // widget.classList.add('form-control', 'form-input', 'input-sm');
    // widget.classList.add('input');
    // widget.style.outlineColor = 'rgba(14, 99, 156, 0.6)';
    // font-size: 15px;
    // line-height: 1.3;


// border-color: var(--vscode-input-border);
//     border: 1px solid var(--vscode-input-border);

    widget.classList.add('new-input');

    widget.style.backgroundColor = 'inherit;'
    widget.style.width = "100%";


    // widget.style.backgroundColor = 'hsla(0, 0%, 50%, .17)';
    // widget.style.border = '1px solid rgb(77, 78, 78)';
    // widget.style.borderRadius = '0px';
    widget.style.verticalAlign = 'top';
    let previous = undefined;
    widget.onkeyup = () => {
        const newValue = widget.value;
        // if user previously cleared the name, and it's still emtpy, ignore
        if (previous != undefined && previous === '' && newValue === '') {
            return;
        }
        // if user previously cleared the name, strip leading whitesapce, ensure not empty
        if (previous != undefined && previous === '') {
            if (newValue.trimStart().length === 0) {
                // user entered empty space, and that's it
                return;
            }
        }
        previous = newValue;
        updateOption({ name: option.name, value: newValue });
    };
    top.appendChild(widget);
    if (option.type === 'File') {
        const addButton = createAddButton();
        // widget.style.minHeight = '27px';
        addButton.style.margin = '10px 0px 0px 0px';
        addButton.onmouseup = e => {
            promptExternal(option);
        };
        top.appendChild(addButton);
    }
}

function bindOptions(data, config) {
    data.options.forEach((element) => bindOption(element, config));
    if (!$(`#name-input`).is(":focus")) {
        $(`#name-input`).val(config.name);
    }
}

function bindOption(option, config) {
    if (!option.required) {
        const value = config.options[option.name];
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
                    $(`#${option.name}-table`).append(createTableRow(option, item, `${option.name}-custom`, config, true));
                    $(`#${option.name}-${item}`).prop('checked', true);
                }
            });
        }
    }
    else if (option['ui-type'].includes('many')) {
        bindDynamicTable(option, config);
    }
    else {
        const value = config.options[option.name];
        if (!$(`#${option.name}-input`).is(":focus")) {
            $(`#${option.name}-input`).val(value);
        }
    }
}

function bindDynamicTable(option, config) {
    $(`#${option.name}-table`).children().remove();
    const input = config.options[option.name];
    const table = $(`#${option.name}-table`);
    const placeholder = $(`#${option.name}-placeholder`);
    if (!input || input.length === 0) {
        $(`#${option.name}-table`).siblings().last().css('display', 'initial');
        placeholder.show();
    }
    else {
        placeholder.hide();

        if (input.length === 1) {
            $(`#${option.name}-table`).siblings().last().css('display', 'none');
        }

        input.every((item) => {
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
                showEditDialog(option.name, undefined, { currentValue: item });
            };

            const deleteItem = document.createElement('li');
            deleteItem.classList.add('action-item');
            container.append(deleteItem);
            const deleteAction = document.createElement('a');
            deleteAction.classList.add('action-label', 'delete-action');
            deleteAction.title = 'Delete Item';
            deleteItem.append(deleteAction);
            deleteAction.onclick = () => {
                doDeleteItem(option, item, config);
            };

            const cloning = config.options['cloning'];
            if (cloning && cloning.includes(item)) {
                const cloningItem = document.createElement('li');
                cloningItem.classList.add('action-item', 'cloning-item');
                container.append(cloningItem);
                const cloningAction = document.createElement('span');
                cloningAction.classList.add('action-label', 'cloning-action', 'sr-only');
                cloningItem.append(cloningAction);
            }

            const col1 = document.createElement('div');
            col1.classList.add('row-text');
            col1.textContent = item;
            wrapper.append(col1);
            data.append(wrapper);
            row.append(data);
            table.append(row);

            if (option.name === 'input') {
                return false;
            }
            return true;
        });
    }
}

function doDeleteItem(option, item, config) {
    const values = config.options[option.name];
    const index = values.indexOf(item);
    if (index > -1) {
        values.splice(index, 1);
        updateOption({ name: option.name, value: values });
    }
}

function updateSelectManyOption(option, item, value, config) {
    let values = config.options[option.name];
    if (values) {
        if (!value && values.includes(item)) {
            values.splice(values.indexOf(item), 1);
            updateOption({ name: option.name, value: values });
        }
        else if (value && !values.includes(item)) {
            values.push(item);
            updateOption({ name: option.name, value: values });
        }
    }
    else {
        values = [item];
        config.options[option.name] = values;
        updateOption({ name: option.name, value: values });
    }
}

function deleteItem(option, item, config) {
    const values = config.options[option.name];
    const index = values.indexOf(item);
    if (index > -1) {
        values.splice(index, 1);
        this.updateOption({ name: option.name, value: values });
    }
}

function showRecentRulesets(option) {
    vscode.postMessage({
        command: 'showRecentRulesets',
        option
    });
}

function promptExternal(option) {
    vscode.postMessage({
        command: 'promptExternal',
        option
    });
}

function updateOption(option) {
    vscode.postMessage({
        command: 'updateOption',
        option
    });
}

function addOptionValue(option) {
    vscode.postMessage({
        command: 'addOptionValue',
        option
    });
}

vscode.postMessage({
    command: 'ready'
});
