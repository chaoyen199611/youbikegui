var map = L.map('map',{zoomControl:false}).setView([22.62418, 120.30883], 14);
let { marker } = require('leaflet');
var mysql=require('mysql2');


const ctx = document.getElementById('myChart');
const ctx1 = document.getElementById('myChart1');


const finalresults=[]
var stationblock=document.getElementById("mydiv");
var stationname=document.getElementById("stationname");
var total=document.getElementById("total");
var bike=document.getElementById("bike");
var free=document.getElementById("free");

var gc=document.getElementById("goodcount");
var sc=document.getElementById("sleepingcount");
var ub=document.getElementById("unbalancecount");

var list = document.getElementById("unbalance-list");
var weathertype = document.getElementById("wtype");
var temp = document.getElementById("temp");
var humidity = document.getElementById("humidity");
var tempmin = document.getElementById("tempmin");
var tempmax = document.getElementById("tempmax");
var pressure = document.getElementById("pressure");
var wind = document.getElementById("wind");
var cloud = document.getElementById("cloud");
var rain = document.getElementById("rain");

var unbalance=[];
var sleeping=[];

let date_ob = new Date();

let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);


var last=-1;
var markerlist=[];

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var safe = L.icon({
    iconUrl: './img/safe.png',
    iconSize:     [36, 36],
    popupAnchor:  [0, -16]
});

var nobike = L.icon({
    iconUrl: './img/nobike.png',
    iconSize:     [36, 36],
    popupAnchor:  [0, -16]
});

var nospace = L.icon({
    iconUrl: './img/nospace.png',
    iconSize:     [36, 36],
    popupAnchor:  [0, -16]
});

var sleep = L.icon({
    iconUrl:'./img/sleep.png',
    iconSize: [36,36],
    popupAnchor:  [0, -16]
})

var weathersql='SELECT * FROM last_weather';
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
                connection.query(weathersql,function(error,results,fields){
                    temp.innerHTML=results[0]["temp"];
                    humidity.innerHTML=results[0]["humidity"];
                    tempmin.innerHTML=results[0]["temp_min"];
                    tempmax.innerHTML=results[0]["temp_max"];
                    pressure.innerHTML=results[0]["pressure"];
                    wind.innerHTML=results[0]["wind"];
                    cloud.innerHTML=results[0]["cloud"];
                    rain.innerHTML =results[0]["rain"];
                    document.getElementById("wtype").innerHTML=results[0]["weather"];
                    
                })
                //initialize station info
                connection.query(sql,function(error,results,fields){
                    console.log("Connected to MySQL Server");
                    for(var i=0;i<results.length;i++){
                        var markericon;
                        if(finalresults[i].active==0){
                            markericon=sleep;
                            sleeping.push(finalresults[i]);
                        }
                        else{
                            if(finalresults[i].freespace==0){
                                markericon=nospace;
                                unbalance.push(finalresults[i])
                            }
                            else if(finalresults[i].bike==0){
                                markericon=nobike;
                                unbalance.push(finalresults[i]);
                            }
                            else{
                                markericon=safe;
                            }
                        }
                        var config={
                            icon:markericon,
                            customID:i
                        }
                        finalresults[i].stationID=results[i].id
                        finalresults[i].area=results[i].area
                        finalresults[i].name=results[i].name
                        marker = new L.marker([results[i].lat, 
                            results[i].lng],config)
                            .bindPopup(finalresults[i].name+" "+finalresults[i].stationID)
                            .addTo(map)
                            .on('click',function(){
                                map.setView(this.getLatLng(),15);
                                
                                
                                stationname.innerHTML = finalresults[this.options.customID].name;
                                total.innerHTML = "total: "+finalresults[this.options.customID].total;                               
                                bike.innerHTML = "bike: "+finalresults[this.options.customID].bike;             
                                free.innerHTML = "free: "+finalresults[this.options.customID].freespace;
                                if(stationblock.style.display==="none"||(last!=this.options.customID)){
                                    last=this.options.customID;
                                    stationblock.style.display="block";
                                }
                                else{
                                    stationblock.style.display="none";
                                }
                            });

                        markerlist.push(marker)
                        
                    }
                    

                    gc.innerHTML=1200-sleeping.length-unbalance.length;
                    sc.innerHTML=sleeping.length;
                    ub.innerHTML=unbalance.length;
                    var unable=sleeping.length+unbalance.length;
                    var htmlElements = '';
                    for (var i = 0; i < unbalance.length; i++) {
                        htmlElements += '<div id="list'+i+'"></div>'+'\n';
                    }                 
                    list.innerHTML = htmlElements;
                    for (var i = 0; i < unbalance.length; i++) {
                        var li=document.getElementById("list"+i);
                        li.innerHTML=unbalance[i].name;
                        li.style.color="aliceblue";
                    }             
                });

            }
            });
            

            setInterval(function() {
                
                connection.query(lastsql,function(error,results,fields){
                    unbalance=[];
                    sleeping=[];
                    for(var i=0;i<results.length;i++){
                        finalresults[i].freespace=results[i].freespace;
                        finalresults[i].bike=results[i].bike;
                        finalresults[i].active=results[i].active;
                        if(finalresults[i].active==0){
                            markerlist[i].setIcon(sleep);
                            sleeping.push(finalresults[i]);
                        }
                        else{
                            if(finalresults[i].freespace==0){
                                markerlist[i].setIcon(nospace);
                                unbalance.push(finalresults[i]);
                            }
                            else if(finalresults[i].bike==0){
                                markerlist[i].setIcon(nobike);
                                unbalance.push(finalresults[i]);
                            }
                            else{
                                markerlist[i].setIcon(safe);
                            }
                        }
 
                    }
                    var htmlElements = "";
                    for (var i = 0; i < unbalance.length; i++) {
                        htmlElements += '<div id="list'+i+'"></div>';
                    }                    
                    list.innerHTML = htmlElements;
                    for (var i = 0; i < unbalance.length; i++) {
                        var li=document.getElementById("list"+i);
                        li.innerHTML=unbalance[i].name;
                        li.style.color="aliceblue";
                    } 

                    gc.innerHTML=1200-sleeping.length-unbalance.length;
                    sc.innerHTML=sleeping.length;
                    ub.innerHTML=unbalance.length;

                    if(stationblock.style.display==="block"){
                        bike.innerHTML="bike: "+finalresults[last].bike;
                        free.innerHTML="free: "+finalresults[last].freespace;
                    }
                    console.log("update");
                })
                
            }, 30000);
        });

        
    }).connect(tunnelConfig);
});




function display_ct7() {
    var x = new Date()
    var ampm = x.getHours( ) >= 12 ? ' PM' : ' AM';
    hours = x.getHours( ) % 12;
    hours = hours ? hours : 12;
    hours=hours.toString().length==1? 0+hours.toString() : hours;
    
    var minutes=x.getMinutes().toString()
    minutes=minutes.length==1 ? 0+minutes : minutes;
    
    var seconds=x.getSeconds().toString()
    seconds=seconds.length==1 ? 0+seconds : seconds;
    
    var month=(x.getMonth() +1).toString();
    month=month.length==1 ? 0+month : month;
    
    var dt=x.getDate().toString();
    dt=dt.length==1 ? 0+dt : dt;
    
    var x1=month + "/" + dt + "/" + x.getFullYear(); 
    x1 = x1 + " - " +  hours + ":" +  minutes + ":" +  seconds + " " + ampm;
    document.getElementById('ct7').innerHTML = x1;
    display_c7();
}
function display_c7(){
        var refresh=1000; // Refresh rate in milli seconds
        mytime=setTimeout('display_ct7()',refresh)
}
display_c7()


new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1
        }]
    },
    options: {
        scales: {
        y: {
            beginAtZero: true
        }
        }
    }
});

new Chart(ctx1, {
    type: 'line',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1
        }]
    },
    options: {
        scales: {
        y: {
            beginAtZero: true
        }
        }
    }
});



    
