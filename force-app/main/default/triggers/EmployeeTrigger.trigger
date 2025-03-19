trigger EmployeeTrigger on Employee__c (after insert) {
    for (Employee__c e : Trigger.new) {
        if (e.Email__c != null) {
            EmailService.sendEmailToContact(e.Email__c);
        }
    }
}
