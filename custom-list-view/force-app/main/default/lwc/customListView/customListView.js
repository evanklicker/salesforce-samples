import { api, LightningElement, track } from 'lwc';
import generateData from './generateData';

const columns = [
    { label: 'Label', fieldName: 'name', editable: true },
    { label: 'Website', fieldName: 'website', type: 'url', editable: true },
    { label: 'Phone', fieldName: 'phone', type: 'phone', editable: true },
    { label: 'CloseAt', fieldName: 'closeAt', type: 'date', editable: true },
    { label: 'Balance', fieldName: 'amount', type: 'currency', editable: true },
];

export default class DatatableWithInlineEdit extends LightningElement {
    columns = columns;
    draftValues = [];
    pageSize = 20;
    pages;
    displayedData = [];
    currentPage = 1;

    get pageLeftDisabled() {
        return this.currentPage === 1;
    }
    get pageRightDisabled() {
        return this.currentPage === this.pages;
    }

    connectedCallback() {
        this.data = generateData({ amountOfRecords: 302 });
        if (!this.data || this.data.length === 0) { return; } // probably want to display an error in this case
        let result = this.setupDisplayedData(this.data, this.currentPage, this.pageSize);
        this.pages = result.pages;
        this.displayedData = result.displayedData;
    }

    setupDisplayedData(data, currentPage, pageSize) {
        return {
            pages: Math.ceil(data.length / pageSize),
            displayedData: data.slice(Math.max((currentPage-1) * pageSize, 0), Math.min(currentPage * (pageSize), data.length))
        }
    }

    handleFirstPageButtonClicked = () => {
        if (this.currentPage > 1) {
            this.currentPage = 1;
        }
        this.displayedData = this.setupDisplayedData(this.data, this.currentPage, this.pageSize).displayedData;
    }
    handlePreviousPageButtonClicked = () => {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
        this.displayedData = this.setupDisplayedData(this.data, this.currentPage, this.pageSize).displayedData;
    }
    handleNextPageButtonClicked = () => {
        if (this.currentPage < this.pages) {
            this.currentPage++;
        }
        this.displayedData = this.setupDisplayedData(this.data, this.currentPage, this.pageSize).displayedData;
    }
    handleLastPageButtonClicked = () => {
        if (this.currentPage < this.pages) {
            this.currentPage = this.pages;
        }
        this.displayedData = this.setupDisplayedData(this.data, this.currentPage, this.pageSize).displayedData;
    }

}
