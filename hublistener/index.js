"use strict";
const eh = require('azure-event-hubs');
let connectionString = 'HostName=skalapa3iothub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=CPxsOs1QtbIy6I8qctXZFjOa3EO/mpxMaP6687848HI=';
var client = eh.Client.fromConnectionString(connectionString);
client.open()
    .then(client.getPartitionIds.bind(client))
    .then(function (partitionIds) {
    return partitionIds.map(function (partitionId) {
        return client.createReceiver('$Default', partitionId, { 'startAfterTime': Date.now() })
            .then(function (receiver) {
            console.log('Created partition receiver: ' + partitionId);
            receiver.on('errorReceived', err => console.log(err.message));
            receiver.on('message', m => console.log(JSON.stringify(m.body)));
        });
    });
})
    .catch(err => console.log(err.message));
//# sourceMappingURL=index.js.map