var map = L.map('map').setView([22.62418, 120.30883], 14);
const mysql=require('mysql');
// const mysql=require('mysql2');
// const {Client} = require('ssh2');
// const sshClient=new Client();

// const dbServer = {
//     host:'10.1.30.250',
//     user:'joey',
//     port:3307,
//     password:'open0813',
//     database:'youbike'
// }

// const tunnelConfig = {
//     host:"10.1.30.250",
//     user:'joey',
//     port:22,
//     password:'open0813'
// }

// const forwardConfig = {
//     srcHost: '127.0.0.1',
//     srcPort: 3306,
//     dstHost: dbServer.host,
//     dstPort: dbServer.port
// }

// const SSHConnection = new Promise((resolve,reject) =>{
//     sshClient.on('ready',()=>{
//         sshClient.forwardOut(
//             forwardConfig.srcHost,
//             forwardConfig.srcPort,
//             forwardConfig.dstHost,
//             forwardConfig.dstPort,
//             (err,stream) => {
//                 if(err) reject(err);

//                 const updatedServer = {
//                     ...dbServer,
//                     stream
//                 };

//                 const connection=mysql.createConnection(updatedServer);

//                 connection.connect((error)=>{
//                     if(error){
//                         reject(error);
//                     }
//                     resolve(connection);
//                 });
//             });
//     }).connect(tunnelConfig);
// });

var last=-1;

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const locations = [];
var sql='SELECT * FROM stationinfo';

var connection = mysql.createConnection({
    host:'127.0.0.1',
    user: 'joeyhuang',
    password:'open0813',
    database:'youbike',
});

connection.connect();
var customPopup=[];

connection.query(sql,function(error,results,fields){
    if(error) console.log("error occurred", error);
    else{
        console.log("Connected to MySQL Server");
        
        for(var i=0;i<results.length;i++){
            var cp = {
                dsc: "<caption>站點資訊</caption><table><tr><th>站點名稱:</th><td>"+results[i].name+"</td></tr><tr><th>站點行政區:</th><td>"+results[i].area+"</td></tr><tr><th>站點ID:</th><td>"+results[i].id+"</td></tr><tr><th>經緯度:</th><td>"+results[i].lng+", "+results[i].lat+"</td></tr><tr><th>站點總車位數:</th><td>"+results[i].total_space+"</td></tr> </table>"
            };
            customPopup.push(cp)
            marker = new L.marker([results[i].lat, results[i].lng])
                .bindPopup(`${customPopup[i].dsc}`)
                .addTo(map)
                .on('click',function(){
                    map.setView(this.getLatLng(),15);
                    var markerid=(this._leaflet_id-51)/2;
                    stationblock=document.getElementById("mydiv");
                    stationblock.innerHTML=`${customPopup[markerid].dsc}`
                    if(stationblock.style.display==="none"||(last!=this._leaflet_id)){
                        last=this._leaflet_id;
                        stationblock.style.display="block";
                    }else{
                        stationblock.style.display="none";
                    }
                });
        }
    }
})

connection.end();


// for (var i = 0; i < locations.length; i++) {
//     marker = new L.marker([locations[i][1], locations[i][2]])
//       .bindPopup(locations[i][0])
//       .addTo(map);
// }