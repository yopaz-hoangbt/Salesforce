public with sharing class EmployeeController {
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> fetchEmployees() {
        return [SELECT Level__c, COUNT(Id) total FROM Employee__c GROUP BY Level__c];
    }

    @AuraEnabled(cacheable=true)
    public static List<LocationNew__c> getListLocation() {
        return [SELECT Name, Latitude__c, Longitude__c, Image__c FROM LocationNew__c];
    }

    @AuraEnabled
    public static void createLocation(String name, Decimal latitude, Decimal longitude) {
        try {
            LocationNew__c newLocation = new LocationNew__c(
                Name = name,
                Latitude__c = latitude,
                Longitude__c = longitude
            );
            insert newLocation;
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
}
