# express_vue_mysql
start up mysql db
docker run --name mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=my_database -p 3306:3306 -d mysql:latest

wait till docker up successfully then create db
npm run migrate

create default users
npm run seed

start project
npm run start 
navigate to localhost:3000

default users
Role A: admin@example.com pw:admin123
Role U: user1@example.com pw:user123
Role U: user2@example.com pw:user123
