import { api, LightningElement, track } from 'lwc';
import generateData from './generateData';
import { TableData } from './customListViewHelper';

const columns = [
    { label: 'Label', fieldName: 'name', editable: true },
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
    displayedData = [];
    currentPage = 1;
    isLoading = true;
    selectedRows = new Set();
    displayedSelectedRowSet = new Set();
    tableData = new TableData();

    get pageLeftDisabled() {
        return this.tableData.currentPage === 1;
    }
    get pageRightDisabled() {
        return this.tableData.currentPage === this.pages;
    }
    get pageText() {
        return `Page ${this.tableData.currentPage} of ${this.tableData.pages}`;
    }
    get displayedSelectedRows() {
        return [...displayedSelectedRowSet];
    }

    connectedCallback() {
        this.data = generateData({ amountOfRecords: 302 });
        if (!this.data || this.data.length === 0) { return; } // probably want to display an error in this case
        this.datatableTitle = `Accounts (${this.data.length})`;
        this.tableData = this.buildTableData({data: this.data});
        this.displayedData = this.tableData.buildPage();
        this.pages = this.tableData.pages;
        this.isLoading = false;
    }

    buildTableData({data, pageSize, currentPage, filters, searchCriteria, sortOrder, sortField}) {
        console.log(data.length);
        return new TableData(data, pageSize || this.tableData.pageSize, currentPage || this.tableData.currentPage, filters, searchCriteria, sortOrder, sortField);
    }
    
    handleRowSelection(event) {
        switch (event.detail.config.action) {
            case 'selectAllRows':
                console.log('selectAllRows');
                for (let i = 0; i < event.detail.selectedRows.length; i++) {
                    this.selectedRows.add(event.detail.selectedRows[i]);
                }
                break;
            case 'deselectAllRows':
                console.log('deselectAllRows');                
                for (let i = 0; i < event.detail.selectedRows.length; i++) {
                    this.selectedRows.delete(event.detail.selectedRows[i]);
                }
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
                break;
        }
        console.log(this.selectedRows);
    }

    handleFirstPageButtonClicked = () => {
        if (this.tableData.currentPage > 1) {
            this.tableData = this.buildTableData({data: this.data, currentPage: 1});
            this.displayedData = this.tableData.buildPage();
        }
    }
    handlePreviousPageButtonClicked = () => {
        if (this.tableData.currentPage > 1) {
            this.tableData = this.buildTableData({data: this.data, currentPage: this.tableData.currentPage-1});
            this.displayedData = this.tableData.buildPage();
        }
    }
    handleNextPageButtonClicked = () => {
        if (this.tableData.currentPage < this.tableData.pages) {
            this.tableData = this.buildTableData({data: this.data, currentPage: this.tableData.currentPage+1});
            this.displayedData = this.tableData.buildPage();
        }
    }
    handleLastPageButtonClicked = () => {
        if (this.tableData.currentPage < this.tableData.pages) {
            this.tableData = this.buildTableData({data: this.data, currentPage: this.tableData.pages});
            this.displayedData = this.tableData.buildPage();
        }
    }

}
