public with sharing class CustomListViewController {

    static CustomListViewDataProvider dataProvider = new CustomListViewDataProvider();

    // All databade interactions go through the data provider. This is almost entirely to make testing faster and easier
    class CustomListViewDataProvider {

        List<Account> getRecords() {
            // Not 100% sold on selectors for everything, so maybe just query here
            // return AccountSelector.query('');
            return new List<Account>();
        }

        // CustomMetadata__c getColumnData_Metadata() {
            // This method just puts the columns JSON string into custom metadata.
            // That way you can manage the displayed data without needing to do deployments
            // TODO: Make this type and record and fill these in
            // return CustomMetadataSelector.getByName('CustomMetadataTypeName', 'recordName');
        // }

        List<Schema.SObjectField> getColumnData_Permissions() {
            // The idea here is to return all fields on the displayed object that the user has access to.
            // It conveniently would add any new fields that get added later without needing to update this component
            // But if you have a lot of fields it might get unwieldy for the users.
            // The other major downside here is that it becomes much more complex to setup any columns that don't have a 
            // 1:1 correspondence with fields. For example, row actions, or composite fields.
            return PermissionsUtility.getAccessibleFields(Account.SObjectType);
        }

        // Alternatively, you might be able to use field sets for the column list. Not sure that
        // will have all the controls you'd want, but it seems possible
    }

    // Above are provided a few different implementations of this. Which is better 
    // suited for the component is dependent on the business needs and org setup
    @AuraEnabled
    public static String getColumns() {
        return JSON.serialize(dataProvider.getColumnData_Permissions());
    }

}