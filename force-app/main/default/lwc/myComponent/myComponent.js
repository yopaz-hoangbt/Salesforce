import { LightningElement, track } from 'lwc';

const columns = [
    { label: 'Name', fieldName: 'name', editable: true },
    { label: 'Email', fieldName: 'email', editable: true },
    { label: 'Phone', fieldName: 'phone', editable: true },
    {
        type: 'button',
        typeAttributes: {
            label: 'Edit',
            name: 'edit',
            iconName: 'utility:edit',
            variant: 'brand'
        }
    },
    {
        type: 'button',
        typeAttributes: {
            label: 'Delete',
            name: 'delete',
            iconName: 'utility:delete',
            variant: 'destructive'
        }
    }
];

export default class MyComponent extends LightningElement {
    @track employees = [
        { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890' },
        { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '098-765-4321' }
    ];

    @track isModalOpen = false;
    columns = columns;

    handleAdd() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleSuccess(event) {
        // Logic to handle successful save
        this.isModalOpen = false;
        // Refresh the employee list or add the new employee to the list
    }

    handleSave(event) {
        // Logic to save the edited employee
        const updatedFields = event.detail.draftValues;
        this.employees = this.employees.map(emp => {
            const updatedField = updatedFields.find(field => field.id === emp.id);
            return updatedField ? { ...emp, ...updatedField } : emp;
        });
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'edit') {
            // Logic to edit the employee
        } else if (actionName === 'delete') {
            this.employees = this.employees.filter(emp => emp.id !== row.id);
        }
    }
}
