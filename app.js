const PythonShell = require('python-shell');
const exec = require('child_process').exec;
setInterval(check_temp,3000);
let fun_enable = false;
function check_temp(){
	exec('cat /sys/class/thermal/thermal_zone0/temp', (err, stdout, sterr)=> {
		if (err) {
		    console.error(`exec error: ${err}`);
		    return;
		}

		const temp = Number(stdout.replace('\n',''));
		console.log(temp);

		const options = {};
		if(temp > 60 && !fun_enable){
			console.log("on fun");
			fun_enable = true;
			options.args = ["-r","-d",(temp > 70) ? "100" : "75", "-f","100"]
		}else if(temp < 50 && fun_enable){
			fun_enable = false;
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
	});
}
