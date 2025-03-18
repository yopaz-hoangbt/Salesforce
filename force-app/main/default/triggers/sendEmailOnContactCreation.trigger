trigger sendEmailOnContactCreation on Contact (after insert) {
    for (Contact con : Trigger.new) {
        if (con.Email != null) {
            EmailService.sendEmailToContact(con.Email);
        }
    }
}
