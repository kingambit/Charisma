from flask import Flask, render_template
from flask import jsonify
from flask import json
from flask import request
from flask import Response
from flask_pymongo import PyMongo


app = Flask(__name__)

app.config['MONGO_DBNAME'] = 'Charisma'
app.config['MONGO_URI'] = 'mongodb://localhost:27017/Charisma'

if __name__ == "__main__":
    app.run()
else:
    application = app

mongo = PyMongo(app)


@app.route('/')
def index():
    print("THIS IS TEST\n")
    return "<h1 style='color:blue'>Hello There!</h1>"


@app.route('/upload', methods=['POST'])
def upload():
    #
    # Preparing for possible data incompatibility, get binary Data// and convert it manually
    # into the JSON object, this way we could work around True/true and Date adjustment
    #
    #req_json = request.get_json();
    if request.is_json == True :
        req_str = request.data.decode("utf-8")
        req_json = json.loads(req_str)
        print(req_json)
        #check if header file is specified
        if ( req_json['ffiles'][0]['header'] == 1 ) :
        	# read JSON
        	fname = req_json['ffiles'][0]['publicPath']
         	if ( req_json['ffiles'][0]['type'] == "json" ) :
        	    with open(fname) as f:
   				    header = json.load(f)
            else :
                

        	# if _objId is there, update the object, otherwise, insert
         	db_header = {}
            db_header['BridgeInformation'] = header['BridgeInformation']
            db_header['DeckInformation'] = header['DeckInformation']
            db_header['TestInformation'] = header['TestInformation']
            db_header['SensorInformation'] = header['SensorInformation']
            db_objects = mongo.db.Objects
            retobj = db_objects.insert_one(db_header)
        
        
        # start conversion and insertion, get ObjId of the header file
        req_json['ffiles'][0]['objId'] = "123456";
        return Response(json.dumps(req_json['ffiles'][0]), status=200, mimetype = 'application/json')
    else:
        return Response(jsonify({'message':'not JSON argument'}), status = 500, mimetype = 'application/json')

    #print(jsonify(req_data))
    #return json.dumps({'name': 'alice',
    #                   'email': 'alice@outlook.com'})
    #req_data['objId'] = "123456";
    #print(json.dumps(req_data, indent = 3))
    #collection.insert_one(req_data).inserted_id
    #return ('', 204)


#def application(env, start_response):
#    start_response('200 OK', [('Content-Type','text/html')])
#    return [b"CHARISMA Rest API"]

#ALLOWED_EXTENSIONS = set(['xml', 'txt', 'csv'])

#def allowed_file(filename):
# return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
