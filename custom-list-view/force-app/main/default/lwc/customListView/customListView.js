import { wire, LightningElement } from 'lwc';
import generateData from './generateData';
import { TableData } from './customListViewHelper';
import getTableData from '@salesforce/apex/CustomListViewController.getTableData';
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
        //this.data = generateData({ amountOfRecords: 305 });
        //if (!this.data || this.data.length === 0) { return; } // probably want to display an error in this case
    }

    @wire(getTableData) 
    handleGetTableData({data, error}) {
        console.log("handleGetTableData: ");
        if (error) { 
            this.error = error;
            console.error(error);
        } else if (data) {
            console.log(`getTableData result: `);
            console.log(data);
            if (!data.fields) { throw new Error('No column defs found!'); }
            if (!data.records) { throw new Error('No records found!'); }
            this.datatableTitle = `Accounts (${data.records.length})`;
            this.columns = this.createColumnDefs(data.fields);
            this.data = data.records;
            this.tableData = this.buildTableData({data: this.data, pageSize: this.pageSize});
            this.pages = this.tableData.pages;
            this.error = null;
            this.isLoading = false;
        }
    }
    @wire(getUserData) 
    handleGetUserData({data, error}) {
        console.log("handleGetUserData: "); 
        if (error) { 
            this.error = error;
            console.error(error);
        } else if (data) {
            console.log(data);
            this.userData = data;
            this.error = null;
        }
    }

    // This doesn't handle relationship fields very well - they're all gonna be called "<object> Id" instead of "<object> Name" or just "<object>"
    createColumnDefs(rawFieldInfos) {
        return rawFieldInfos.map(field => {
            // Remove the Name field since it's incorporated into the Id field def
            // Probably will need to remove other relationship Name fields later, but they aren't in the field infos right now
            if (field.name === 'Name') { return; }
            let column = {
                // label: field.name === 'Id'? 'Name' : field.label,
                label: field.name === 'Id'? 'Name' : field.name,
                type: this.convertType(field.type),
                fieldName: field.name,
                editable: field.isUpdateable, // this probably isn't the best way to do this since I don't think it considers user perms (though it should on the back-end when they try to save)
                sortable: !!field.sortable
            }
            if (field.relationshipName) {
                column.typeAttributes = {
                    // When we get data back from the query, for relationship fields, it's gonna be like `Account.Name`
                    // We're just gonna remove the `.` and use that at the label for the link to that record in the table
                    // This also kinda assumes that the name field will be called name, which is generally but not always true
                    label: { fieldName: `${field.relationshipName}Name`}
                }
                // This should work for all standard objects, but custom objects will need to have an icon listed in the column JSON
                column.iconName = field.iconName || 'standard:' + field.sObjectType.toLowerCase();
            }
            console.dir(JSON.stringify(column));
            return column;
        }).filter(column => !!column);
    }

    convertType(type) {
        switch (type) {
            case 'boolean','currency':
                return type;
            case 'picklist','string','textarea','phone','address':
                return 'text';
            case 'int','double':
                return 'number';
            case 'reference', 'url':
                return 'url';
            case 'date','datetime':
                return 'date';
            default:
                return 'text';
        }
    }

    buildTableData({data, pageSize, filters, searchCriterion, sortOrder, sortField}) {
        return new TableData(data || this.data, pageSize || this.tableData.pageSize, filters, searchCriterion || this.searchTerm, sortOrder, sortField);
    }

    // When the user types into the box, wait for a bit before running the search to give them an opportunity to finish typing before removing their control
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