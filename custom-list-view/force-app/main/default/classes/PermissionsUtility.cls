public with sharing class PermissionsUtility {
    
    // Some basic caching to prevent further slowdowns when this is needed multiple times
    // If this is needed a lot throughout the org, I would consider puttting it into its own class
    static Map<String, Schema.SObjectType> globalDescribe;
    
	// Trying to not use the global describe in a utility since doing that is notoriously slow
    public static List<Schema.SObjectField> getAccessibleFields(Schema.SObjectType type) {
		Map<String, Schema.SObjectField> fieldMap = type.getDescribe().fields.getMap();
        List<Schema.SObjectField> result = new List<Schema.SObjectField>();
        for (Schema.SObjectField field : fieldMap.values()) {
            if (field.getDescribe().isAccessible()) {
				result.add(field);
            }
        }
        return result;
    }
    
    // If we need to get accessible fields using only a string, then we have no choice - global describe
    public static List<Schema.SObjectField> getAccessibleFields(String objectName) {
        if (globalDescribe == null) {
            globalDescribe = Schema.getGlobalDescribe();
        }
		return getAccessibleFields(globalDescribe.get(objectName));
    }
    	
    public static List<Schema.SObjectField> getEditableFields(Schema.SObjectType type) {
		Map<String, Schema.SObjectField> fieldMap = type.getDescribe().fields.getMap();
        List<Schema.SObjectField> result = new List<Schema.SObjectField>();
        for (Schema.SObjectField field : fieldMap.values()) {
            if (field.getDescribe().isUpdateable()) {
				result.add(field);
            }
        }
        return result;
    }
    
    public static List<Schema.SObjectField> getEditableFields(String objectName) {
        if (globalDescribe == null) {
            globalDescribe = Schema.getGlobalDescribe();
        }
		return getEditableFields(globalDescribe.get(objectName));
    }
    
}