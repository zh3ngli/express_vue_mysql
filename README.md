# express_vue_mysql
<h3>start up mysql db</h3>

docker run --name mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=my_database -p 3306:3306 -d mysql:latest

<h3>wait till docker up successfully then create db</h3>

npm run migrate

<h3>create default users</h3>

npm run seed

<h3>start project</h3>

npm run start 

navigate to localhost:3000

<h3>default users</h3>

Role A: admin@example.com pw:admin123

Role U: user1@example.com pw:user123

Role U: user2@example.com pw:user123
