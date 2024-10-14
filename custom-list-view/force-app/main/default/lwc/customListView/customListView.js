import { wire, LightningElement } from 'lwc';
import { TableData, getColumnSelectorParams, prepareTableData, createColumnDefs } from './customListViewHelper';
import DualListBoxModal from 'c/dualListBoxModal';
import getTableData from '@salesforce/apex/CustomListViewController.getTableData';
import getUserData from '@salesforce/apex/CustomListViewController.getUserData';
import saveUserData from '@salesforce/apex/CustomListViewController.saveUserData';

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

    getUserDataFinished = false;

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
        let displayedData = new Set(this.displayedData.map(row => row.Id));
        return [...displayedData.intersection(this.selectedRows)];
    }
    get selectedRowsText() {
        if (this.selectedRows.size === 1) {
            return `1 item selected`;
        }
        return `${this.selectedRows.size} items selected`;
    }

    @wire(getTableData)
    handleGetTableData({ data, error }) {
        if (error) {
            this.error = error;
            // TODO: better error handling
            console.error(error);
        } else if (data) {
            if (!data.fields) { throw new Error('No column defs found!'); }
            if (!data.records) { throw new Error('No records found!'); }
            this.datatableTitle = `Accounts (${data.records.length})`;
            this.columns = createColumnDefs(data.fields);
            // This will need to be changed when User Preferences get incorporated
            if (this.getUserDataFinished) {
                this.displayedColumns = this.setupDisplayedColumns(this.columns, this.userData);
            }
            this.data = prepareTableData(data.records);
            this.tableData = this.buildTableData({ data: this.data, pageSize: this.pageSize });
            this.pages = this.tableData.pages;
            this.error = null;
            this.isLoading = false;
        }
    }
    @wire(getUserData)
    handleGetUserData({ data, error }) {
        if (error) {
            this.getUserDataFinished = true;
            console.log('getUserData error!');
            this.error = error;
            console.error(error);
        } else if (data) {
            this.getUserDataFinished = true;
            console.log('getUserData data found!');
            console.log(data);
            this.userData = JSON.parse(data.Data__c);
            if (this.columns) {
                this.displayedColumns = this.setupDisplayedColumns(this.columns, this.userData);
            }
            this.error = null;
        }
    }

    setupDisplayedColumns(columns, userData) {
        return columns.filter(column => {
            return (userData.find(data => {
                // Not 100% sure this is the best way to compare two columns to see if they are the same
                return data.label == column.label && data.type == column.type && data.fieldName == column.fieldName;
            }) != null);
        })
    }

    buildTableData({ data, pageSize, filters, searchCriterion, sortOrder, sortField }) {
        return new TableData(data || this.data, pageSize || this.tableData.pageSize, filters, searchCriterion || this.searchTerm, sortOrder, sortField);
    }

    async handleMenuSelect(event) {
        const selectedItemValue = event.detail.value;
        switch (selectedItemValue) {
            case 'selectFields':
                console.log('Selecting new columns to display...');
                console.log(JSON.stringify(this.displayedColumns.map(column => { return { label: column.label, value: column.label }; })));
                let result = await DualListBoxModal.open(getColumnSelectorParams(this.columns, this.displayedColumns));
                console.log(`Select columns modal returned with result:  ${JSON.stringify(result)}`);
                if (result && Array.isArray(result) && result.length > 0) {
                    this.displayedColumns = this.columns.filter(column => result.includes(column.label));
                    saveUserData({userData: JSON.stringify(this.displayedColumns)});
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
                for (let i = 0; i < event.detail.selectedRows.length; i++) {
                    this.selectedRows.add(event.detail.selectedRows[i].Id);
                }
                break;
            case 'deselectAllRows':
                this.displayedData.forEach(row => {
                    this.selectedRows.delete(row.Id);
                });
                break;
            case 'rowSelect':
                this.selectedRows.add(event.detail.config.value);
                break;
            case 'rowDeselect':
                this.selectedRows.delete(event.detail.config.value);
                break;
            default:
                return;
        }
        // making a new set so that the front-end detects a change and updates things accordingly
        this.selectedRows = new Set(this.selectedRows.values());
    }

    handleFirstPageButtonClicked() {
        if (this.currentPage > 1) {
            this.currentPage = 1;
        }
    }
    handlePreviousPageButtonClicked() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }
    handleNextPageButtonClicked() {
        if (this.currentPage < this.tableData.pages) {
            this.currentPage++;
        }
    }
    handleLastPageButtonClicked() {
        if (this.currentPage < this.tableData.pages) {
            this.currentPage = this.tableData.pages;
        }
    }

}