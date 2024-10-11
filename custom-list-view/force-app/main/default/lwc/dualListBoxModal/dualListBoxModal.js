import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class DualListBoxModal extends LightningModal {

    @api options;
    @api selected;
    @api label;
    @api sourceLabel;
    @api selectedLabel;
    @api min;
    @api max;

    handleChange(event) {
        this.selected = event.detail.value;
    }

    handleSave() {
        this.close(this.selected);
    }

    handleCancel() {
        this.close();
    }

}