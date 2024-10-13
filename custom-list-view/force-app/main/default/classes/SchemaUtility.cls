public class SchemaUtility {
    
    private static Map<String, Schema.SObjectType> gd;
    public static Map<String, Schema.SObjectType> globalDescribe {
        get {
            if (gd == null) {
                gd = Schema.getGlobalDescribe();
            }
            return gd;
        }
        private set { }
    }
    
    public static Schema.DisplayType getType(String objectName, String fieldName) {
        return globalDescribe.get(objectName).getDescribe().fields.getMap().get(fieldName).getDescribe().getType();
    }
    
    public static String getLabel(String objectName, String fieldName) {
        return globalDescribe.get(objectName).getDescribe().fields.getMap().get(fieldName).getDescribe().getLabel();
    }
    
}