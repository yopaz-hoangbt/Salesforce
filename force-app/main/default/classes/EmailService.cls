public class EmailService {
    public static void sendEmailToContact(String recipientEmail) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new String[] { recipientEmail });
        mail.setSubject('Notification from Salesforce - You have been added to the system.');
        mail.setPlainTextBody('Hello, \n\nYou have just been added to the Salesforce system as a contact. \n\nBest regards, \nSalesforce Admin');
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
}
