const defaultData = {
    visible: false,
    email: '',
    password: ''
}

const app = Vue.createApp({
    data() {
        return defaultData
    },
    methods: {
        login() {
            let json = {
                email: this.email,
                password: this.password
            }
            fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(json)
            })
                .then((resp) => {
                    return resp.json();
                })
                .then((resp) => {
                    if (resp.status == 200) {
                        window.location.href = `/admin/listings?id=${resp.user_id}`
                    }
                    else alert(JSON.stringify(resp))
                })
        }
    }
});
const vuetify = Vuetify.createVuetify();
app.use(vuetify).mount('#App')