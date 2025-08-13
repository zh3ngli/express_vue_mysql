const defaultData = {
    dialog: false,
    dialogTitle: '',
    name: '',
    latitude: '',
    longitude: '',
    rules_latitude: [val => val >= -90 && val <= 90 || 'range: -90 to 90'],
    rules_longitude: [val => val >= -180 && val <= 180 || 'range: -180 to 180'],
}

const app = Vue.createApp({
    data() {
        return defaultData
    },
    methods: {
        closeDialog() {
            this.dialog = false;
            this.resetForm();
        },
        submitForm() {
            if (this.dialogTitle == 'New Listing') {
                let json = {
                    user_id: user_id,
                    name: this.name,
                    latitude: this.latitude,
                    longitude: this.longitude
                }
                // console.log(json);

                fetch("/newListing", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(json)
                })
                    .then(resp => {
                        return resp.json()
                    })
                    .then(resp => {
                        this.dialog = false;
                        if (resp.status == 200) {
                            window.location.reload()
                        }
                        else alert(resp.message);
                    })
            }
            else {
                let json = {
                    id: this.dialogTitle.split(': ')[1],
                    name: this.name,
                    latitude: this.latitude,
                    longitude: this.longitude
                }
                // console.log(json);

                fetch("/updateListing", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(json)
                })
                    .then(resp => {
                        return resp.json()
                    })
                    .then(resp => {
                        this.dialog = false;
                        if (resp.status == 200) {
                            window.location.reload()
                        }
                        else alert(resp.message);
                    })
            }
        },
        resetForm() {
            this.name = '';
            this.latitude = '';
            this.longitude = '';
        },
        editRow(item) {
            this.dialog = true;
            this.dialogTitle = `Edit Work ID: ${item.id}`;
            this.name = item.name;
            this.latitude = item.latitude;
            this.longitude = item.longitude;
        },
        deleteRow(item) {
            // console.log(item);
                fetch("/deleteListing", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(item)
                })
                    .then(resp => {
                        return resp.json()
                    })
                    .then(resp => {
                        this.dialog = false;
                        if (resp.status == 200) {
                            window.location.reload()
                        }
                        else alert(resp.message);
                    })
        }
    },
    computed: {
        isBlank() {
            if (this.name == '' || this.latitude == '' || this.longitude == ''
                || this.rules_latitude.every(rule => rule(this.latitude) !== true)
                || this.rules_longitude.every(rule => rule(this.longitude) !== true)
            ) {
                return true
            }
            return false
        }
    }
});
const vuetify = Vuetify.createVuetify();
app.use(vuetify).mount('#App')