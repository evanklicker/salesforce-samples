@isTest
public class PermissionsUtilityTest {
    
    static Profile testProfile;
    
    static {
        testProfile = [SELECT Id FROM Profile WHERE Name = 'Testing'];
    }

    @isTest
    static void getAccessibleFields_canAccessAll() {
        List<String> fields = getAccountFields();
		User testUser = createUser();
        Id permSetId = createPermissionSet(testUser);
		grantFieldPermissions (permSetId, 'Account', fields);
        
        System.runAs(testUser) {
            
            Test.startTest();
            List<Schema.SObjectField> results = PermissionsUtility.getAccessibleFields(Account.SObjectType);
            Test.stopTest();
            
            for (Schema.SObjectField result : results) {
				Assert.isTrue(fields.contains(result.getDescribe().getName().toLowerCase()), 'Expected ' + result.getDescribe().getName() + ' to be accessible');
            }
        }
    }
    
    // The idea here is to exclude a few fields that the user doesn't already have access to, and show that those fields
    // won't be included in the final result because of that exclusion
    @isTest
    static void getAccessibleFields_canAccessSome() {
		User testUser = createUser();
        Id permSetId = createPermissionSet(testUser);
        
        List<Schema.SObjectField> fields = Schema.SObjectType.Account.fields.getMap().values();
        List<String> excludedFields = new List<String>();
        Integer counter = 0;
        // Pick 3 custom, nillable fields (basically - not required) to exclude from the list
        for (Integer i = fields.size() - 1; i >= 0 && counter < 3; i--) {
            Schema.SObjectField field = fields[i];
            if (field.getDescribe().isCustom() && field.getDescribe().isNillable()) {
                fields.remove(i);
                excludedFields.add(field.getDescribe().getName().toLowerCase());
                counter++;
            }
        }
        List<String> fieldStrings = new List<String>();
        for (Schema.SObjectField field : fields) {
            fieldStrings.add(field.getDescribe().getName().toLowerCase());
        }
		grantFieldPermissions (permSetId, 'Account', fieldStrings);
        
        System.runAs(testUser) {
            
            Test.startTest();
            List<Schema.SObjectField> results = PermissionsUtility.getAccessibleFields(Account.SObjectType);
            Test.stopTest();
            
            for (Schema.SObjectField result : results) {
				Assert.isTrue(fieldStrings.contains(result.getDescribe().getName().toLowerCase()), 'Expected ' + result.getDescribe().getName() + ' to be accessible');
                Assert.isFalse(excludedFields.contains(result.getDescribe().getName().toLowerCase()));
            }
        }
    }
    
    // This test is a little redundant, but it's hard to know at any given time which fields a user (even one with no permissions)
    // will have access to. Fields like Id, Name (required) or address (composite) will have somewhat unpredictable behavior in terms of the schema.
    // It doesn't make sense to me to have this test fail if I were to create a new address field. 
    @isTest
    static void getAccessibleFields_canAccessNone() {
        List<String> fields = getAccountFields();
		User testUser = createUser();

        System.runAs(testUser) {
            
            Test.startTest();
            List<Schema.SObjectField> results = PermissionsUtility.getAccessibleFields(Account.SObjectType);
            Test.stopTest();
            
            for (Schema.SObjectField result : results) {
				Assert.isTrue(result.getDescribe().isAccessible(), 'Expected ' + result.getDescribe().getName() + ' to be accessible');
            }
        }
    }
    
    @isTest
    static void isFieldEditable() {
        
        Test.startTest();
        Boolean result = PermissionsUtility.isFieldEditable('Account.Parent.MasterRecord.Owner.Name');
        Test.stopTest();
        
        System.debug(result);
    }
    
    /*
     * 	Not adding them right now for brevity, but basically copy/paste the above tests for the other permissions. Create, Edit, Delete, maybe some of the weird ones too.
     */
    
    static User createUser() {
		User u = new User(FirstName = 'Test', LastName = 'User', ProfileId = testProfile.Id, UserName = 'testuser@definitely.unique.test.com', Email = 'testuser@test.com', Alias = 'testu', TimeZoneSidKey = 'America/Denver', LocaleSidKey = 'en_US', EmailEncodingKey = 'ISO-8859-1', languageLocaleKey = 'en_US');
        insert u;
        return u;
    }
    
    static Id createPermissionSet(User u) {
        PermissionSet ps = new PermissionSet(Name = 'Test', Label = 'Test');
        insert ps;
        PermissionSetAssignment psa = new PermissionSetAssignment(PermissionSetId = ps.Id, AssigneeId = u.Id);
        insert psa;
        return ps.Id;
    }
    
    // Try to save as many of these as possible - many will fail, but I think those will automatically be granted access to.
    // We won't test those, anyway, just in case
    static void grantFieldPermissions(Id permSetId, String objectType, List<String> fields) {
        insert new ObjectPermissions(ParentId = permSetId, SObjectType = objectType, PermissionsRead = true, PermissionsCreate = true);
        List<FieldPermissions> fieldPerms = new List<FieldPermissions>();
        for (String field : fields) {
            fieldPerms.add(new FieldPermissions(ParentId = permsetId, SObjectType = objectType, Field = objectType + '.' + field, PermissionsRead = true));
        }
        Database.insert(fieldPerms, false);
    }
    
    static List<String> getAccountFields() {
        List<String> result = new List<String>();
        for (String field : Schema.SObjectType.Account.fields.getMap().keySet()) {
            result.add(field.toLowerCase());
        }
        return result;
    }
    
}