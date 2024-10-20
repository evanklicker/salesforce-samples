import { api } from 'lwc';
import LightningDatatable from 'lightning/datatable';
import customNameTemplate from './customName.html';
import customNameEditTemplate from './customNameEdit.html';
import customPicklistTemplate from './customPicklist.html';
import customPicklistEditTemplate from './customPicklistEdit.html';

export default class EnhancedDatatable extends LightningDatatable {
    // @api keyField;
    // @api data;
    // @api columns;
    // // @api onRowSelection;
    // @api selectedRows;
    // @api draftValues;
    // @api sortedDirection;
    // @api sortedBy;
    // @api errors;
    // // @api onSort;
    // // @api onCancel;
    // // @api onSave;
    // // @api onCellChange;
    // // @api onChange;
    @api showRowNumberColumn = false;

    static customTypes = {
        customName: {
            template: customNameTemplate,
            editTemplate: customNameEditTemplate,
            standardCellLayout: true,
            typeAttributes: ['url', 'tooltip', 'target'],
        },
        customPicklist: {
            template: customPicklistTemplate,
            editTemplate: customPicklistEditTemplate,
            standardCellLayout: true,
            typeAttributes: ['options'],
        }
    };
}