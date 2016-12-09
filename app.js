

const PythonShell = require('python-shell');
const exec = require('child_process').exec;
let fun_enable = false;


const Waterline = require('waterline'), 
	  app = {};
// Instantiate a new instance of the ORM
var orm = new Waterline();


//////////////////////////////////////////////////////////////////
// WATERLINE CONFIG
//////////////////////////////////////////////////////////////////

// Require any waterline compatible adapters here
var diskAdapter = require('sails-postgresql');


// Build A Config Object
var config = {

  // Setup Adapters
  // Creates named adapters that have been required
  adapters: {
    'default': diskAdapter,
    'sails-postgresql': diskAdapter
  },

  // Build Connections Config
  // Setup connections using the named adapter configs
  connections: {
    myLocalPostgres: {
      adapter: 'sails-postgresql',
      host: 'localhost',
      database: 'Sensors',
      user:'orangepi',
      password: require('./password.json').value
    }
  },

  defaults: {
    migrate: 'alter'
  }

};

//////////////////////////////////////////////////////////////////
// WATERLINE MODELS
//////////////////////////////////////////////////////////////////

var cpu_temp = Waterline.Collection.extend({

  identity: 'cpu_temp',
  connection: 'myLocalPostgres',

  attributes: {
    value: 'integer'
  }
});


orm.loadCollection(cpu_temp);

// Start Waterline passing adapters in
orm.initialize(config, function(err, models) {
  if(err) throw err;

  let current_cpu_temp = 0; 
  app.models = models.collections;
  app.connections = models.connections;

  setInterval(function check_temp(){
	exec('cat /sys/class/thermal/thermal_zone0/temp', (err, stdout, sterr)=> {
		if (err) {
		    console.error(`exec error: ${err}`);
		    return;
		}

		const temp = Number(stdout.replace('\n',''));
		console.log(temp);
		if((temp - current_cpu_temp) > 5 || (current_cpu_temp - temp) > 5){
			current_cpu_temp = temp;
			app.models.cpu_temp.create({value:temp}).exec((err,res)=>{ console.log('log to db');});
		}
		const options = {};
		if(temp > 65 && !fun_enable){
			console.log("on fun");
			fun_enable = true;
			options.args = ["-r","-d",(temp > 60) ? "100" : "75", "-f","100"];
		}else if((temp < 52 && fun_enable) || temp < 50){
			fun_enable = false;
			options.args = ["-s"];
			console.log("off fun");
		}else{
			return;
		}
		var PythonShell = require('python-shell');
		var pyshell = new PythonShell('pwm_hard.py',options);

		// sends a message to the Python script via stdin
		pyshell.send('hello');

		pyshell.on('message', function (message) {
		  // received a message sent from the Python script (a simple "print" statement)
		  console.log(message);
		});

		// end the input stream and allow the process to exit
		pyshell.end(function (err) {
		  if (err) console.log(err);
		  console.log('finished');
		});
		/*exec('python pwm_hard.py', (err, stdout, sterr)=> {
			if (err) {
			    console.error(`exec error: ${err}`);
			    return;
			}
			console.log(`stdout: ${stdout}`);
	  		console.log(`stderr: ${stderr}`);
			

		});*/
	})},3000);

  console.log("FUN service started");
});