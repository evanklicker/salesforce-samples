import { wire, LightningElement } from 'lwc';
import generateData from './generateData';
import { TableData } from './customListViewHelper';
import getColumns from '@salesforce/apex/CustomListViewController.getColumns';
import getRecords from '@salesforce/apex/CustomListViewController.getRecords';
import getUserData from '@salesforce/apex/CustomListViewController.getUserData';
import saveUserData from '@salesforce/apex/CustomListViewController.saveUserData';

const columns = [
    { label: 'Label', fieldName: 'name', editable: true },
    { label: 'Name', fieldName: 'url', type: 'url', typeAttributes: {
        label: { fieldName: 'name'}
    }},
    { label: 'Website', fieldName: 'website', type: 'url', editable: true },
    { label: 'Phone', fieldName: 'phone', type: 'phone', editable: true },
    { label: 'CloseAt', fieldName: 'closeAt', type: 'date', editable: true },
    { label: 'Balance', fieldName: 'amount', type: 'currency', editable: true },
];

/*
    Because this code is so tightly coupled with salesforce and the lightning framework, it's difficult to isolate into unit tests. As such, all the logic 
    should be put in the helper file, and this file should be mostly kept to variable assignments and callouts to that file.
*/

export default class DatatableWithInlineEdit extends LightningElement {
    columns = columns;
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
        let displayedData = new Set(this.displayedData.map(row => row.id));      
        return [...displayedData.intersection(this.selectedRows)];
    }
    get selectedRowsText() {
        if (this.selectedRows.size === 1) {
            return `1 item selected`;
        }
        return `${this.selectedRows.size} items selected`;
    }
    connectedCallback() {
        this.data = generateData({ amountOfRecords: 305 });
        if (!this.data || this.data.length === 0) { return; } // probably want to display an error in this case
        this.datatableTitle = `Accounts (${this.data.length})`;
        this.tableData = this.buildTableData({data: this.data, pageSize: this.pageSize});
        this.pages = this.tableData.pages;
        this.isLoading = false;
    }

    @wire(getColumns) 
    handleGetColumns({data, error}) {
        if (error) { 
            this.error = error;
        } else if (data) {
            this.columns = data;
            this.error = null;
        }
    }
    @wire(getRecords) 
    handleGetRecords({data, error}) {
        if (error) { 
            this.error = error;
        } else if (data) {
            this.data = data;
            this.error = null;
        }
    }
    @wire(getUserData) 
    handleGetUserData({data, error}) {
        if (error) { 
            this.error = error;
        } else if (data) {
            this.userData = data;
            this.error = null;
        }
    }

    buildTableData({data, pageSize, filters, searchCriterion, sortOrder, sortField}) {
        return new TableData(data || this.data, pageSize || this.tableData.pageSize, filters, searchCriterion || this.searchTerm, sortOrder, sortField);
    }

    // When the user types into the box, wait for 2 seconds before running the search to give them an opportunity to finish typing before removing their control
    handleSearchTermChanged(event) {
        if (this.searchTimeout) { window.clearTimeout(this.searchTimeout); }
        this.searchTimeout = window.setTimeout(() => {
            try {
                this.searchTerm = event.detail.value;
                this.tableData = this.buildTableData({searchCriterion: this.searchTerm});
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