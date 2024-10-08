public with sharing class CustomListViewController {

    public static final String APPLICATION_NAME = 'CustomListView';

    @testVisible
    static CustomListViewDataProvider dataProvider = new CustomListViewDataProvider();
    
    // Below are provided a few different implementations of this. Which is better 
    // suited for the component is dependent on the business needs and org setup
    @AuraEnabled
    public static String getColumns() {
        return JSON.serialize(dataProvider.getColumnData_Permissions());
    }

    @AuraEnabled
    public static List<Account> getRecords() {
        return dataProvider.getRecords();
    }

    @AuraEnabled
    public static User_Application_Data__c getUserData() {
        List<User_Application_Data__c> results = dataProvider.getUserData();
        if (results.size() == 0) {
            return new User_Application_Data__c(Application__c = APPLICATION_NAME);
        }
        return results[0];
    }

    @AuraEnabled
    public static void saveUserData(String userData) {
        List<User_Application_Data__c> results = dataProvider.getUserData();
        if (results.size() > 1) {
            // delete records?
            return;
        } else if (results.size() == 1) {
            results[0].Data__c = userData;
            dataProvider.saveUserData(results[0]);
        } else {
            dataProvider.saveUserData(new User_Application_Data__c(Data__c = userData, Application__c = APPLICATION_NAME));
        }
    }

    // All databade interactions go through the data provider. This is almost entirely to make testing faster and easier.
    // Not always extremely necessary for controllers, which are typically pretty simple
    @testVisible
    virtual class CustomListViewDataProvider {
        
        // I'm struggling to find documentation about it, but I guess you don't need `virtual` for these
        // You also don't need to use `override` for the test data provider extending this. *shrug*

        @testVisible
        virtual List<Account> getRecords() {
            // Not 100% sold on selectors for everything, so maybe just query here
            // return AccountSelector.query('');
            return new List<Account>();
        }

        @testVisible
        virtual List<User_Application_Data__c> getUserData() {
            return [SELECT Id, Data__c FROM User_Application_Data__c WHERE OwnerId = :UserInfo.getUserId() AND Application__c = :APPLICATION_NAME ORDER BY LastModifiedDate DESC LIMIT 1];
        }

        @testVisible
        virtual void saveUserData(User_Application_Data__c record) {
            upsert record;
        }

        // @testVisible
        // virtual CustomMetadata__c getColumnData_Metadata() {
            // This method just puts the columns JSON string into custom metadata.
            // That way you can manage the displayed data without needing to do deployments
            // TODO: Make this type and record and fill these in
            // return CustomMetadataSelector.getByName('App_Config__mdt', 'Custom_List_View_Data');
        // }

        // It makes more sense for me to use Schema.SObjectField here, but only the Schema.DescribeFieldResult class is serializable. Oh well
        @testVisible
        virtual List<Schema.DescribeFieldResult> getColumnData_Permissions() {
            // The idea here is to return all fields on the displayed object that the user has access to.
            // It conveniently would add any new fields that get added later without needing to update this component
            // But if you have a lot of fields it might get unwieldy for the users.
            // The other major downside here is that it becomes much more complex to setup any columns that don't have a 
            // 1:1 correspondence with fields. For example, row actions, or composite fields.
            //return PermissionsUtility.getAccessibleFields(Account.SObjectType);
            return new List<Schema.DescribeFieldResult>();
        }

        // Alternatively, you might be able to use field sets for the column list. Not sure that
        // will have all the controls you'd want, but it seems possible
    }

}