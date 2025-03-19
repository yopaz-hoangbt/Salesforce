public class EmployeeTriggerHandler {
    public static void sendEmailNotification(List<Employee__c> employees) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Employee__c emp : employees) {
            if (String.isNotBlank(emp.Email__c)) {
                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                mail.setSubject('Welcome ' + emp.Name + ' to the Company!');
                mail.setPlainTextBody('Hello ' + emp.Name + ',\n\n' +
                                      'Welcome to our company! We are excited to have you on board.\n\n' +
                                      'Best Regards,\nCompany HR');
                mail.setToAddresses(new String[] { emp.Email__c });

                emails.add(mail);
            }
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}
