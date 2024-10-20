import { LightningElement, api } from 'lwc';

export default class FieldFilter extends LightningElement {

    @api filterIndex; // for easy deletion
    /*
        fieldData: [
            { name: "accountName", label: "Account Name", type: "text"},
            { name: "SIC__c", label:"SIC Code", type: "text"}
        ]
    */
    @api fieldData;
    @api fieldSelection;
    // @api draftFieldSeletion;
    @api operatorSelection;
    // @api draftOperationSelection;
    @api filterValue;
    // @api draftFilterValue;

    showEditPopover = false;
    operatorOptions = [];

    outsideClick;

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
                value: option.value
            }
        })
    }

    set fieldSelection(newValue) {
        let currentFieldData = this.fieldData.find(data => data.name === this.fieldSelection?.name);
        this.operatorOptions = this.getOperatorOptions(this.convertType(currentFieldData.type));
    }

    connectedCallback() {
        document.addEventListener('click', this.outsideClick = this.closeTooltip.bind(this));
        if (!this.fieldSelection) {
            this.fieldSelection = { label: 'Account Name', value: 'accountName', type: 'text'};
            this.operatorSelection = this.operatorOptions.EQUALS;
            this.filterValue = 'test';
        }
    }

    deleteThis() {
        this.dispatchEvent(new CustomEvent("deleteFilter", { detail: this.filterIndex }));
    }

    selectThis() {
        this.showEditPopover = true;
        console.log('Filter selected!');
    }

    closeTooltip() {
        this.showEditPopover = false;
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
                    { label: 'equals',           value: this.operators.EQUALS },
                    { label: 'not equal to',     value: this.operators.NOT_EQUAL_TO },
                    { label: 'less than',        value: this.operators.LESS_THAN },
                    { label: 'greater than',     value: this.operators.GREATER_THAN },
                    { label: 'less or equal',    value: this.operators.LESS_OR_EQUAL },
                    { label: 'greater or equal', value: this.operators.GREATER_OR_EQUAL },
                    { label: 'contains',         value: this.operators.CONTAINS },
                    { label: 'does not contain', value: this.operators.DOES_NOT_CONTAIN },
                    { label: 'starts with',      value: this.operators.STARTS_WITH },
                ];
            case 'date': case 'datetime': case 'time': case 'number':
                return [
                    { label: 'equals',           value: this.operators.EQUALS },
                    { label: 'not equal to',     value: this.operators.NOT_EQUAL_TO },
                    { label: 'less than',        value: this.operators.LESS_THAN },
                    { label: 'greater than',     value: this.operators.GREATER_THAN },
                    { label: 'less or equal',    value: this.operators.LESS_OR_EQUAL },
                    { label: 'greater or equal', value: this.operators.GREATER_OR_EQUAL }
                ];
            case 'checkbox': case 'checkbox-button': case 'toggle': 
                return [
                    { label: 'equals',           value: this.operators.EQUALS },
                    { label: 'not equal to',     value: this.operators.NOT_EQUAL_TO }
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
}