import { LightningElement, api, wire, track } from 'lwc';
import chartJs from '@salesforce/resourceUrl/chartJs'
import { loadScript } from 'lightning/platformResourceLoader'
import fetchEmployees from '@salesforce/apex/EmployeeController.fetchEmployees'

export default class Charts extends LightningElement {
    isChartJsInitialized = false;
    chart;
    @api type;
    @api chartHeading;
    @track chartLabels = [];
    @track chartData = [];
    dataChart = [];

    @wire(fetchEmployees)
    employeeHandler({ data, error }) {
        if (data) {
            this.dataChart = data;
            this.updateChartData();
        }
        if (error) {
            console.error(error);
        }
    }

    // Getter để lấy danh sách levels
    get processedLevels() {
        if (this.dataChart && Array.isArray(this.dataChart)) {
            return this.dataChart.map(x => x.Level__c);
        }
        return [];
    }

    // Getter để lấy số lượng của từng Level
    get processedCounts() {
        if (this.dataChart && Array.isArray(this.dataChart)) {
            return this.dataChart.map(x => x.total);
        }
        return [];
    }

    renderedCallback() {
        if (this.isChartJsInitialized) {
            return;
        }
        loadScript(this, chartJs + '/chartJs/Chart.js')
            .then(() => {
                console.log("chartJs loaded successfully");
                this.isChartJsInitialized = true;
                this.loadCharts();
            })
            .catch(error => {
                console.error(error);
            });
    }

    updateChartData() {
        this.chartLabels = this.processedLevels;
        this.chartData = this.processedCounts;

        if (this.chart) {
            this.chart.data.labels = this.chartLabels;
            this.chart.data.datasets[0].data = this.chartData;
            this.chart.update();
        }
    }

    loadCharts() {
        window.Chart.platform.disableCSSInjection = true;

        const canvas = document.createElement('canvas');
        this.template.querySelector('div.chart').appendChild(canvas);
        const ctx = canvas.getContext('2d');

        this.chart = new window.Chart(ctx, this.config());
    }

    config() {
        return {
            type: this.type,
            data: {
                labels: this.chartLabels, // Gán labels từ dữ liệu động
                datasets: [{
                    label: 'Số lượng nhân viên theo Level',
                    data: this.chartData, // Gán data từ dữ liệu động
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                legend: {
                    position: 'right'
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };
    }
}
