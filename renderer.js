let { marker, layerGroup, icon, latLng } = require('leaflet');
var mysql=require('mysql2');
const { Client } = require('ssh2');
const sshClient = new Client();


const ctx = document.getElementById('myChart');
const ctx1 = document.getElementById('myChart1');
const onehourchart = document.getElementById('hourchart');


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
var nobikelist=[];
var nospacelist=[];

let date_ob = new Date();

let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

var last=-1;

var btn_sel="btn-all";

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 16,
    minZoom: 14,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});



var allmarkergroup = L.layerGroup();
var unbalancemarkergroup = L.layerGroup();

var map = L.map('map',{
    zoomControl:false,
    center:[22.62418, 120.30883],
    zoom:14,
    layers:[osm,allmarkergroup]
});
var overlayMaps={
    "所有站點":allmarkergroup,
    "不平衡站點":unbalancemarkergroup
}
L.control.layers(overlayMaps).addTo(map);


var safe = L.icon({
    iconUrl: './img/safe.png',
    iconSize:     [36, 36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
});

var nobike = L.icon({
    iconUrl: './img/nobike.png',
    iconSize:     [36, 36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
});

var nospace = L.icon({
    iconUrl: './img/nospace.png',
    iconSize:     [36, 36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
});

var sleep = L.icon({
    iconUrl:'./img/sleep.png',
    iconSize: [36,36],
    iconAnchor: [18,36],
    popupAnchor:  [0, -16]
})

var truck = L.icon({
    iconUrl:'./img/truck.png',
    iconSize:[36,36],
    iconAnchor:[18,36],
})

var weathersql='SELECT * FROM last_weather';
var sql='SELECT id,name,area,lat,lng,bike,freespace,total,active FROM stationinfo INNER JOIN last_update ON stationinfo.id = last_update.stationID ORDER BY id ASC';
//var sql='SELECT * FROM stationinfo ORDER BY id ASC';
var lastsql='SELECT * FROM last_update ORDER BY stationID ASC';

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





// create a ssh connection to server
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

            //connect to mysql database    

            const connection =  mysql.createConnection({...dbServer,stream});
            
            connection.connect((error) => {
            if(error){
                console.log("error occurred", error);
            } 
            else{
                
                // connection.query(lastsql,function(error,results,fields){
                //     for(var i=0;i<results.length;i++){
                //         finalresults.push(results[i]);
                //     }
                // })
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
                        if(results[i].active==0){
                            markericon=sleep;
                            sleeping.push(results[i]);
                            unbalance.push(results[i]);
                        }
                        else{
                            if(results[i].freespace==0){
                                markericon=nospace;
                                unbalance.push(results[i])
                                nospacelist.push(results[i])
                            }
                            else if(results[i].bike==0){
                                markericon=nobike;
                                unbalance.push(results[i]);
                                nobikelist.push(results[i]);
                            }
                            else{
                                markericon=safe;
                            }
                        }
                        var config={
                            icon:markericon,
                            customID:i,
                            stationid:results[i].id,
                            name:results[i].name,
                            total:results[i].total,
                            freespace:results[i].freespace,
                            bike:results[i].bike,
                            active:results[i].active
                        }
                        //add new marker on the map
                        marker = new L.marker([results[i].lat, 
                            results[i].lng],config)
                            .bindPopup(results[i].name+" "+results[i].id)
                            .on('click',function(){
                                map.setView(this.getLatLng(),16);
                                var getstationsql = 'SELECT recordTime, (bike-freespace) as balance FROM station_record where recordTime > date_add(now(), interval 8 hour) - interval 1 hour and stationID =  ';
                                getstationsql+=this.options.stationid;

                                connection.query(getstationsql,function(error,results,fields){
                                    for(var i=0;i<results.length;i++){
                                        console.log(results[i].recordTime)
                                    }
                                })
                                stationname.innerHTML = this.options.name;
                                total.innerHTML = "total: "+this.options.total;                               
                                bike.innerHTML = "bike: "+this.options.bike;             
                                free.innerHTML = "free: "+this.options.freespace;
                                if(stationblock.style.display==="none"||(last!=this.options.customID)){
                                    last=this.options.customID;
                                    stationblock.style.display="block";
                                }
                                else{
                                    stationblock.style.display="none";
                                }
                        });
                        allmarkergroup.addLayer(marker);
                        if(markericon==nospace||markericon==nobike){
                            unbalancemarkergroup.addLayer(marker);
                        }
                        
                    }
                    gc.innerHTML=1201-sleeping.length-unbalance.length;
                    sc.innerHTML=sleeping.length;
                    ub.innerHTML=unbalance.length-sleeping.length;

                    createlist(btn_sel);                    
                    
                });
                
                //add truck dummy data, position at 美麗島站
                marker = new L.marker([22.6317876, 120.3038053],{icon:truck}).addTo(map);
                
            }
            });
            

            setInterval(function() {
                //request new table every 30sec
                connection.query(lastsql,function(error,results,fields){
                    allmarkergroup.eachLayer(function (layer){
                        layer.options.freespace=results[layer.options.customID].freespace;
                        layer.options.bike=results[layer.options.customID].bike;
                        layer.options.active=results[layer.options.customID].active;
                        if(layer.options.icon==nobike||layer.options.icon==nospace){
                            unbalancemarkergroup.removeLayer(layer);
                        }
                        if(layer.options.active==0){
                            layer.setIcon(sleep);
                        }
                        else{
                            if(layer.options.bike==0){
                                layer.setIcon(nobike);
                                unbalancemarkergroup.addLayer(layer);
                            }
                            else if(layer.options.freespace==0){
                                layer.setIcon(nospace);
                                unbalancemarkergroup.addLayer(layer);
                            }
                            else{
                                layer.setIcon(safe);
                            }
                        }
                        if(layer.options.customID==last){
                            if(stationblock.style.display==="block"){
                                bike.innerHTML="bike: "+layer.options.bike;
                                free.innerHTML="free: "+layer.options.freespace;
                            }
                        }
                    })
                    
                    // for(var i=0;i<results.length;i++){
                    //     if(finalresults[i].active==0){
                    //         markerlist[i].setIcon(sleep);
                    //         sleeping.push(finalresults[i]);
                    //         unbalance.push(finalresults[i]);
                    //     }
                    //     else{
                    //         if(finalresults[i].freespace==0){
                    //             unbalancemarkergroup.addLayer(markerlist[i])
                    //             markerlist[i].setIcon(nospace);
                                
                    //         }
                    //         else if(finalresults[i].bike==0){
                    //             unbalancemarkergroup.addLayer(markerlist[i])
                                
                    //         }
                    //         else{
                    //             markerlist[i].setIcon(safe);
                    //         }
                    //     }
 
                    // }

                    createlist(btn_sel);

                    gc.innerHTML=1201-sleeping.length-unbalance.length;
                    sc.innerHTML=sleeping.length;
                    ub.innerHTML=unbalance.length-sleeping.length;

                    // if(stationblock.style.display==="block"){
                    //     bike.innerHTML="bike: "+finalresults[last].bike;
                    //     free.innerHTML="free: "+finalresults[last].freespace;
                    // }
                    console.log("update");
                    if(error){
                        console.log(error);
                    }
                })
                
            }, 30000);
        });  
    }).connect(tunnelConfig);
});


var previous=document.getElementById("btn-all")

document.querySelectorAll('li button').forEach(occurence => {
    let id = occurence.getAttribute('id'); 
    occurence.addEventListener('click', function() {
        if(occurence.classList.contains("active")){
            console.log('A button with ID ' + id + ' was clicked!')
        }
        else{
            previous.classList.remove("active")
            occurence.classList.add("active")
            previous=occurence
            btn_sel=id;
            createlist(btn_sel);
        }
        
    } );
});

function createlist(btn){
    var htmlElements = "";
    if(btn=="btn-all"){
        for (var i = 0; i < unbalance.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (var i = 0; i < unbalance.length; i++) {
            var li=document.getElementById("list"+i);
            li.innerHTML=unbalance[i].stationID;
            li.style.color="aliceblue";
            if(unbalance[i].active==0){
                li.style.background="#35342F";
            }
            else{
                if(unbalance[i].freespace==0){
                    li.style.background="#E7C63C";
                }
                else if(unbalance[i].bike==0){
                    li.style.background="#E74C3C";
                }
            }
        } 
    }
    else if(btn=="btn-mod"){
        for (var i = 0; i < sleeping.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (var i = 0; i < sleeping.length; i++) {
            var li=document.getElementById("list"+i);
            li.innerHTML=sleeping[i].name;
            li.style.color="aliceblue";
            li.style.background="#35342F";
        } 
    }
    else if(btn=="btn-full"){
        for (var i = 0; i < nospacelist.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (var i = 0; i < nospacelist.length; i++) {
            var li=document.getElementById("list"+i);
            li.innerHTML=nospacelist[i].name;
            li.style.color="aliceblue";
            li.style.background="#E7C63C";
        } 
    }
    else{
        for (var i = 0; i < nobikelist.length; i++) {
            htmlElements += '<div id="list'+i+'"></div>';
        }                    
        list.innerHTML = htmlElements;
        for (var i = 0; i < nobikelist.length; i++) {
            var li=document.getElementById("list"+i);
            li.innerHTML=nobikelist[i].name;
            li.style.color="aliceblue";
            li.style.background="#E74C3C";
        } 
    }
}



function search_station(){
    var searchid = document.getElementById("site-search").value
    var nomatch=true;
    allmarkergroup.eachLayer(function (layer){
        if(searchid==layer.options.stationid){

            msg=document.getElementById("valid-msg");
            msg.style.opacity='1';
            setTimeout(()=>{
                msg.style.opacity = '0'
            },2000)
            stationname.innerHTML = layer.options.name;
            total.innerHTML = "total: "+layer.options.total;                               
            bike.innerHTML = "bike: "+layer.options.bike;             
            free.innerHTML = "free: "+layer.options.freespace;
            map.setView([layer._latlng.lat,layer._latlng.lng],16);
            layer.openPopup();
            last=layer.options.customID;
            stationblock.style.display="block";
            nomatch=false;
            
            
        }
    })
    // for(var i=0;i<markerlist.length;i++){
    //     if(Number(searchid)==markerlist[i].options.stationid){

    //         msg=document.getElementById("valid-msg");
    //         msg.style.opacity='1';
    //         setTimeout(()=>{
    //             msg.style.opacity = '0'
    //         },2000)
    //         stationname.innerHTML = finalresults[markerlist[i].options.customID].name;
    //         total.innerHTML = "total: "+finalresults[markerlist[i].options.customID].total;                               
    //         bike.innerHTML = "bike: "+finalresults[markerlist[i].options.customID].bike;             
    //         free.innerHTML = "free: "+finalresults[markerlist[i].options.customID].freespace;
    //         map.setView([markerlist[i]._latlng.lat,markerlist[i]._latlng.lng],16);
    //         markerlist[i].openPopup();
    //         last=markerlist[i].options.customID;
    //         stationblock.style.display="block";
    //         nomatch=false;
            
            
    //     }
        
    // }
    if(nomatch){
        msg=document.getElementById("invalid-msg");
        msg.style.opacity='1';
        setTimeout(()=>{
            msg.style.opacity = '0'
        },2000)
    }
}


// real-time clock function
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
            color:'#ffffff',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
        x: {
            ticks: {
                font: {
                    size:6
                }
            }
        },
        y: {
            beginAtZero: true
        }
        }
    }
});

var timeFormat='%HH:%MM';

new Chart(ctx1, {
    type: 'line',
    data: {
        datasets: [{
            label: '氣溫',
            data: [],
            borderWidth: 1
        }]
    },
    options: {
        maintainAspectRatio:false,
        responsive:true,
        plugins:{
            legend:{
                labels:{
                    boxWidth:20,
                    
                    
                    font:{
                        size:6
                    }
                }
            }
        }
    }
});

new Chart(hourchart, {
    type: 'line',
    data: {
        labels: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00','07:00'],
        datasets: [{
            label: '一小時站點平衡情況',
            data: [12, 19, 3, 5, 2, 3,-3],
            color:'#ffffff',
            borderWidth: 1
        }]
    },
    options: {
        plugins:{
            legend:{
                labels:{
                    boxWidth:20,
                    
                    color:'#ffffff',
                    font:{
                        size:6
                    }
                }
            }
        },
        scales: {
        x: {
            ticks: {
                color:"#ffffff",
                font: {
                    size:6
                }
            }
        },
        y: {
            min:-30,
            max:30,
            beginAtZero: true,
            ticks: {
                color:"#ffffff",
                font: {
                    size:6
                }
            }
        }
        }
    }
});



    
