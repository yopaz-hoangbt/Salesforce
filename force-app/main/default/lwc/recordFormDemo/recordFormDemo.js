import { LightningElement, wire, track } from 'lwc';
import {getListUi} from 'lightning/uiListApi'
import CONTACT_OBJECT from '@salesforce/schema/Contact'
import TITLE_FIELD from '@salesforce/schema/Contact.Title'
import NAME_FIELD from '@salesforce/schema/Contact.Name'
import {deleteRecord, updateRecord} from 'lightning/uiRecordApi'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import generatePDF from '@salesforce/apex/pdfController.generatePDF'

export default class GetListUiDemoLwc extends LightningElement {
    @track isModalOpen = false;
    @track selectedContactId;
    //@track editName = '';
    @track editEmail = '';
    @track editTitle = '';
    @track editPhone = '';
    @track filterBy = NAME_FIELD;
    filteredData=[]
    timer
    contacts=[]
    pageToken = null
    nextPageToken = null
    previousPageToken = null
    @wire(getListUi, {
        objectApiName:CONTACT_OBJECT,
        listViewApiName:'AllContacts',
        pageSize:10,
        sortBy:'$filterBy',
        pageToken:'$pageToken'
    })
    listViewHandler({data, error}){
        if(data){
            console.log(data)
            this.contacts = data.records.records
            this.nextPageToken = data.records.nextPageToken
            this.previousPageToken = data.records.previousPageToken
        }
        if(error){
            console.error(error)
        }
    }
    handlePreviousPage(){
        this.pageToken = this.previousPageToken
    }
    handleNextPage(){
        this.pageToken = this.nextPageToken
    }

    handleEdit(event) {
        this.selectedContactId = event.target.dataset.id;
        this.isModalOpen = true;
    }

    get FilterByOptions(){
        return [
            {label:"All", value:'All'},
            {label:"Id", value:'Id'},
            {label:'Name', value:'Name'},
            {label:'Title', value:'Title'},
            {label:'Email', value:'Email'}
        ]
    }

    get sortByOptions(){
        return [
            {label:"Id", value:'Id'},
            {label:'Name', value:'Name'},
            {label:'Title', value:'Title'},
            {label:'Email', value:'Email'}
        ]
    }

    handleDelete(event) {
        const contactId = event.target.dataset.id;
        deleteRecord(contactId).then(()=>{
            this.showToast("Sucess!!", "Deleted Successfully!!", 'success')
        }).catch(error=>{
            console.error(error)
            this.showToast("Error!!", "Error Occurred!!", 'error')
        })
    }

    pdfHandler() {
        let content = this.template.querySelector('.container_contact');
        
        let htmlContent = content.outerHTML;
        htmlContent = htmlContent.replace(/<lightning-button[^>]*>/g, '<button>');
        htmlContent = htmlContent.replace(/<\/lightning-button>/g, '</button>');
        

        generatePDF({ recordId: '003NS00000TcpK9YAJ', htmlData: htmlContent }).then(result => {
            console.log("Attachment ID", result);
            window.open(`https://hoangbt-dev-ed.develop.file.force.com/servlet/servlet.FileDownload?file=${result.Id}`);
        }).catch(error => {
            console.error(error);
        });
    }

    filterbyHandler(event){
        console.log("==2", event.target.value)
        this.filterBy = event.target.value
    }

    filterHandler(event){
        const {value} = event.target
        window.clearTimeout(this.timer)
        if(value){
            this.timer = window.setTimeout(()=>{
                console.log("===1", value)
                this.contacts = this.contacts.filter(eachObj=>{
                    if(this.filterBy === 'All'){
                        /**Below logic will filter each and every property of object */
                        return Object.keys(eachObj).some(key=>{
                            return eachObj[key].toLowerCase().includes(value)
                        })
                    } else {
                         /**Below logic will filter only selected fields */
                        const val = eachObj[this.filterBy] ? eachObj[this.filterBy]:''
                        return val.toLowerCase().includes(value)
                    }
                })
            }, 500)
            
        } else {
            this.contacts = [...this.contacts]
        }
        
    }

    /****sorting logic */
    sortHandler(event){
        this.sortedBy = event.target.value
        this.contacts = [...this.sortBy(this.contacts)]
    }

    sortBy(data){
        const cloneData = [...data]
        cloneData.sort((a,b)=>{
            if(a[this.sortedBy] === b[this.sortedBy]){
                return 0
            }
            return this.sortDirection === 'desc' ? 
            a[this.sortedBy] > b[this.sortedBy] ? -1:1 :
            a[this.sortedBy] < b[this.sortedBy] ? -1:1
        })
        return cloneData
    }


    showToast(title, message, variant){
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }))
    }

    handleEdit(event) {
        this.selectedContactId = event.target.dataset.id;
        const selectedContact = this.contacts.find(contact => contact.fields.Id.value === this.selectedContactId);
        if (selectedContact) {
            this.editEmail = selectedContact.fields.Email.value;
            this.editTitle = selectedContact.fields.Title.value;
            this.editPhone = selectedContact.fields.Phone.value;
            this.isModalOpen = true;
        }
    }

    handleInputChange(event) {
        const field = event.target.dataset.field;
        if (field === 'Phone') {
            this.editPhone = event.target.value;
        } else if (field === 'Email') {
            this.editEmail = event.target.value;
        } else if (field === 'Title') {
            this.editTitle = event.target.value;
        }
    }

    closeModal() {
        this.isModalOpen = false;
        this.selectedContactId = null;
    }

    saveRecord() {
        const fields = {
            Id: this.selectedContactId,
            Email: this.editEmail,
            Phone: this.editPhone
        };

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isModalOpen = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Contact updated successfully',
                        variant: 'success',
                    })
                );
            })
            .catch(error => {
                console.error('Error updating contact', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to update contact',
                        variant: 'error',
                    })
                );
            });
    }
}
