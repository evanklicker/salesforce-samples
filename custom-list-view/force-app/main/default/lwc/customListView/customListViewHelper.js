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

let SELECT_COLUMNS_MODAL_LABEL = 'Select Fields to Display';
let SELECT_COLUMNS_MODAL_SOURCE_LABEL = 'Available Fields';
let SELECT_COLUMNS_MODAL_SELECTED_LABEL = 'Visible Fields';
export function getColumnSelectorParams(columns, displayedColumns) {
    return {
        options: columns.map(column => { return { label: column.label, value: column.label }; }),
        values: displayedColumns.map(column => column.label),
        label: SELECT_COLUMNS_MODAL_LABEL,
        sourceLabel: SELECT_COLUMNS_MODAL_SOURCE_LABEL,
        selectedLabel: SELECT_COLUMNS_MODAL_SELECTED_LABEL,
        max: 15, // This is the case for built-in list views, so I'll go with it for now
        size: "small"
    }
}

export function prepareTableData(records) {
    let result = records.map(record => {
        return flattenObject(record);
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

function flattenObject(obj, delimiter = '', prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? `${prefix}${delimiter}` : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && Object.keys(obj[k]).length > 0) {
            Object.assign(acc, this.flattenObject(obj[k], delimiter, pre + k));
        }
        else acc[pre + k] = obj[k];
        return acc;
    }, {});
}

export function createColumnDefs(rawFieldInfos) {
    return rawFieldInfos.map(field => {
        // Remove the Name field since it's incorporated into the Id field def
        if (field.name.endsWith('Name')) { return; }
        let column;
        if (field.name.endsWith('Id')) {
            column = setupIdColumn(field);
        } else {
            column = setupNormalColumn(field);
        }
        return column;
    }).filter(column => !!column);
}

function setupIdColumn(fieldInfo) {
    let fieldNameBase = (fieldInfo.relationshipName || '') + fieldInfo.name.slice(0, fieldInfo.name.length - 2);
    return {
        // I think we're eventually gonna need to override every field proivded by the base implementation..
        ...this.setupNormalColumn(fieldInfo),
        // We will probably need to add something like, `relationshipLabel` or something like that, 'cuz I don't think we
        // can generate a nice user-facing column label with what we currently have
        label: `${fieldInfo.relationshipName ? (fieldInfo.relationshipName + ' ') : ''}${fieldInfo.name.endsWith('Id') ? 'Name' : fieldInfo.label}`,
        fieldName: `${fieldNameBase}Url`,
        typeAttributes: {
            label: {fieldName: `${fieldInfo.relationshipName || ''}Name` }
        },
        iconName: fieldInfo.iconName || 'standard:' + fieldInfo.sObjectType.toLowerCase()
    }
}

function setupNormalColumn(fieldInfo) {
    return {
        // Don't use Id fields as labels - use them for urls instead
        label: (fieldInfo.relationshipName || '') + fieldInfo.label,
        type: convertType(fieldInfo.type.toLowerCase()),
        fieldName: (fieldInfo.relationshipName || '') + fieldInfo.name,
        editable: fieldInfo.isUpdateable,
        sortable: !!fieldInfo.sortable
    }
}

function convertType(type) {
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