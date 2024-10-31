import { LightningElement, api } from 'lwc';

export default class FieldFilter extends LightningElement {

    @api filterIndex; // for easy communication with parent
    /*
        fieldData: [
            { name: "accountName", label: "Account Name", type: "text"},
            { name: "SIC__c", label:"SIC Code", type: "text"}
        ]
    */
    @api fieldData;
    @api fieldSelection;
    @api draftFieldSelection;
    @api operatorSelection;
    @api draftOperatorSelection;
    @api filterValue;
    @api draftFilterValue;

    popoverFieldSelection;
    popoverOperatorSelection;
    popoverFilterValue

    _showEditPopover = false;
    set showEditPopover(newValue) {
        if (newValue === true && this._showEditPopover === false) {
            this.popoverFieldSelection = this.displayedFieldSelection || this.fieldOptions[0] || {};
            this.popoverOperatorSelection = this.displayedOperatorSelection || this.operatorOptions[0] || {};
            this.popoverFilterValue = this.displayedFilterValue || '';
            console.log(`Showing popover! Field: ${JSON.stringify(this.popoverFieldSelection)}; Operator: ${JSON.stringify(this.popoverOperatorSelection)}; Value: ${JSON.stringify(this.popoverFilterValue)}`);
        }
        this._showEditPopover = newValue;
    }
    get showEditPopover() { return this._showEditPopover; }
    // operatorOptions;

    outsideClick;

    get dataId() {
        return `custom-filter-${this.filterIndex}`;
    }
    get currentFieldData() {
        let currentFieldData = this.fieldData.find(data => data.name === this.fieldSelection?.name);
        if (!currentFieldData) {
            return {};
        }
        return currentFieldData;
    }
    get fieldOptions() {
        return this.fieldData.map(option => {
            return {
                label: option.label,
                value: option.name
            }
        });
    }

    _fieldSelection;
    set fieldSelection(newValue) {
        // this.setup();
        this._fieldSelection = newValue;
        this.draftFieldSelection = newValue;
        this.checkHasBeenEdited();
    }
    get fieldSelection() { return this._fieldSelection; }

    _operatorSelection;
    set operatorSelection(newValue) {
        // this.setup();
        this._operatorSelection = newValue;
        this.draftOperatorSelection = newValue;
        this.checkHasBeenEdited();
    }
    get operatorSelection() { return this._operatorSelection; }

    _filterValue;
    set filterValue(newValue) {
        // this.setup();
        this._filterValue = newValue;
        this.draftFilterValue = newValue;
        this.checkHasBeenEdited();
    }
    get filterValue() { return this._filterValue; }

    // _fieldData;
    // set fieldData(newValue) {
    //     this.setup();
    //     this._fieldData = newValue;
    // } 
    // get fieldData() { return this._fieldData; }

    get displayedFieldSelection() {
        return this.draftFieldSelection || this.fieldSelection || {};
    }

    get displayedOperatorSelection() {
        return this.draftOperatorSelection || this.operatorSelection || this.operatorOptions[0] || {};
    }
    get displayedFilterValue() {
        console.log('Getting displayed filter value!\nDraft: ' + JSON.stringify(this.draftFilterValue) + ';\nSaved: ' + JSON.stringify(this.filterValue));
        return this.draftFilterValue || this.filterValue || '';
    }
    get operatorOptions() {
        console.groupCollapsed('operatorOptions');
        let options;
        if (this.fieldSelection && this.fieldData) {
            console.log('fieldSelection: ' + JSON.stringify(this.fieldSelection));
            console.log('fieldData: ' + JSON.stringify(this.fieldData));
            let currentFieldData = this.fieldData.find(data => data.name === this.fieldSelection?.value);
            options = this.getOperatorOptions(this.convertType(currentFieldData.type));
        } else {
            options = this.getOperatorOptions('text');
        }
        console.log('Evaluating operator options: ' + JSON.stringify(options));
        console.groupEnd();
        return options;
    }
    get hasPendingChanges() {
        console.log(`Testing pending changes:\nFieldSelection: ${this.draftFieldSelection && this.fieldSelection?.value !== this.draftFieldSelection.value}\nOperatorSelection: ${this.draftOperatorSelection && this.operatorSelection?.value !== this.draftOperatorSelection.value}\nFilterValue: ${this.draftFilterValue && this.filterValue !== this.draftFilterValue}`);
        return (this.draftFieldSelection && this.fieldSelection?.value !== this.draftFieldSelection.value) ||
            (this.draftOperatorSelection && this.operatorSelection?.value !== this.draftOperatorSelection.value) ||
            (this.draftFilterValue && this.filterValue !== this.draftFilterValue);
    }

    connectedCallback() {
        // document.addEventListener('click', this.outsideClick = this.closeTooltip.bind(this));
        console.log('Selected field: ' + JSON.stringify(this.fieldSelection));
        console.log('Selected operator: ' + JSON.stringify(this.operatorSelection));
        // this.operatorOptions = this.getOperatorOptions(this.convertType('text'));
        // this.popoverFieldSelection = this.fieldSelection;
        // this.popoverOperatorSelection = this.operatorSelection;
        // this.popoverFilterValue = this.filterValue;
    }

    // setup() {
    //     if (this.fieldData && this.fieldSelection) {
    //         let currentFieldData = this.fieldData.find(data => data.name === this.fieldSelection?.value);
    //         this.operatorOptions = this.getOperatorOptions(this.convertType(currentFieldData.type));
    //     }
    // }

    handlePopoverFieldChanged(event) {
        console.log('handlePopoverFieldChanged! ' + JSON.stringify(event));
        this.popoverFieldSelection = this.fieldOptions.find(option => option.value === event.detail.value);
        console.log('field changed: ' + JSON.stringify(this.popoverFieldSelection));
    }
    handlePopoverOperatorChanged(event) {
        console.log('handlePopoverOperatorChanged! ' + JSON.stringify(event));
        this.popoverOperatorSelection = this.operatorOptions.find(option => option.value === event.detail.value);
        console.log('operator changed: ' + JSON.stringify(this.popoverOperatorSelection));
    }
    handlePopoverValueChanged(event) {
        console.log('handlePopoverValueChanged! ' + JSON.stringify(event));
        this.popoverFilterValue = event.detail.value;
        console.log('filter value changed: ' + JSON.stringify(this.popoverFilterValue));
    }

    deleteThis() {
        this.dispatchEvent(new CustomEvent("deletefilter", { detail: this.filterIndex }));
    }

    selectThis() {
        this.showEditPopover = true;
        console.log('Filter selected!');
    }

    @api
    getParams() {
        this.debug('in getParams');
        return {
            field: this.draftFieldSelection || this.fieldSelection,
            operator: this.operatorOptions.find(option => option.value === (this.draftOperatorSelection || this.operatorSelection).value),
            value: this.draftFilterValue || this.filterValue,
            index: this.filterIndex
        };
    }

    @api
    cancel() {
        this.draftFieldSelection = undefined;
        this.draftOperatorSelection = undefined;
        this.draftFilterValue = undefined;
        this.popoverFieldSelection = this.fieldSelection;
        this.popoverOperatorSelection = this.operatorSelection;
        this.popoverFilterValue = this.filterValue;
        this.showEditPopover = false;
    }

    popoverDoneClicked() {
        this.debug('PopoverDoneClicked', 'start');
        this.showEditPopover = false;
        this.draftFieldSelection = this.popoverFieldSelection;
        this.draftOperatorSelection = this.popoverOperatorSelection;
        this.draftFilterValue = this.popoverFilterValue;
        this.checkHasBeenEdited();
        this.debug('PopoverDoneClicked', 'end');
    }

    checkHasBeenEdited() {
        let filterElement = this.template.querySelector(`[data-id="${this.dataId}"]`);
        if (!filterElement) { return; }
        if (this.hasPendingChanges) {
            this.debug('Check has been edited - YES!')
            filterElement.classList.add('hasBeenEdited');
        } else {
            this.debug('Check has been edited - NO!')
            filterElement.classList.remove('hasBeenEdited');
        }

    }

    // Needs a special case for picklist, it seems
    convertType(dataType) {
        switch (dataType.toLowerCase()) {
            case 'boolean':
                return 'checkbox';
            case 'email':
                return 'email';
            case 'phone':
                return 'tel';

            default:
                return 'text';
        }
    }

    get operators() {
        return {
            EQUALS: 'equals',
            NOT_EQUAL_TO: 'not_equal_to',
            LESS_THAN: 'less_than',
            GREATER_THAN: 'greater_than',
            LESS_OR_EQUAL: 'less_or_equal',
            GREATER_OR_EQUAL: 'greater_or_equal',
            CONTAINS: 'contains',
            DOES_NOT_CONTAIN: 'does_not_contain',
            STARTS_WITH: 'starts_with',
        }
    }
    getOperatorOptions(type) {
        switch (type.toLowerCase()) {
            case 'text': case 'email': case 'tel': case 'url':
                return [
                    { label: 'equals', value: this.operators.EQUALS, apply: this.equals },
                    { label: 'not equal to', value: this.operators.NOT_EQUAL_TO, apply: this.notEqualTo },
                    { label: 'less than', value: this.operators.LESS_THAN, apply: this.lessThan },
                    { label: 'greater than', value: this.operators.GREATER_THAN, apply: this.greaterThan },
                    { label: 'less or equal', value: this.operators.LESS_OR_EQUAL, apply: this.lessOrEqual },
                    { label: 'greater or equal', value: this.operators.GREATER_OR_EQUAL, apply: this.greaterOrEqual },
                    { label: 'contains', value: this.operators.CONTAINS, apply: this.contains },
                    { label: 'does not contain', value: this.operators.DOES_NOT_CONTAIN, apply: this.doesNotContain },
                    { label: 'starts with', value: this.operators.STARTS_WITH, apply: this.startsWith },
                ];
            case 'date': case 'datetime': case 'time': case 'number':
                return [
                    { label: 'equals', value: this.operators.EQUALS, apply: this.equals },
                    { label: 'not equal to', value: this.operators.NOT_EQUAL_TO, apply: this.notEqualTo },
                    { label: 'less than', value: this.operators.LESS_THAN, apply: this.lessThan },
                    { label: 'greater than', value: this.operators.GREATER_THAN, apply: this.greaterThan },
                    { label: 'less or equal', value: this.operators.LESS_OR_EQUAL, apply: this.lessOrEqual },
                    { label: 'greater or equal', value: this.operators.GREATER_OR_EQUAL, apply: this.greaterOrEqual },
                ];
            case 'checkbox': case 'checkbox-button': case 'toggle':
                return [
                    { label: 'equals', value: this.operators.EQUALS, apply: this.equals },
                    { label: 'not equal to', value: this.operators.NOT_EQUAL_TO, apply: this.notEqualTo }
                ];

            // I honestly just don't want to deal with these right now
            case 'color':
                throw new Error('Colors are not supported at this time');
            case 'file':
                throw new Error('Files are not supported at this time');
            case 'password':
                throw new Error('Passwords are not supported at this time');
            case 'search':
                throw new Error('Searches are not supported at this time');
            case 'toggle':
                throw new Error('Toggles are not supported at this time');
            case 'range':
                throw new Error('Ranges are not supported at this time');

            default:
                return [];
        }
    }

    equals(data, filterValue) {
        return data == filterValue;
    }
    notEqualTo(data, filterValue) {
        return data != filterValue;
    }
    lessThan(data, filterValue) {
        let dataType = typeof data;
        let filterType = typeof filterValue;
        if (dataType !== filterType) {
            return false;
        }
        if (dataType === 'string') {
            return dataType.localeCompare(filterValue) < 0;
        }
        return false;
    }
    greaterThan(data, filterValue) {
        let dataType = typeof data;
        let filterType = typeof filterValue;
        if (dataType !== filterType) {
            return false;
        }
        if (dataType === 'string') {
            return dataType.localeCompare(filterValue) > 0;
        }
        return false;
    }
    lessOrEqual(data, filterValue) {
        let dataType = typeof data;
        let filterType = typeof filterValue;
        if (dataType !== filterType) {
            return false;
        }
        if (dataType === 'string') {
            return dataType.localeCompare(filterValue) <= 0;
        }
        return false;
    }
    greaterOrEqual(data, filterValue) {
        let dataType = typeof data;
        let filterType = typeof filterValue;
        if (dataType !== filterType) {
            return false;
        }
        if (dataType === 'string') {
            return dataType.localeCompare(filterValue) >= 0;
        }
        return false;
    }
    contains(data, filterValue) {
        if (!data) {
            return !filterValue;
        }
        let d = typeof data === 'string' ? data : JSON.stringify(data);
        let f = typeof filterValue === 'string' ? filterValue : JSON.stringify(filterValue);
        return d.toLowerCase().includes(f.toLowerCase());
    }
    doesNotContain(data, filterValue) {
        return !this.contains(data, filterValue);
    }
    startsWith(data, filterValue) {
        if (!data) {
            return !filterValue;
        }
        let d = typeof data === 'string' ? data : JSON.stringify(data);
        let f = typeof filterValue === 'string' ? filterValue : JSON.stringify(filterValue);
        return d.toLowerCase().startsWith(f.toLowerCase());
    }

    debug(message) {
        message = message || 'Debugging filter params!';
        console.groupCollapsed(message);
        let table =
            `actual: {
    field: ${JSON.stringify(this.fieldSelection)},
    operator: ${JSON.stringify(this.operatorSelection)},
    value: ${(this.filterValue)},
},
draft: {
    field: ${JSON.stringify(this.draftFieldSelection)},
    operator: ${JSON.stringify(this.draftOperatorSelection)},
    value: ${(this.draftFilterValue)},
},
popover: {
    field: ${JSON.stringify(this.popoverFieldSelection)},
    operator: ${JSON.stringify(this.popoverOperatorSelection)},
    value: ${(this.popoverFilterValue)},
}`;
        console.log(table);
        console.groupEnd();
    }
}