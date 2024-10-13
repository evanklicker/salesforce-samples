import { wire, LightningElement } from 'lwc';
import generateData from './generateData';
import { TableData } from './customListViewHelper';
import DualListBoxModal from 'c/dualListBoxModal';
import getTableData from '@salesforce/apex/CustomListViewController.getTableData';
import getUserData from '@salesforce/apex/CustomListViewController.getUserData';
import saveUserData from '@salesforce/apex/CustomListViewController.saveUserData';

const columns = [
    { label: 'Label', fieldName: 'name', editable: true },
    {
        label: 'Name', fieldName: 'url', type: 'url', typeAttributes: {
            label: { fieldName: 'name' }
        }
    },
    { label: 'Website', fieldName: 'website', type: 'url', editable: true },
    { label: 'Phone', fieldName: 'phone', type: 'phone', editable: true },
    { label: 'CloseAt', fieldName: 'closeAt', type: 'date', editable: true },
    { label: 'Balance', fieldName: 'amount', type: 'currency', editable: true },
];

/*
    Because this code is so tightly coupled with salesforce and the lightning framework, it's difficult to isolate into unit tests. As such, all the logic 
    should be put in the helper file, and this file should be mostly kept to variable assignments and callouts to that file.
*/

let SELECT_COLUMNS_MODAL_LABEL = 'Select Fields to Display';
let SELECT_COLUMNS_MODAL_SOURCE_LABEL = 'Available Fields';
let SELECT_COLUMNS_MODAL_SELECTED_LABEL = 'Visible Fields';

export default class DatatableWithInlineEdit extends LightningElement {
    columns = columns;
    displayedColumns = [];
    draftValues = [];
    pageSize = 20;
    pages;
    currentPage = 1;
    isLoading = true;
    selectedRows = new Set();
    tableData = new TableData();

    searchTimeout;
    searchTerm;
    // can be tuned to user preferences. Power users may want this lower, but I probably wouldn't go lower than 1 sec or higher than 2 sec
    SEARCH_TIMEOUT_DURATION = 1000;

    get pageLeftDisabled() {
        return this.currentPage === 1;
    }
    get pageRightDisabled() {
        return this.currentPage === this.tableData.pages;
    }
    get pageText() {
        return `Page ${this.currentPage} of ${this.tableData.pages}`;
    }
    get displayedData() {
        if (!this.tableData) { return []; }
        return [...this.tableData.getPageData(this.currentPage)];
    }
    get displayedSelectedRows() {
        // let displayedData = new Set(this.displayedData.map(row => row.id));
        // return [...displayedData.intersection(this.selectedRows)];
        return [];
    }
    get selectedRowsText() {
        if (this.selectedRows.size === 1) {
            return `1 item selected`;
        }
        return `${this.selectedRows.size} items selected`;
    }
    connectedCallback() {
    }

    @wire(getTableData)
    handleGetTableData({ data, error }) {
        if (error) {
            this.error = error;
            console.error(error);
        } else if (data) {
            if (!data.fields) { throw new Error('No column defs found!'); }
            if (!data.records) { throw new Error('No records found!'); }
            this.datatableTitle = `Accounts (${data.records.length})`;
            this.columns = this.createColumnDefs(data.fields);
            // This will need to be changed when User Preferences get incorporated
            this.displayedColumns = this.columns;
            this.data = this.prepareTableData(data.records);
            this.tableData = this.buildTableData({ data: this.data, pageSize: this.pageSize });
            this.pages = this.tableData.pages;
            this.error = null;
            this.isLoading = false;
        }
    }
    @wire(getUserData)
    handleGetUserData({ data, error }) {
        if (error) {
            this.error = error;
            console.error(error);
        } else if (data) {
            console.log(data);
            this.userData = data;
            this.error = null;
        }
    }

    createColumnDefs(rawFieldInfos) {
        return rawFieldInfos.map(field => {
            // Remove the Name field since it's incorporated into the Id field def
            if (field.name.endsWith('Name')) { return; }
            let column;
            if (field.name.endsWith('Id')) {
                column = this.setupIdColumn(field);
            } else {
                column = this.setupNormalColumn(field);
            }
            console.log(JSON.stringify(column));
            return column;
        }).filter(column => !!column);
    }

    setupIdColumn(fieldInfo) {
        let fieldNameBase = (fieldInfo.relationshipName || '') + fieldInfo.name.slice(0, fieldInfo.name.length - 2);
        return {
            // I think we're eventually gonna need to override every field proivded by the base implementation..
            ...this.setupNormalColumn(fieldInfo),
            // We will probably need to add something like, `relationshipLabel` or something like that, 'cuz I don't think we
            // can generate a nice user-facing column label with what we currently have
            label: `${fieldInfo.relationshipName || ''} ${fieldInfo.name.endsWith('Id') ? (fieldNameBase + 'Name') : fieldInfo.label}`,
            fieldName: `${fieldNameBase}Url`,
            typeAttributes: {
                label: {fieldName: `${fieldInfo.relationshipName || ''}Name` }
            },
            iconName: fieldInfo.iconName || 'standard:' + fieldInfo.sObjectType.toLowerCase()
        }
    }
    
    setupNormalColumn(fieldInfo) {
        return {
            // Don't use Id fields as labels - use them for urls instead
            label: (fieldInfo.relationshipName || '') + fieldInfo.label,
            type: this.convertType(fieldInfo.type.toLowerCase()),
            fieldName: (fieldInfo.relationshipName || '') + fieldInfo.name,
            editable: fieldInfo.isUpdateable,
            sortable: !!fieldInfo.sortable
        }
    }

    convertType(type) {
        switch (type) {
            case 'boolean': case 'currency':
                return type;
            case 'picklist': case 'string': case 'textarea': case 'phone': case 'address':
                return 'text';
            case 'int': case 'double':
                return 'number';
            case 'reference': case 'url': case 'id':
                return 'url';
            case 'date': 
                return 'date';
            case 'datetime':
                // The formatting for this is non-existant, so we'll need to figure something out here
                return 'date';
            default:
                return 'text';
        }
    }

    prepareTableData(records) {
        let result = records.map(record => {
            return this.flattenObject(record);
        });
        // Setup the url fields to make sobject links work
        result.forEach(record => {
            for (let prop in record) {
                if (prop.endsWith('Id')) {
                    record[`${prop.slice(0, prop.length-2)}Url`] = `/${record[prop]}`;
                }
            }
        });
        return result;
    }

    flattenObject(obj, delimiter = '', prefix = '') {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? `${prefix}${delimiter}` : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && Object.keys(obj[k]).length > 0) {
                Object.assign(acc, this.flattenObject(obj[k], delimiter, pre + k));
            }
            else acc[pre + k] = obj[k];
            return acc;
        }, {});
    }

    buildTableData({ data, pageSize, filters, searchCriterion, sortOrder, sortField }) {
        return new TableData(data || this.data, pageSize || this.tableData.pageSize, filters, searchCriterion || this.searchTerm, sortOrder, sortField);
    }

    async handleMenuSelect(event) {
        const selectedItemValue = event.detail.value;
        switch (selectedItemValue) {
            case 'selectFields':
                let result = await DualListBoxModal.open({
                    options: this.columns.map(column => { return { label: column.label, value: column.label }; }),
                    selected: this.displayedColumns.map(column => { return { label: column.label, value: column.label }; }),
                    label: SELECT_COLUMNS_MODAL_LABEL,
                    sourceLabel: SELECT_COLUMNS_MODAL_SOURCE_LABEL,
                    selectedLabel: SELECT_COLUMNS_MODAL_SELECTED_LABEL,
                    max: 15, // This is the case for built-in list views, so I'll go with it for now
                    size: "small"
                });
                console.log(`Select columns modal returned with result:  ${JSON.stringify(result)}`);
                if (result && Array.isArray(result) && result.length > 0) {
                    this.displayedColumns = this.columns.filter(column => result.includes(column.label));
                    console.log(JSON.stringify(this.displayedColumns));
                } else {
                    console.warn('Unexpected result from saving columns');
                }
        }
    }

    // When the user types into the box, wait for a bit before running the search to give them an opportunity to finish typing before removing their control
    handleSearchTermChanged(event) {
        if (this.searchTimeout) { window.clearTimeout(this.searchTimeout); }
        this.searchTimeout = window.setTimeout(() => {
            try {
                this.searchTerm = event.detail.value;
                this.tableData = this.buildTableData({ searchCriterion: this.searchTerm });
                this.handleFirstPageButtonClicked();
            } catch (e) {
                console.error(e);
            } finally {
                this.isLoading = false;
            }
        }, this.SEARCH_TIMEOUT_DURATION);
        this.isLoading = true;
    }

    handleRowSelection(event) {
        switch (event.detail.config.action) {
            case 'selectAllRows':
                console.log('selectAllRows');
                for (let i = 0; i < event.detail.selectedRows.length; i++) {
                    this.selectedRows.add(event.detail.selectedRows[i].id);
                }
                break;
            case 'deselectAllRows':
                console.log('deselectAllRows');
                this.displayedData.forEach(row => {
                    this.selectedRows.delete(row.id);
                });
                break;
            case 'rowSelect':
                console.log('rowSelect');
                this.selectedRows.add(event.detail.config.value);
                break;
            case 'rowDeselect':
                console.log('rowDeselect');
                this.selectedRows.delete(event.detail.config.value);
                break;
            default:
                console.log('default');
                return;
        }
        // making a new set so that the front-end detects a change and updates things accordingly
        this.selectedRows = new Set(this.selectedRows.values());
    }

    handleFirstPageButtonClicked = () => {
        if (this.currentPage > 1) {
            this.currentPage = 1;
        }
    }
    handlePreviousPageButtonClicked = () => {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }
    handleNextPageButtonClicked = () => {
        if (this.currentPage < this.tableData.pages) {
            this.currentPage++;
        }
    }
    handleLastPageButtonClicked = () => {
        if (this.currentPage < this.tableData.pages) {
            this.currentPage = this.tableData.pages;
        }
    }

}