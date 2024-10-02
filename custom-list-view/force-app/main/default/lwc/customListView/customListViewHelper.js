/*
    This file is for all logic that is used in this component. The main .js file should be mostly variable assingments and callouts to these functions.
    These are kept as pure as possible to ehnace testability.
*/

// Name is still being worked on
export class TableData {

    data;
    pageSize;
    currentPage;
    pages;
    filters;
    searchCriterion;
    sortOrder;
    sortField;
    
    displayedData;

    // Is any selected row stuff gonna live here?
    constructor(data=[], pageSize=100, currentPage=1, filters=[], searchCriteria='', sortOrder='asc', sortField='Id') {
        this.data = data;
        this.pageSize = pageSize;
        this.currentPage = currentPage;
        // maybe something like this? Filter: {field: 'string', operator: 'string', filterValue: 'string' }
        this.filters = filters;
        this.searchCriteria = searchCriteria;
        this.sortOrder = sortOrder;
        this.sortField = sortField;
    }

    // Probably will end up returning an object with all the necessary params (pages, searchHighlighting? displayedData. maybe more?) to keep this functional
    buildPage() {
        if (!this.data || this.data.length === 0) { return [] }
        let data = this.applyFilters(this.data, this.filters);
        data = this.applySearchCriterion(data, this.searchCriterion);
        data = this.sort(data, this.sortOrder, this.sortField);
        ({ pages: this.pages, displayedData: data } = this.applyPaging(data, this.pageSize, this.currentPage));
        this.displayedData = data;
        return data;
    }

    applyFilters(data, filters) {
        // filters.forEach(filter => {
        //     data.filter(row => {
        //         // This isn't right but we're not implementing filters quite yet, so good enough
        //         return row[filter.field] === filter.filterValue;
        //     })
        // });
        return data;
    }

    applySearchCriterion(data, searchCriterion) {
        // This _might_ work for basic string searching? But I'd like to implement a fuzzy search with highlighting
        // In that case, probably will return an obj rather than the list of data
        // let dataStrings = data.map(row => {JSON.stringify(row)});
        // dataStrings.filter(string => string.includes(searchCriterion));
        // return JSON.parse(dataStrings);
        return data;
    }

    sort(data, sortOrder, sortField) {
        // This code probably isn't right, but it gives an idea of how I plan on doing this
        // return data.sort((a, b) => {
        //     let order = 1;
        //     if (sortOrder == 'asc') {
        //         order = -1;
        //     }
        //     if (typeof data[0][sortField] === 'number') {
        //         return order*(a[sortField]-b[sortField]);
        //     } else if (typeof data[0][sortField] === 'string') {
        //         return order*(a[sortField].toLowerCase().localeCompare(b[sortField].toLowerCase()));
        //     }
        // });
        return data;
    }

    applyPaging(data, pageSize, currentPage) {
        return {
            pages: Math.ceil(data.length / pageSize),
            displayedData: data.slice(Math.max((currentPage-1) * pageSize, 0), Math.min(currentPage * (pageSize), data.length))
        }
    }

}