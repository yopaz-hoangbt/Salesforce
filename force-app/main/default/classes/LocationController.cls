public with sharing class LocationController {
   public static List<Account> getLocations(){
       return [SELECT Id, Name, description, BillingStreet, 
       BillingCountry, BillingCity, BillingState,
       BillingPostalCode FROM Account ORDER BY Name LIMIT 10];
   }
}
