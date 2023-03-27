var map = L.map('map').setView([22.62418, 120.30883], 14);
let { marker } = require('leaflet');
var mysql=require('mysql2');

const finalresults=[]

var last=-1;
var diff;
var markerlist={};

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var safe = L.icon({
    iconUrl: './img/safe.png',

    iconSize:     [36, 36]
});

var uns = L.icon({
    iconUrl: './img/uns.png',

    iconSize:     [36, 36]
});


var sql='SELECT * FROM stationinfo ORDER BY id ASC';
var lastsql='SELECT * FROM last_update ORDER BY stationID ASC';
// var connection = mysql.createConnection({
//     host:'127.0.0.1',
//     user: 'joeyhuang',
//     password:'open0813',
//     database:'youbike',
// });

// connection.connect();
const customPopup=[];

// connection.query(sql,function(error,results,fields){
//     if(error) console.log("error occurred", error);
//     else{
//         console.log("Connected to MySQL Server");
        
//         for(var i=0;i<results.length;i++){
//             var cp = {
//                 dsc: "<caption>站點資訊</caption><table><tr><th>站點名稱:</th><td>"+results[i].name+"</td></tr><tr><th>站點行政區:</th><td>"+results[i].area+"</td></tr><tr><th>站點ID:</th><td>"+results[i].id+"</td></tr><tr><th>經緯度:</th><td>"+results[i].lng+", "+results[i].lat+"</td></tr><tr><th>站點總車位數:</th><td>"+results[i].total_space+"</td></tr> </table>"
//             };
//             customPopup.push(cp)
//             marker = new L.marker([results[i].lat, results[i].lng])
//                 .bindPopup(`${customPopup[i].dsc}`)
//                 .addTo(map)
//                 .on('click',function(){
//                     map.setView(this.getLatLng(),15);
//                     var markerid=(this._leaflet_id-51)/2;
//                     stationblock=document.getElementById("mydiv");
//                     stationblock.innerHTML=`${customPopup[markerid].dsc}`
//                     if(stationblock.style.display==="none"||(last!=this._leaflet_id)){
//                         last=this._leaflet_id;
//                         stationblock.style.display="block";
//                     }else{
//                         stationblock.style.display="none";
//                     }
//                 });
//         }
//     }
// })

// connection.end();
const { Client } = require('ssh2');
const sshClient = new Client();
const dbServer = {
    host: '127.0.0.1',
    port: '3306',
    user: 'joey',
    password: 'open0813',
    database: 'youbike'
}
const tunnelConfig = {
    host: '10.1.30.250',
    port: 22,
    username: 'joey',
    password: 'open0813'
}
const forwardConfig = {
    srcHost: '127.0.0.1',
    srcPort: 3307,
    dstHost: dbServer.host,
    dstPort: dbServer.port
};
const SSHConnection = new Promise((resolve, reject) => {
    sshClient.on('ready', () => {
        sshClient.forwardOut(
        forwardConfig.srcHost,
        forwardConfig.srcPort,
        forwardConfig.dstHost,
        forwardConfig.dstPort,
        (err, stream) => {
             if (err) reject(err);
             const updatedDbServer = {
                 ...dbServer,
                 stream
            };
            const connection =  mysql.createConnection({...dbServer,stream});
            
            connection.connect((error) => {
            if(error){
                console.log("error occurred", error);
            } 
            else{
                
                connection.query(lastsql,function(error,results,fields){
                    for(var i=0;i<results.length;i++){
                        finalresults.push(results[i]);
                    }
                })
                //initialize station info
                connection.query(sql,function(error,results,fields){
                    console.log("Connected to MySQL Server");
                    for(var i=0;i<results.length;i++){
                        var markericon;
                        if(finalresults[i].freespace==0||finalresults[i].bike==0){
                            markericon=uns;
                        }
                        else{
                            markericon=safe;
                        }
                        var config={
                            icon:markericon,
                            customID:i
                        }
                        finalresults[i].stationID=results[i].id
                        finalresults[i].area=results[i].area
                        finalresults[i].name=results[i].name
                        marker = new L.marker([results[i].lat, results[i].lng],config)
                            .bindPopup(finalresults[i].name)
                            .addTo(map)
                            .on('click',function(){
                                map.setView(this.getLatLng(),15);
                                stationblock=document.getElementById("mydiv");
                                stationname=document.getElementById("stationname");
                                stationname.innerText = finalresults[this.options.customID].name;
                                //console.log(finalresults[this._leaflet_id-diff].name)

                                total=document.getElementById("total");
                                total.innerText = "total: "+finalresults[this.options.customID].total;
                                bike=document.getElementById("bike");
                                bike.innerText = "bike: "+finalresults[this.options.customID].bike;
                                free=document.getElementById("free");
                                free.innerText = "free: "+finalresults[this.options.customID].freespace;

                                console.log(finalresults[this.options.customID])
                                if(stationblock.style.display==="none"||(last!=this._leaflet_id)){
                                    last=this._leaflet_id;
                                    stationblock.style.display="block";
                                }
                                else{
                                    stationblock.style.display="none";
                                }
                            });
                        diff=marker._leaflet_id-i;
                    }
                    
                });
            }
            });
            

            setInterval(function() {
                connection.query(lastsql,function(error,results,fields){
                    for(var i=0;i<results.length;i++){
                        //finalresults[i].freespace=results[i].freespace;
                        //finalresults[i].bike=results[i].bike;
                        
                    }

                })
            }, 10000);
        });

        
    }).connect(tunnelConfig);
});
