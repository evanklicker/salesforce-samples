/*
    This file is for all logic that is used in this component. The main .js file should be mostly variable assingments and callouts to these functions.
    These are kept as pure as possible to ehnace testability.
*/

// Name is still being worked on
export class TableData {

    data;
    pageSize;
    pages;
    filters;
    searchCriterion;
    sortOrder;
    sortField;
    
    pagedData = [];

    // Is any selected row stuff gonna live here?
    constructor(data=[], pageSize=100, filters=[], searchCriterion='', sortOrder='asc', sortField='Id') {
        this.data = data;
        this.pageSize = pageSize;
        // maybe something like this? Filter: {field: 'string', operator: 'string', filterValue: 'string' }
        this.filters = filters;
        this.searchCriterion = searchCriterion;
        console.log(searchCriterion);
        this.sortOrder = sortOrder;
        this.sortField = sortField;
        this.buildPage();
    }

    getPageData(page) {
        if (!(page > 0 && page <= this.pagedData.length)) { return []; }
        return this.pagedData[page-1];
    }

    // Probably will end up returning an object with all the necessary params (pages, searchHighlighting? displayedData. maybe more?) to keep this functional
    buildPage() {
        if (!this.data || this.data.length === 0) { return [] }
        let data = this.applyFilters(this.data, this.filters);
        data = this.applySearchCriterion(data, this.searchCriterion);
        data = this.sort(data, this.sortOrder, this.sortField);
        ({ pages: this.pages, pagedData: this.pagedData } = this.applyPaging(data, this.pageSize));
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

    // It's possible to add search highlighting to this. It's something I'd really like to do, but 
    // I think that in order to do it, I'll need to extend base datatable and make a custom type for every
    // data type originally supported. These custom types would then allow limited html injection
    applySearchCriterion(data, searchCriterion) {
        if (!searchCriterion) { return data; }
        searchCriterion = searchCriterion.toLowerCase();
        // This _might_ work for basic string searching? But I'd like to implement a fuzzy search with highlighting
        // In that case, probably will return an obj rather than the list of data
        // there's all sorts of special cases I'd want to add here to make searching easier. Like, true = check, or true = yes, or 4 = four, 5 = five, etc
        return data.filter(row => {
            return JSON.stringify(row).toLowerCase().includes(searchCriterion);
        });
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

    applyPaging(data, pageSize) {
        let pages = Math.ceil(data.length / pageSize);
        let pagedData = [];
        // Split up the data in pages
        for (let i = 0; i < pages; i++) {
            pagedData.push(data.slice(Math.max(i * pageSize, 0), Math.min((i+1) * pageSize, data.length)));
        }
        return { pages, pagedData }
    }

}