let five = require('johnny-five');
let raspi = require('raspi-io');
let Camera = require('camerapi');
let oxford = require('project-oxford');
let fs = require('fs');
let device = require('azure-iot-device');
let deviceAmqp = require('azure-iot-device-amqp');

let cogClient = new oxford.Client("a924b921478a4c6e9a24e088dbe14bb8");
let connectionString = "HostName=skalapa3iothub.azure-devices.net;DeviceId=Fridge;SharedAccessKey=sCnWCgKG/oSdNwaQinfTh2mC+OBszq/feTfbQ/WOkxg=";
let hubClient = deviceAmqp.clientFromConnectionString(connectionString);

//establishing connection to gpio
log('establishing connection to gpio...');
let board = new five.Board({ io: new raspi() });
board.on('ready', () => {
    let led = new five.Led('GPIO26');
    let button = new five.Button('GPIO20');
    led.stop().off();

    //open connection to iot hub
    log('connecting to iot hub...');
    hubClient.open(err => {
        if (err)
            log(err.message)
        else {
            log('READY');
            led.stop().off();

            let cam = new Camera();
            cam.baseFolder('.');
            button.on('press', () => {
                led.blink(500);
                log('taking a picture...');
                cam.takePicture('picture.png', (file, error) => {
                    if (error) log(error);
                    else {
                        //analyzing image
                        log('analyzing image...');
                        cogClient.vision.analyzeImage({ path: 'picture.png', Tags: true })
                            .then(result => {
                                fs.unlinkSync('picture.png'); //delete the picture

                                //sending message to iot hub
                                log('sending message to iot hub...');
                                let message = new device.Message(JSON.stringify({ deviceId: 'device1', tags: ['foo', 'baz', 'bar'] }));
                                hubClient.sendEvent(message, (err, res) => {
                                    if (err) log(err.message);
                                    else {
                                        log(`Sent ${JSON.stringify(result.tags)} to your IoT Hub`);
                                        log('READY');
                                    }
                                    led.stop().off();
                                });
                            })
                            .catch(err => {
                                log('error analyzing image... ' + err.message);
                                led.stop().off();
                            });
                    }
                });
            })
        }
    })
})

function log(msg) {
    console.log(msg);
}