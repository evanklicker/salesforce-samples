public with sharing class PermissionsUtility {
    
    static Map<String, Schema.SObjectType> globalDescribe {
        get {
            return SchemaUtility.globalDescribe;
        }
    }
    
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
		return getAccessibleFields(globalDescribe.get(objectName));
    }
    	
    public static List<Schema.SObjectField> getUpdateableFields(Schema.SObjectType type) {
		Map<String, Schema.SObjectField> fieldMap = type.getDescribe().fields.getMap();
        List<Schema.SObjectField> result = new List<Schema.SObjectField>();
        for (Schema.SObjectField field : fieldMap.values()) {
            if (field.getDescribe().isUpdateable()) {
				result.add(field);
            }
        }
        return result;
    }
    
    public static List<Schema.SObjectField> getUpdateableFields(String objectName) {
		return getUpdateableFields(globalDescribe.get(objectName));
    }
    
    public static Boolean isObjectAccessible(String objectName) {
        return globalDescribe.get(objectName).getDescribe().isAccessible();
    }
    
    public static Boolean isObjectUpdateable(String objectName) {
        return globalDescribe.get(objectName).getDescribe().isUpdateable();
    }
    
    public static Boolean isFieldAccessible(String objectName, String fieldName) {
        return globalDescribe.get(objectName).getDescribe().fields.getMap().get(fieldName).getDescribe().isAccessible();
    }
    
    public static Boolean isFieldAccessible(String objectAndField) {
        List<String> names = objectAndField.split('.');
        return isFieldAccessible(names[0], names[1]);
    }
    
    public static Boolean isFieldUpdateable(String objectName, String fieldName) {
        return globalDescribe.get(objectName).getDescribe().fields.getMap().get(fieldName).getDescribe().isUpdateable();
    }
    
    // Supports strings of this format: `Account.ParentId` 
    // Also will support: `Account.Parent.MasterRecord.Owner.Name`
    public static Boolean isFieldUpdateable(String objectDotField) {
        System.debug(objectDotField);
        List<String> names = objectDotField.split('\\.');
        System.debug(names);
        if (names.size() == 2) {
        	return isFieldUpdateable(names[0], names[1]);
        } else if (names.size() < 2) {
            return false;
        }
        String first = names.remove(0);
        String second = names.remove(0);
        Schema.DescribeFieldResult field;
        List<Schema.SObjectField> fields = globalDescribe.get(first).getDescribe().fields.getMap().values();
        for (Schema.SObjectField f : fields) {
            if (f.getDescribe().getRelationshipName() == second) {
                field = f.getDescribe();
            }
        }
        if (field == null) {
            throw new PermissionsUtilityException('Malformed relationship name');
        }
        if (field.isNamePointing()) {
            throw new PermissionsUtilityException('This utility current cannot handle polymorphic relationship fields');
        }
        Schema.DescribeSobjectResult sobjecttype = field.getReferenceTo()[0].getDescribe();
        System.debug('recursing through ' + first + '.' + second);
        System.debug(sobjecttype);
        return sobjecttype.isUpdateable() &&
            isFieldUpdateable(first, field.getName()) && 
            isFieldUpdateable(sobjecttype.getName() + '.' + String.join(names, '.'));
    }
    
    
    
    public class PermissionsUtilityException extends Exception { }
    
}