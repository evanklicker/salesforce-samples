public with sharing class CustomListViewController {

    public static final String APPLICATION_NAME = 'CustomListView';

    @testVisible
    static CustomListViewDataProvider dataProvider = new CustomListViewDataProvider();
    
    public static TableData getFields() {
        TableData tableData = new TableData();
        Map<String, Object> fieldData = (Map<String, Object>) JSON.deserializeUntyped(dataProvider.getColumnData_Metadata());
        String sObjectType = (String) fieldData.get('sObjectType');
        List<String> fields = new List<String>();
        for (Object fieldName : (List<Object>) fieldData.get('fields')) {
        	fields.add((String) fieldName);
        }
        if (sObjectType == null || fields == null || fields.isEmpty()) {
            throw new NoDataFoundException();
        }
        List<Column> columns = new List<Column>();
        tableData.fields = columns;
        tableData.sObjectType = sObjectType;
        for (String field : fields) {
            if (PermissionsUtility.isFieldAccessible(sObjectType, field)) {
                columns.add(new Column(sObjectType, field, SchemaUtility.getLabel(sObjectType, field), SchemaUtility.getType(sObjectType, field).name(), PermissionsUtility.isFieldUpdateable(sObjectType, field)));
            }
        }
        
        // Everything from here to the end is concerning relationship fields
        // This might need to be recursive to handle multi-level relationships. As it stands, it can only do one level
        List<Map<String, Object>> relationshipFieldInfos = new List<Map<String, Object>>();
        for (Object fieldInfo : (List<Object>) fieldData.get('relationshipFields')) {
            relationshipFieldInfos.add((Map<String, Object>) fieldInfo);
        }
        if (relationshipFieldInfos == null || relationshipFieldInfos.isEmpty()) {
    		return tableData;
        }
        for (Map<String, Object> relationship : relationshipFieldInfos) {
            String relationshipSObjectType = (String) relationship.get('sObjectType');
            String relationshipName = (String) relationship.get('relationshipName');
            List<String> relationshipFields = new List<String>();
            for (Object relationshipFieldName : (List<Object>) relationship.get('fields')) {
                relationshipFields.add((String) relationshipFieldName);
            }
            if (relationshipSObjectType == null || relationshipName == null || relationshipFields == null || relationshipFields.isEmpty()) { return tableData; }
            for (String relationshipField : relationshipFields) {
                if (PermissionsUtility.isFieldAccessible(relationshipSObjectType, relationshipField)) {
                    columns.add(new Column(relationshipSObjectType, 
                                           relationshipField,
                                           SchemaUtility.getLabel(relationshipSObjectType, relationshipField),
                                           SchemaUtility.getType(relationshipSObjectType, relationshipField).name(), 
                                           PermissionsUtility.isFieldUpdateable(relationshipSObjectType, relationshipField), 
                                           relationshipName)
                               );
                }
            }
        }
        return tableData;
    }
    
    // There are a number of improvements that could be made to this. First off - it only supports 2000 records,
    // since that's how many SOQL will return in one query. Second, there's no filtering support or anything like that
    public static List<SObject> getRecords(TableData tableData) {
        if (tableData == null || tableData.sObjectType == null || tableData.fields == null || tableData.fields.isEmpty()) {
            return new List<SObject>();
        }
        List<String> queryFields = new List<String>();
        for (Column field : tableData.fields) {
            if (field.relationshipName == null) {
                queryFields.add(field.name);
            } else {
                queryFields.add(field.relationshipName + '.' + field.name);    
            }
        }
        // If there are single quotes, then this query will definitely be malformed. But hey, at least it's not susceptible to injection
        String query = 'SELECT ' + String.escapeSingleQuotes(String.join(queryFields, ', ')) + ' FROM ' + String.escapeSingleQuotes(tableData.sObjectType) + ' WITH SECURITY_ENFORCED';
        System.debug(query);
        return Database.query(query);
    } 

    public static List<Account> getRecords() {
        return dataProvider.getRecords();
    }

    @AuraEnabled(cacheable=true)
    public static User_Application_Data__c getUserData() {
        List<User_Application_Data__c> results = dataProvider.getUserData();
        if (results.size() == 0) {
            return new User_Application_Data__c(Application__c = APPLICATION_NAME);
        }
        return results[0];
    }
    
    // This has two purposes - get the column defs (that the current user has access to) and the data for those columns
    @AuraEnabled(cacheable=true)
    public static TableData getTableData() {
        TableData tableData = getFields();
        tableData.records = getRecords(tableData);
        System.debug('About to return table data to front-end!');
        System.debug(tableData);
        return tableData;
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
    
    /*
     * The idea with this is to get the column definition metadata from the custom metadata record, check those field against the permissions utility to
     * make sure the current user has the right access to everything, and then get the data in the database corresponding to that result. Then 
     * return all of that packaged together in one payload
     */
    public class TableData {
        @AuraEnabled public String sObjectType;
        @AuraEnabled public List<SObject> records;
        @AuraEnabled public List<Column> fields;
    }
    
    // A column of data to be displayed in the data table. Has an SObjectType which may differ from the table's main SObjectType
    public class Column {
        @AuraEnabled public String sObjectType;
        @AuraEnabled public String name;
        @AuraEnabled public String label;
        @AuraEnabled public String type;
        @AuraEnabled public String relationshipName;
        @AuraEnabled public Boolean isUpdateable;
        
        public Column(String sObjectType, String field, String label, String type, Boolean isUpdateable) {
            this.sObjectType = sObjectType;
            this.name = field;
            this.label = label;
            this.type = type;
            this.isUpdateable = isUpdateable;
        }
        
        public Column(String sObjectType, String field, String label, String type, Boolean isUpdateable, String relationshipName) {
            this(sObjectType, field, label, type, isUpdateable);
            this.relationshipName = relationshipName;
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

        @testVisible
        virtual String getColumnData_Metadata() {
            // This method just puts the columns JSON string into custom metadata.
            // That way you can manage the displayed data without needing to do deployments
            // TODO: Make this type and record and fill these in
            List<App_Config__mdt> columnConfigs = [SELECT Id, Application__c, Data__c FROM App_Config__mdt WHERE Application__c = :APPLICATION_NAME];
            if (columnConfigs.size() > 1) {
                //idk
            } else if (columnConfigs.size() == 1) {
                return columnConfigs[0].Data__c;
            }
            return '[{"default":"not implemented"}]';
            // add some default option with a VERY limited number of columns. Just like, Name, and nothing else
        }

        // It makes more sense for me to use Schema.SObjectField here, but only the Schema.DescribeFieldResult class is serializable. Oh well
        @testVisible
        virtual List<Schema.DescribeFieldResult> getColumnData_Permissions() {
            // The idea here is to return all fields on the displayed object that the user has access to.
            // It conveniently would add any new fields that get added later without needing to update this component
            // But if you have a lot of fields it might get unwieldy for the users.
            // The other major downside here is that it becomes much more complex to setup any columns that don't have a 
            // 1:1 correspondence with fields. For example, row actions, or composite fields.
            List<Schema.DescribeFieldResult> columns = new List<Schema.DescribeFieldResult>();
            for (Schema.SObjectField field : PermissionsUtility.getAccessibleFields(Account.SObjectType)) {
				columns.add(field.getDescribe());
            }
            return columns;
        }

        // Alternatively, you might be able to use field sets for the column list. Not sure that
        // will have all the controls you'd want, but it seems possible
    }

}