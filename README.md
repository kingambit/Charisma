# Charisma
Charisma project

1. Install Node.js and javascript dependencies
  Download Node.js and install according to: https://nodejs.org/en/download/
  Install dependencies like
  npm install utf8
  
2. Run Node.js
  node charisma.js
  Will run web server on 3000 local port http://localhost:3000/
  
3. Install Mongo
  Download and install according to https://www.mongodb.com/docs/manual/installation/
  
4. Run mongo
  mongod --fork --logpath ~/data/db/mongod.log --dbpath ~/data/db
  
5. install nginx
  Download and install nginx according to: https://www.nginx.com/resources/wiki/start/topics/tutorials/install/
  
6. install flask
  https://linuxize.com/post/how-to-install-flask-on-ubuntu-20-04/
  
7. install dependencies 
  https://readgssi.readthedocs.io/en/latest/installing.html
  Personally I preferred conda environment
  
8. install uwsgi
  Download and install uwsgi according to: https://uwsgi-docs.readthedocs.io/en/latest/Install.html
  
9. Run uwsgi
  uwsgi daemon.ini
  it runs flask on the port 8081
  
10. Go to http://localhost:3000/
