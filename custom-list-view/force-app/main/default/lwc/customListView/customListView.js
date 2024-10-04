import { api, LightningElement, track } from 'lwc';
import generateData from './generateData';
import { TableData } from './customListViewHelper';

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
    displayedSelectedRowSet = new Set();
    tableData = new TableData();

    get pageLeftDisabled() {
        return this.currentPage === 1;
    }
    get pageRightDisabled() {
        return this.currentPage === this.tableData.pages;
    }
    get pageText() {
        return `Page ${this.currentPage} of ${this.tableData.pages}`;
    }
    get displayedSelectedRows() {
        return [...this.displayedSelectedRowSet];
    }
    get displayedData() {
        if (!this.tableData) { return []; }
        return [...this.tableData.getPageData(this.currentPage)];
    }
    connectedCallback() {
        this.data = generateData({ amountOfRecords: 302 });
        if (!this.data || this.data.length === 0) { return; } // probably want to display an error in this case
        this.datatableTitle = `Accounts (${this.data.length})`;
        this.tableData = this.buildTableData({data: this.data});
        this.pages = this.tableData.pages;
        this.isLoading = false;
    }

    buildTableData({data, pageSize, currentPage, filters, searchCriteria, sortOrder, sortField}) {
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
        if (this.currentPage > 1) {
            this.currentPage = 1;
            // this.tableData = this.buildTableData({data: this.data, currentPage: 1});
        }
    }
    handlePreviousPageButtonClicked = () => {
        if (this.currentPage > 1) {
            this.currentPage--;
            // this.tableData = this.buildTableData({data: this.data});
        }
    }
    handleNextPageButtonClicked = () => {
        if (this.currentPage < this.tableData.pages) {
            this.currentPage++;
            // this.tableData = this.buildTableData({data: this.data});
        }
    }
    handleLastPageButtonClicked = () => {
        if (this.currentPage < this.tableData.pages) {
            this.currentPage = this.tableData.pages;
            // this.tableData = this.buildTableData({data: this.data});
        }
    }

}
